// Implements a lambda handler which marks a game as reviewed or unreviewed.
// The caller must be an admin.
package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

type Request struct {
	Cohort string               `json:"cohort"`
	Id     string               `json:"id"`
	Review *database.GameReview `json:"review"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}
	if !user.IsAdmin {
		return api.Failure(errors.New(403, "Invalid request: you must be an admin to call this function", "")), nil
	}

	request := Request{}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: failed to unmarshal body", "", err)), nil
	}
	if request.Id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}
	if request.Cohort == "" {
		return api.Failure(errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	if request.Review == nil {
		// This can happen when reviewing a game that was not submitted for review
		request.Review = &database.GameReview{}
	}
	request.Review.ReviewedAt = time.Now().Format(time.RFC3339)
	request.Review.Reviewer = &database.Reviewer{
		Username:    user.Username,
		DisplayName: user.DisplayName,
		Cohort:      user.DojoCohort,
	}

	game, err := repository.SetGameReview(request.Cohort, request.Id, request.Review)
	if err != nil {
		return api.Failure(err), nil
	}

	notification := database.GameReviewNotification(game)
	if err := repository.PutNotification(notification); err != nil {
		log.Errorf("Failed to create notification: %v", err)
	}

	return api.Success(game), nil
}
