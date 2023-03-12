package main

import (
	"context"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameUpdater = database.DynamoDB

const funcName = "game-update-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	user, err := repository.GetUser(api.GetUserInfo(event).Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	if !user.IsAdmin {
		err := errors.New(403, "You do not have permission to perform this action", "")
		return api.Failure(funcName, err), nil
	}

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
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

	isFeatured, ok := event.QueryStringParameters["featured"]
	if !ok || (isFeatured != "true" && isFeatured != "false") {
		err := errors.New(400, "Invalid request: featured must be `true` or `false`", "")
		return api.Failure(funcName, err), nil
	}

	featuredAt := "NOT_FEATURED"
	if isFeatured == "true" {
		featuredAt = time.Now().Format(time.RFC3339)
	}

	update := &database.GameUpdate{
		IsFeatured: &isFeatured,
		FeaturedAt: &featuredAt,
	}

	game, err := repository.UpdateGame(cohort, id, update)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, game), nil
}

func main() {
	lambda.Start(Handler)
}
