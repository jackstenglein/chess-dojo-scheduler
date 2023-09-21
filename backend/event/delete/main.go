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

const funcName = "event-delete-handler"

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

	if event.Type == database.EventTypeDojo || event.Type == database.EventTypeLigaTournament {
		user, err := repository.GetUser(info.Username)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		if !user.IsAdmin && !user.IsCalendarAdmin {
			err := errors.New(403, "You do not have permission to delete dojo events", "")
			return api.Failure(funcName, err), nil
		}
	} else if event.Owner != info.Username {
		err := errors.New(403, "You do not have permission to delete this availability", "")
		return api.Failure(funcName, err), nil
	}

	event, err = repository.DeleteEvent(id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err = repository.RecordEventDeletion(event); err != nil {
		log.Error("Failed RecordEventDeletion: ", err)
	}

	if err = discord.DeleteMessage(event.DiscordMessageId); err != nil {
		log.Error("Failed discord.DeleteMessage: ", err)
	}

	if err = discord.DeleteEvents(event.PrivateDiscordEventId, event.PublicDiscordEventId); err != nil {
		log.Error("Failed discord.DeleteEvents: ", err)
	}

	return api.Success(funcName, nil), nil
}

func main() {
	lambda.Start(Handler)
}
