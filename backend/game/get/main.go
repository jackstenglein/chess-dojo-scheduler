package main

import (
	"context"
	"encoding/base64"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameGetter = database.DynamoDB
var stage = os.Getenv("stage")

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
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(err), nil
	}

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err), nil
	}
	if b, err := base64.StdEncoding.DecodeString(id); err != nil {
		err = errors.Wrap(400, "Invalid request: id is not base64 encoded", "", err)
		return api.Failure(err), nil
	} else {
		id = string(b)
		id = strings.ReplaceAll(id, "%3F", "?")
	}

	game, err := repository.GetGame(cohort, id)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(game), nil
}
