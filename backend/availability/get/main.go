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

var repository = database.DynamoDB

const funcName = "availability-get-handler"

type GetAvailabilitiesResponse struct {
	Availabilities   []*database.Availability `json:"availabilities"`
	LastEvaluatedKey string                   `json:"lastEvaluatedKey,omitempty"`
}

func getSharedParameters(event api.Request) (startTime, endTime, startKey string, limit int, err error) {
	limit = 100
	limitStr, ok := event.QueryStringParameters["limit"]
	if ok {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			err = errors.Wrap(400, "Invalid request: limit must be an int", "strconv.Atoi failure", err)
			return
		}
	}

	startTime, _ = event.QueryStringParameters["startTime"]

	endTime, _ = event.QueryStringParameters["endTime"]

	if startTime > endTime {
		err = errors.New(400, "Invalid request: startTime must be less than endTime", "")
		return
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

	_, _, startKey, limit, err := getSharedParameters(event)
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

// func getPublicHandler(info *api.UserInfo, event api.Request) api.Response {

// 	startTime, endTime, startKey, location, limit, err := getSharedParameters(event)
// 	if err != nil {
// 		return api.Failure(funcName, err)
// 	}

// 	school, ok := event.QueryStringParameters["school"]
// 	if !ok {
// 		err := errors.New(400, "Invalid request: school is required", "")
// 		return api.Failure(funcName, err)
// 	}

// 	class, ok := event.QueryStringParameters["class"]
// 	if !ok {
// 		err := errors.New(400, "Invalid request: class is required", "")
// 		return api.Failure(funcName, err)
// 	}

// 	log.Debugf("Finding availabilities for username: %s", info.Username)
// 	availabilities, lastKey, err := repository.GetAvailabilities(info.Username, school, startTime, endTime, class, location, startKey, limit)
// 	if err != nil {
// 		return api.Failure(funcName, err)
// 	}

// 	return api.Success(funcName, &GetAvailabilitiesResponse{
// 		Availabilities:   availabilities,
// 		LastEvaluatedKey: lastKey,
// 	})
// }

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)
	info := api.GetUserInfo(event)
	return getByOwnerHandler(info, event), nil
	// if info.Type == api.TutorType {
	// 	return getTutorHandler(info, event), nil
	// }

	// return getPublicHandler(info, event), nil
}

func main() {
	lambda.Start(Handler)
}
