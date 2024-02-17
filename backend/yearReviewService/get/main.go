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
	log.Infof("Event: %#v", event)

	username := event.PathParameters["username"]
	year := event.PathParameters["year"]
	if username == "" || year == "" {
		return api.Failure(errors.New(400, "Invalid request: username and year are required", "")), nil
	}

	review, err := repository.GetYearReview(username, year)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(review), nil
}
