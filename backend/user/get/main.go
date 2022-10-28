package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.UserGetter = database.DynamoDB

const funcName = "user-get-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	username, public := event.PathParameters["username"]
	if !public {
		info := api.GetUserInfo(event)
		username = info.Username
	}

	if username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(funcName, err), nil
	}

	user, err := repository.GetUser(username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), err
}

func main() {
	lambda.Start(Handler)
}
