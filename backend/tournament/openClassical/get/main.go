package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB
var stage = os.Getenv("stage")

func main() {
	if stage == "prod" {
		log.SetLevel(log.InfoLevel)
	}
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	startsAt := event.QueryStringParameters["startsAt"]
	if startsAt == "" {
		startsAt = database.CurrentLeaderboard
	}

	openClassical, err := repository.GetOpenClassical(startsAt)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(openClassical), nil
}
