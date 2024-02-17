package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.TimelineGetter = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	owner := event.PathParameters["owner"]
	if owner == "" {
		err := errors.New(400, "Invalid request: owner is required", "")
		return api.Failure(err), nil
	}

	id := event.PathParameters["id"]
	if id == "" {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err), nil
	}

	entry, err := repository.GetTimelineEntry(owner, id)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(entry), nil
}
