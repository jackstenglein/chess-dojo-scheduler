package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "user-set-handler"

var repository database.UserUpdater = database.DynamoDB

// var repository database.UserSetter = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	// user now contains DB user data
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	originalIsAdmin := user.IsAdmin

	// generates a new struct with Username populated by the resolved username
	// we will then populate this struct with what was sent from the client which allows for a granular update from the client
	update := &database.User{
		Username: user.Username,
	}
	err = json.Unmarshal([]byte(event.Body), &update)

	if err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
		return api.Failure(funcName, err), nil
	}

	if user.Username != info.Username {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is immutable", "")), nil
	}

	if user.IsAdmin != originalIsAdmin {
		return api.Failure(funcName, errors.New(400, "Invalid request: isAdmin is immutable", "")), nil
	}

	err = repository.UpdateUser(update)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func main() {
	lambda.Start(Handler)
}
