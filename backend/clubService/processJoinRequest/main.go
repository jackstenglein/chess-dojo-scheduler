package main

import (
	"context"

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
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: caller username is required", "")), nil
	}

	id := event.PathParameters["id"]
	if id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}

	username := event.PathParameters["username"]
	if username == "" {
		return api.Failure(errors.New(400, "Invalid request: join request username is required", "")), nil
	}

	club, err := repository.RejectClubJoinRequest(id, username, info.Username)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(club), nil
}
