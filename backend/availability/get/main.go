package main

import (
	"context"
	"strconv"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.AvailabilitySearcher = database.DynamoDB

const funcName = "availability-get-handler"

type GetAvailabilitiesResponse struct {
	Availabilities   []*database.Availability `json:"availabilities"`
	LastEvaluatedKey string                   `json:"lastEvaluatedKey,omitempty"`
}

// getSharedParameters returns the parameters that are shared between getByOwnerHandler
// and getPublicHandler.
func getSharedParameters(event api.Request) (limit int, startKey string, err error) {
	limit = 100
	limitStr, ok := event.QueryStringParameters["limit"]
	if ok {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			err = errors.Wrap(400, "Invalid request: limit must be an int", "strconv.Atoi failure", err)
			return
		}
	}

	startKey, _ = event.QueryStringParameters["startKey"]
	return
}

// getByOwnerHandler returns the Availabilities for which the caller is the owner.
func getByOwnerHandler(info *api.UserInfo, event api.Request) api.Response {
	if info.Username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(funcName, err)
	}

	limit, startKey, err := getSharedParameters(event)
	if err != nil {
		return api.Failure(funcName, err)
	}

	availabilities, lastKey, err := repository.GetAvailabilitiesByOwner(info.Username, limit, startKey)
	if err != nil {
		return api.Failure(funcName, err)
	}

	return api.Success(funcName, &GetAvailabilitiesResponse{
		Availabilities:   availabilities,
		LastEvaluatedKey: lastKey,
	})
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

	limit, startKey, err := getSharedParameters(event)
	if err != nil {
		return api.Failure(funcName, err)
	}

	availabilities, lastKey, err := repository.GetAvailabilitiesByTime(user, startTime, limit, startKey)
	if err != nil {
		return api.Failure(funcName, err)
	}

	return api.Success(funcName, &GetAvailabilitiesResponse{
		Availabilities:   availabilities,
		LastEvaluatedKey: lastKey,
	})
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
