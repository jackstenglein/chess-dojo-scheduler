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

var repository database.EventDeleter = database.DynamoDB

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Infof("Request: %#v", request)

	info := api.GetUserInfo(request)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(err), nil
	}

	id, ok := request.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err), nil
	}

	event, err := repository.GetEvent(id)
	if err != nil {
		return api.Failure(err), nil
	}

	if event.Type == database.EventType_Dojo || event.Type == database.EventType_LigaTournament {
		user, err := repository.GetUser(info.Username)
		if err != nil {
			return api.Failure(err), nil
		}
		if !user.IsAdmin && !user.IsCalendarAdmin {
			err := errors.New(403, "You do not have permission to delete dojo events", "")
			return api.Failure(err), nil
		}
	} else if event.Owner != info.Username {
		err := errors.New(403, "You do not have permission to delete this availability", "")
		return api.Failure(err), nil
	}

	if len(event.Participants) > 0 {
		err := errors.New(400, "Invalid request: events with participants cannot be deleted. Cancel or leave the meeting instead.", "")
		return api.Failure(err), nil
	}

	event, err = repository.DeleteEvent(id)
	if err != nil {
		return api.Failure(err), nil
	}

	if err = repository.RecordEventDeletion(event); err != nil {
		log.Error("Failed RecordEventDeletion: ", err)
	}

	if err = discord.DeleteEventNotification(event); err != nil {
		log.Error("Failed discord.DeleteMessage: ", err)
	}

	if err = discord.DeleteEvents(event.PrivateDiscordEventId, event.PublicDiscordEventId); err != nil {
		log.Error("Failed discord.DeleteEvents: ", err)
	}

	return api.Success(nil), nil
}

func main() {
	lambda.Start(Handler)
}
