package main

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB
var now = time.Now()

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Infof("Request: %#v", request)

	site := database.LeaderboardSite(request.QueryStringParameters["site"])
	timePeriod := request.QueryStringParameters["timePeriod"]
	tournamentType := request.QueryStringParameters["tournamentType"]
	timeControl := request.QueryStringParameters["timeControl"]
	date := request.QueryStringParameters["date"]

	if site != "" && site != database.LeaderboardSite_Lichess && site != database.LeaderboardSite_Chesscom {
		err := errors.New(400, fmt.Sprintf("Invalid request: invalid site value %q", site), "")
		return api.Failure(err), nil
	}
	if timePeriod != "monthly" && timePeriod != "yearly" {
		err := errors.New(400, "Invalid request: timePeriod must be `monthly` or `yearly`", "")
		return api.Failure(err), nil
	}
	if tournamentType == "" {
		err := errors.New(400, "Invalid request: tournamentType is required", "")
		return api.Failure(err), nil
	}
	if timeControl == "" {
		err := errors.New(400, "Invalid request: timeControl is required", "")
		return api.Failure(err), nil
	}
	if date == "" {
		err := errors.New(400, "Invalid request: date is required", "")
		return api.Failure(err), nil
	}

	t, err := time.Parse(time.RFC3339, date)
	if err != nil {
		err = errors.Wrap(400, "Invalid request: date format is invalid", "time.Parse failure", err)
		return api.Failure(err), nil
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

	leaderboard, err := repository.GetLeaderboard(site, timePeriod, tournamentType, timeControl, startsAt)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(leaderboard), nil
}
