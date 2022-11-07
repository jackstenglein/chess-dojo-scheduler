package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.AdminStatisticsGetter = database.DynamoDB

const funcName = "admin-statistics-get-handler"

type GetStatisticsResponse struct {
	MeetingStatistics      *database.MeetingStatistics      `json:"meetingStatistics"`
	AvailabilityStatistics *database.AvailabilityStatistics `json:"availabilityStatistics"`
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

	meetingStats, err := repository.GetMeetingStatistics()
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	availabilityStats, err := repository.GetAvailabilityStatistics()
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &GetStatisticsResponse{
		MeetingStatistics:      meetingStats,
		AvailabilityStatistics: availabilityStats,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
