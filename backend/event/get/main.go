package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.EventGetter = database.DynamoDB

const funcName = "event-get-handler"

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
		return api.Success(funcName, &event), nil
	}

	if event.Owner == info.Username {
		return api.Success(funcName, &event), nil
	}

	for _, p := range event.Participants {
		if p.Username == info.Username {
			return api.Success(funcName, &event), nil
		}
	}

	err = errors.New(403, "Invalid request: user is not a member of this meeting", "")
	return api.Failure(funcName, err), nil
}

func main() {
	lambda.Start(Handler)
}
