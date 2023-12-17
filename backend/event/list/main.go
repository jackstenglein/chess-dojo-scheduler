package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.EventLister = database.DynamoDB

type ListEventsResponse struct {
	Events           []*database.Event `json:"events"`
	LastEvaluatedKey string            `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	info := api.GetUserInfo(request)
	startKey, _ := request.QueryStringParameters["startKey"]

	events, lastKey, err := repository.ScanEvents(info.Username == "", startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(&ListEventsResponse{
		Events:           events,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
