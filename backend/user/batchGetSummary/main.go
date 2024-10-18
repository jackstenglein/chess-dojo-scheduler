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

var repository = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	usernames := []string{}
	if err := json.Unmarshal([]byte(event.Body), &usernames); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	users, err := repository.BatchGetUsersProjection(usernames, "username,displayName,dojoCohort")
	if err != nil {
		return api.Failure(errors.Wrap(500, "Temporary server error", "Failed BatchGetUsers", err)), nil
	}

	return api.Success(users), nil
}
