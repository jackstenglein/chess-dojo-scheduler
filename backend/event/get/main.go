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

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Infof("Request: %#v", request)

	info := api.GetUserInfo(request)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(err), nil
	}

	id, ok := request.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err), nil
	}

	event, err := repository.GetEvent(id)
	if err != nil {
		return api.Failure(err), nil
	}

	if event.Type == database.EventType_Dojo {
		return api.Success(&event), nil
	}

	if event.Owner == info.Username {
		return api.Success(&event), nil
	}

	p := event.Participants[info.Username]
	if p == nil {
		err = errors.New(403, "Invalid request: user is not a member of this meeting", "")
		return api.Failure(err), nil
	}

	if event.Type == database.EventType_Coaching && !p.HasPaid {
		event.Location = "Location is hidden until payment is complete"
		event.Messages = nil
	}
	return api.Success(&event), nil
}
