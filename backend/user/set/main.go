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

var repository database.UserSetter = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)

	info, err := api.GetUserInfo(event)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	user := database.User{
		Username: info.Username,
		Email:    info.Email,
		Name:     info.Name,
	}
	err = json.Unmarshal([]byte(event.Body), &user)
	if err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
		return api.Failure(funcName, err), nil
	}

	err = repository.SetUser(&user)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func main() {
	lambda.Start(Handler)
}
