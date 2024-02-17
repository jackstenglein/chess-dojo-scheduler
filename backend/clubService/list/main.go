package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

type ListClubsResponse struct {
	Clubs            []database.Club `json:"clubs"`
	LastEvaluatedKey string          `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	startKey := event.QueryStringParameters["startKey"]
	clubs, lastKey, err := repository.ListClubs(startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(ListClubsResponse{Clubs: clubs, LastEvaluatedKey: lastKey}), nil
}
