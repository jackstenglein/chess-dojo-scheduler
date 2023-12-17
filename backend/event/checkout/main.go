package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.EventGetter = database.DynamoDB

type EventCheckoutResponse struct {
	Url string `json:"url"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	info := api.GetUserInfo(request)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "")
		return api.Failure(err), nil
	}

	id := request.PathParameters["id"]
	if id == "" {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err), nil
	}

	event, err := repository.GetEvent(id)
	if err != nil {
		return api.Failure(err), nil
	}

	if event.Type != database.EventType_Coaching {
		err := errors.New(400, "Invalid request: event must be a coaching session", "")
		return api.Failure(err), nil
	}

	p := event.Participants[info.Username]
	if p == nil {
		return api.Failure(errors.New(403, "Invalid request: user is not a participant of this event. Your booking may have already expired.", "")), nil
	}
	if p.HasPaid {
		return api.Failure(errors.New(400, "Invalid request: user has already paid", "")), nil
	}
	if p.CheckoutSession == nil {
		return api.Failure(errors.New(400, "Invalid request: user has no associated checkout session", "")), nil
	}

	return api.Success(EventCheckoutResponse{Url: p.CheckoutSession.URL}), nil
}
