// Implements a Lambda handler that returns the list of games submitted
// for review by the senseis.
package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
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

	startKey := event.QueryStringParameters["startKey"]
	games, lastKey, err := repository.ListGamesForReview(startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	response := struct {
		Games            []database.Game `json:"games"`
		LastEvaluatedKey string          `json:"lastEvaluatedKey,omitempty"`
	}{
		Games:            games,
		LastEvaluatedKey: lastKey,
	}
	return api.Success(response), nil
}
