// This package implements a Lambda handler which allows users to request Sensei reviews of their
// games. The game's cohort and id are passed in the body, as well as the review type and info.
// A Stripe checkout session is created and returned.
package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

var repository = database.DynamoDB

type ReviewRequest struct {
	Cohort string                  `json:"cohort"`
	Id     string                  `json:"id"`
	Type   database.GameReviewType `json:"type"`
}

type ReviewResponse struct {
	Url string `json:"url"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	request := ReviewRequest{}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: failed to unmarshal body", "", err)), nil
	}

	if request.Id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}
	if request.Cohort == "" {
		return api.Failure(errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}

	game, err := repository.GetGame(request.Cohort, request.Id)
	if err != nil {
		return api.Failure(err), nil
	}

	if game.Review != nil {
		return api.Failure(errors.New(400, "Invalid request: game has already been requested", "")), nil
	}

	checkoutSession, err := payment.GameReviewCheckoutSession(user, request.Cohort, request.Id, request.Type)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(ReviewResponse{Url: checkoutSession.URL}), nil
}
