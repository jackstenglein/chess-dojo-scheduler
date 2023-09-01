package main

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameLister = database.DynamoDB

const funcName = "game-list-opening-handler"

type ListGamesResponse struct {
	Games            []*database.Game `json:"games"`
	LastEvaluatedKey string           `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	eco := event.QueryStringParameters["eco"]
	if eco == "" {
		err := errors.New(400, "Invalid request: eco is required", "")
		return api.Failure(funcName, err), nil
	}

	eco = strings.ToUpper(eco)
	startDate := event.QueryStringParameters["startDate"]
	endDate := event.QueryStringParameters["endDate"]
	startKey := event.QueryStringParameters["startKey"]

	games, lastKey, err := repository.ListGamesByEco(eco, startDate, endDate, startKey)
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
