package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.AdminAvailabilityLister = database.DynamoDB

const funcName = "admin-availability-list-handler"

type ListAvailabilitiesResponse struct {
	Availabilities   []*database.Availability `json:"availabilities"`
	LastEvaluatedKey string                   `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	caller, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if !caller.IsAdmin {
		return api.Failure(funcName, errors.New(403, "Invalid request: you must be an admin to perform this function", "")), nil
	}

	startKey, _ := event.QueryStringParameters["startKey"]

	availabilities, lastKey, err := repository.ScanAvailabilities(startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, &ListAvailabilitiesResponse{
		Availabilities:   availabilities,
		LastEvaluatedKey: lastKey,
	}), err
}

func main() {
	lambda.Start(Handler)
}
