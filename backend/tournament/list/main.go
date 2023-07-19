package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "tournament-list-handler"

var repository = database.DynamoDB

type ListTournamentsResponse struct {
	Tournaments      []*database.Tournament `json:"tournaments"`
	LastEvaluatedKey string                 `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	tournamentType, _ := request.QueryStringParameters["type"]
	if tournamentType == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: parameter type is required", "")), nil
	}

	startKey, _ := request.QueryStringParameters["startKey"]

	tournaments, lastKey, err := repository.ListTournaments(database.TournamentType(tournamentType), startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListTournamentsResponse{
		Tournaments:      tournaments,
		LastEvaluatedKey: lastKey,
	}), nil
}
