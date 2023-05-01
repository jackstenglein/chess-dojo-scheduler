package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
)

var repository database.EventCanceler = database.DynamoDB

const funcName = "event-cancel-handler"

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	info := api.GetUserInfo(request)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(funcName, err), nil
	}

	id, ok := request.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err), nil
	}

	event, err := repository.GetEvent(id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if event.Type == database.EventTypeDojo {
		err := errors.New(400, "Invalid request: this event type cannot be canceled", "")
		return api.Failure(funcName, err), nil
	}

	if event.MaxParticipants > 1 {
		err := errors.New(400, "Invalid request: group meetings cannot be canceled", "")
		return api.Failure(funcName, err), nil
	}

	if len(event.Participants) == 0 {
		err := errors.New(400, "Invalid request: nobody has booked this availability. Delete it instead", "")
		return api.Failure(funcName, err), nil
	}

	if event.Owner != info.Username && event.Participants[0].Username != info.Username {
		err := errors.New(403, "Invalid request: user is not a participant in this meeting", "")
		return api.Failure(funcName, err), nil
	}

	event, err = repository.CancelEvent(event)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.RecordEventCancelation(event); err != nil {
		log.Error("Failed RecordEventCancelation: ", err)
	}

	var opponentUsername = event.Owner
	if info.Username == event.Owner {
		opponentUsername = event.Participants[0].Username
	}
	if err := discord.SendCancellationNotification(opponentUsername, event.Id); err != nil {
		log.Error("Failed SendCancellationNotification: ", err)
	}

	return api.Success(funcName, event), nil
}

func main() {
	lambda.Start(Handler)
}
