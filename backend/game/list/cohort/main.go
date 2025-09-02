package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameLister = database.DynamoDB
var stage = os.Getenv("stage")

type ListGamesResponse struct {
	Games            []*database.Game `json:"games"`
	LastEvaluatedKey string           `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	if stage == "prod" {
		log.SetLevel(log.InfoLevel)
	}
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: header cohort is required", "")
		return api.Failure(err), nil
	}

	startDate := event.QueryStringParameters["startDate"]
	endDate := event.QueryStringParameters["endDate"]
	startKey := event.QueryStringParameters["startKey"]

	games, lastKey, err := repository.ListGamesByCohort(cohort, startDate, endDate, startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(&ListGamesResponse{
		Games:            games,
		LastEvaluatedKey: lastKey,
	}), nil
}
