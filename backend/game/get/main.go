package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameGetter = database.DynamoDB

const funcName = "game-get-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	cohort, ok := event.Headers["x-dojo-cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: header x-dojo-cohort is required", "")
		return api.Failure(funcName, err), nil
	}

	id, ok := event.Headers["x-dojo-game-id"]
	if !ok {
		err := errors.New(400, "Invalid request: header x-dojo-game-id is required", "")
		return api.Failure(funcName, err), nil
	}

	game, err := repository.GetGame(cohort, id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, game), nil
}

func main() {
	lambda.Start(Handler)
}
