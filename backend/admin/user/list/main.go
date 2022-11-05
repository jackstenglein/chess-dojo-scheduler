package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.AdminUserLister = database.DynamoDB

const funcName = "admin-user-list-handler"

type ListUsersResponse struct {
	Users            []*database.User `json:"users"`
	LastEvaluatedKey string           `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	caller, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if !caller.IsAdmin {
		return api.Failure(funcName, errors.New(403, "Invalid request: you must be an admin to perform this function", "")), nil
	}

	startKey, _ := event.QueryStringParameters["startKey"]

	users, lastKey, err := repository.ScanUsers(startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, &ListUsersResponse{
		Users:            users,
		LastEvaluatedKey: lastKey,
	}), err
}

func main() {
	lambda.Start(Handler)
}
