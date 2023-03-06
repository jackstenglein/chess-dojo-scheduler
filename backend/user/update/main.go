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

const funcName = "user-update-handler"

var repository database.UserUpdater = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	update := &database.UserUpdate{}
	if err := json.Unmarshal([]byte(event.Body), update); err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	err := repository.UpdateUser(info.Username, update)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, nil), nil
}

func main() {
	lambda.Start(Handler)
}
