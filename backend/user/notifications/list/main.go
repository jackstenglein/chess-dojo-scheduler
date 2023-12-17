package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

type ListNotificationsResponse struct {
	Notifications    []database.Notification `json:"notifications"`
	LastEvaluatedKey string                  `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	username := api.GetUserInfo(event).Username
	if username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "Username missing")), nil
	}

	startKey, _ := event.QueryStringParameters["startKey"]

	notifications, lastKey, err := repository.ListNotifications(username, startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(&ListNotificationsResponse{
		Notifications:    notifications,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
