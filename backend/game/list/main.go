package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameLister = database.DynamoDB

const funcName = "game-list-handler"

type ListGamesResponse struct {
	Games            []*database.Game `json:"games"`
	LastEvaluatedKey string           `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	cohort, ok := event.Headers["x-dojo-cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: header x-dojo-cohort is required", "")
		return api.Failure(funcName, err), nil
	}
	startDate, _ := event.QueryStringParameters["startDate"]
	endDate, _ := event.QueryStringParameters["endDate"]
	startKey, _ := event.QueryStringParameters["startKey"]

	games, lastKey, err := repository.ListGamesByCohort(cohort, startDate, endDate, startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListGamesResponse{
		Games:            games,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
