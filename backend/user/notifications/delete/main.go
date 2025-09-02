package main

import (
	"context"
	"encoding/base64"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	id := event.PathParameters["id"]
	if id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}
	if bytes, err := base64.StdEncoding.DecodeString(id); err != nil {
		return api.Failure(errors.New(400, "Invalid request: id is not base64 encoded", "")), nil
	} else {
		id = string(bytes)
	}

	err := repository.DeleteNotification(info.Username, id)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(nil), nil
}
