package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.RequirementGetter = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	id, _ := event.PathParameters["id"]
	if id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}

	requirement, err := repository.GetRequirement(id)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(requirement), nil
}

func main() {
	lambda.Start(Handler)
}
