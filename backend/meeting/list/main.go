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

var repository database.MeetingLister = database.DynamoDB

const funcName = "meeting-list-handler"

type ListMeetingsResponse struct {
	Meetings         []*database.Meeting `json:"meetings"`
	LastEvaluatedKey string              `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(funcName, err), nil
	}

	startKey, _ := event.QueryStringParameters["startKey"]

	var limit int = 100
	var err error
	if limitStr, ok := event.QueryStringParameters["limit"]; ok {
		limit, err = strconv.Atoi(limitStr)
		if err != nil {
			err = errors.Wrap(400, "Invalid request: limit is not an integer", "Failed strconv.Atoi(limit)", err)
			return api.Failure(funcName, err), nil
		}
	}

	meetings, lastKey, err := repository.ListMeetings(info.Username, limit, startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListMeetingsResponse{
		Meetings:         meetings,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
