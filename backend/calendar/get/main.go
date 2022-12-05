package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/availability"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/meeting"
)

var repository = database.DynamoDB

const funcName = "calendar-get-handler"

type GetCalendarResponse struct {
	Meetings         []*database.Meeting      `json:"meetings"`
	Availabilities   []*database.Availability `json:"availabilities"`
	LastEvaluatedKey string                   `json:"lastEvaluatedKey,omitempty"`
}

type getCalendarStartKey struct {
	MeetingKey           string `json:"meetingKey"`
	OwnedAvailabilityKey string `json:"ownedAvailabilityKey"`
	OtherAvailabilityKey string `json:"otherAvailabilityKey"`
	ScanAvailabilityKey  string `json:"scanAvailabilityKey"`
}

func convertLastKeys(lastKeys *getCalendarStartKey) (string, error) {
	var lastKey string
	if lastKeys.MeetingKey != "" || lastKeys.OwnedAvailabilityKey != "" || lastKeys.OtherAvailabilityKey != "" || lastKeys.ScanAvailabilityKey != "" {
		b, err := json.Marshal(lastKeys)
		if err != nil {
			return "", err
		}
		lastKey = string(b)
	}
	return lastKey, nil
}

func getAdminCalendar(startKey string, startKeys *getCalendarStartKey) (api.Response, error) {
	meetings := make([]*database.Meeting, 0)
	availabilities := make([]*database.Availability, 0)
	lastKeys := getCalendarStartKey{}

	if startKey == "" || startKeys.ScanAvailabilityKey != "" {
		a, lastKey, err := repository.ScanAvailabilities(startKeys.ScanAvailabilityKey)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		availabilities = append(availabilities, a...)
		lastKeys.ScanAvailabilityKey = lastKey
	}

	if startKey == "" || startKeys.MeetingKey != "" {
		m, lastKey, err := repository.ScanMeetings(startKey)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		meetings = append(meetings, m...)
		lastKeys.MeetingKey = lastKey
	}

	lastKey, err := convertLastKeys(&lastKeys)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &GetCalendarResponse{
		Meetings:         meetings,
		Availabilities:   availabilities,
		LastEvaluatedKey: lastKey,
	}), nil
}

func getUserCalendar(user *database.User, startTime, startKey string, startKeys *getCalendarStartKey) (api.Response, error) {
	meetings := make([]*database.Meeting, 0)
	availabilities := make([]*database.Availability, 0)
	lastKeys := getCalendarStartKey{}

	if startKey == "" || startKeys.MeetingKey != "" {
		meetingResponse, err := meeting.List(user.Username, startKeys.MeetingKey)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		meetings = append(meetings, meetingResponse.Meetings...)
		lastKeys.MeetingKey = meetingResponse.LastEvaluatedKey
	}

	if startKey == "" || startKeys.ScanAvailabilityKey != "" {
		groupAvailabilities, lastKey, err := repository.ListGroupAvailabilities(user, startTime, startKeys.ScanAvailabilityKey)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		availabilities = append(availabilities, groupAvailabilities...)
		lastKeys.ScanAvailabilityKey = lastKey
	}

	if startKey == "" || startKeys.OwnedAvailabilityKey != "" {
		ownedAvailabilityResponse, err := availability.ListByOwner(user.Username, startKeys.OwnedAvailabilityKey)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		availabilities = append(availabilities, ownedAvailabilityResponse.Availabilities...)
		lastKeys.OwnedAvailabilityKey = ownedAvailabilityResponse.LastEvaluatedKey
	}

	if startKey == "" || startKeys.OtherAvailabilityKey != "" {
		otherAvailabilityResponse, err := availability.ListByTime(user, startTime, startKeys.OtherAvailabilityKey)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		availabilities = append(availabilities, otherAvailabilityResponse.Availabilities...)
		lastKeys.OtherAvailabilityKey = otherAvailabilityResponse.LastEvaluatedKey
	}

	lastKey, err := convertLastKeys(&lastKeys)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &GetCalendarResponse{
		Meetings:         meetings,
		Availabilities:   availabilities,
		LastEvaluatedKey: lastKey,
	}), nil
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(funcName, err), nil
	}

	startTime, ok := event.QueryStringParameters["startTime"]
	if !ok {
		err := errors.New(400, "Invalid request: startTime is required", "")
		return api.Failure(funcName, err), nil
	}

	startKey, _ := event.QueryStringParameters["startKey"]
	startKeys := &getCalendarStartKey{}
	if startKey != "" {
		err := json.Unmarshal([]byte(startKey), startKeys)
		if err != nil {
			err = errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
			return api.Failure(funcName, err), nil
		}
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if user.IsAdmin {
		return getAdminCalendar(startKey, startKeys)
	}

	return getUserCalendar(user, startTime, startKey, startKeys)
}

func main() {
	lambda.Start(Handler)
}
