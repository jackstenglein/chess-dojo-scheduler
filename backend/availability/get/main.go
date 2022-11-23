package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/availability"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.AvailabilitySearcher = database.DynamoDB

const funcName = "availability-get-handler"

// getByOwnerHandler returns the Availabilities for which the caller is the owner.
func getByOwnerHandler(info *api.UserInfo, event api.Request) api.Response {
	if info.Username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(funcName, err)
	}

	startKey, _ := event.QueryStringParameters["startKey"]

	response, err := availability.ListByOwner(info.Username, startKey)
	if err != nil {
		return api.Failure(funcName, err)
	}

	return api.Success(funcName, response)
}

// getByTimeHandler returns a list of all Availabilities matching the provided request.
func getByTimeHandler(info *api.UserInfo, event api.Request) api.Response {
	if info.Username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(funcName, err)
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err)
	}

	startTime, ok := event.QueryStringParameters["startTime"]
	if !ok {
		err := errors.New(400, "Invalid request: startTime is required", "")
		return api.Failure(funcName, err)
	}

	startKey, _ := event.QueryStringParameters["startKey"]

	response, err := availability.ListByTime(user, startTime, startKey)
	if err != nil {
		return api.Failure(funcName, err)
	}

	return api.Success(funcName, response)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)
	info := api.GetUserInfo(event)

	if _, ok := event.QueryStringParameters["byTime"]; ok {
		return getByTimeHandler(info, event), nil
	}

	return getByOwnerHandler(info, event), nil
}

func main() {
	lambda.Start(Handler)
}
