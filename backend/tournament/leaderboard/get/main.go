package main

import (
	"context"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "tournament-leaderboard-get-handler"

var repository = database.DynamoDB
var now = time.Now()

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	timePeriod, _ := request.QueryStringParameters["timePeriod"]
	tournamentType, _ := request.QueryStringParameters["tournamentType"]
	timeControl, _ := request.QueryStringParameters["timeControl"]
	date, _ := request.QueryStringParameters["date"]

	if timePeriod != "monthly" && timePeriod != "yearly" {
		err := errors.New(400, "Invalid request: timePeriod must be `monthly` or `yearly`", "")
		return api.Failure(funcName, err), nil
	}
	if tournamentType == "" {
		err := errors.New(400, "Invalid request: tournamentType is required", "")
		return api.Failure(funcName, err), nil
	}
	if timeControl == "" {
		err := errors.New(400, "Invalid request: timeControl is required", "")
		return api.Failure(funcName, err), nil
	}
	if date == "" {
		err := errors.New(400, "Invalid request: date is required", "")
		return api.Failure(funcName, err), nil
	}

	t, err := time.Parse(time.RFC3339, date)
	if err != nil {
		err = errors.Wrap(400, "Invalid request: date format is invalid", "time.Parse failure", err)
		return api.Failure(funcName, err), nil
	}

	var startsAt string
	if timePeriod == "monthly" {
		if t.Month() == now.Month() && t.Year() == now.Year() {
			startsAt = database.CurrentLeaderboard
		} else {
			startsAt = t.Format("2006-01")
		}
	} else {
		if t.Year() == now.Year() {
			startsAt = database.CurrentLeaderboard
		} else {
			startsAt = t.Format("2006")
		}
	}

	leaderboard, err := repository.GetLeaderboard(timePeriod, tournamentType, timeControl, startsAt)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, leaderboard), nil
}
