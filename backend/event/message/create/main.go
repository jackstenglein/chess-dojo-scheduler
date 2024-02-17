package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.EventMessager = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	id := event.PathParameters["id"]
	if id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}

	comment := database.Comment{}
	if err := json.Unmarshal([]byte(event.Body), &comment); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
		return api.Failure(err), nil
	}

	if comment.Owner != api.GetUserInfo(event).Username {
		err := errors.New(400, "Invalid request: owner does not match caller", "")
		return api.Failure(err), nil
	}
	if comment.OwnerDisplayName == "" {
		err := errors.New(400, "Invalid request: ownerDisplayName must not be empty", "")
		return api.Failure(err), nil
	}
	if !database.IsValidCohort(comment.OwnerCohort) {
		err := errors.New(400, fmt.Sprintf("Invalid request: ownerCohort `%s` is invalid", comment.OwnerCohort), "")
		return api.Failure(err), nil
	}
	if comment.Content == "" {
		err := errors.New(400, "Invalid request: content must not be empty", "")
		return api.Failure(err), nil
	}

	comment.Id = uuid.NewString()
	comment.CreatedAt = time.Now().Format(time.RFC3339)
	comment.UpdatedAt = comment.CreatedAt

	e, err := repository.CreateEventMessage(id, &comment)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(e), nil
}
