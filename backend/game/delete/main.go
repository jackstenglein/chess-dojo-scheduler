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

var repository database.GameDeleter = database.DynamoDB

const funcName = "game-delete-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	cohort, _ := event.PathParameters["cohort"]
	if cohort == "" {
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(funcName, err), nil
	}
	cohort = strings.ReplaceAll(cohort, "%2B", "+")

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err), nil
	}
	id = strings.ReplaceAll(id, "%3F", "?")

	game, err := repository.DeleteGame(info.Username, cohort, id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, game), nil
}

func main() {
	lambda.Start(Handler)
}
