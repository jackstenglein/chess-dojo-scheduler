package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.OpeningGetter = database.DynamoDB

const funcName = "opening-get-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	id, _ := event.PathParameters["id"]
	if id == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: id is required", "")), nil
	}

	opening, err := repository.GetOpening(id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, opening), nil
}

func main() {
	lambda.Start(Handler)
}
