package main

import (
	"context"
	"encoding/json"

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

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	update, err := getUpdate(event)
	if err != nil {
		return api.Failure(err), nil
	}

	game, err := repository.UpdateComment(info.Username, &update)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(game), nil
}

func getUpdate(event api.Request) (database.PositionCommentUpdate, error) {
	update := database.PositionCommentUpdate{}
	if err := json.Unmarshal([]byte(event.Body), &update); err != nil {
		return update, errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
	}

	if !database.IsValidCohort(update.Cohort) {
		return update, errors.New(400, "Invalid request: cohort is invalid", "")
	}
	if update.GameId == "" {
		return update, errors.New(400, "Invalid request: gameId is required", "")
	}
	if update.Id == "" {
		return update, errors.New(400, "Invalid request: id is required", "")
	}
	if update.Fen == "" {
		return update, errors.New(400, "Invalid request: fen is required", "")
	}
	if update.Content == "" {
		return update, errors.New(400, "Invalid request: content must not be empty", "")
	}

	return update, nil
}
