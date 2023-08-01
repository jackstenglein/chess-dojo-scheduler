package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "tournament-leaderboard-get-handler"

var repository = database.DynamoDB

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	timePeriod, _ := request.QueryStringParameters["timePeriod"]
	tournamentType, _ := request.QueryStringParameters["tournamentType"]
	timeControl, _ := request.QueryStringParameters["timeControl"]

	if timePeriod == "" {
		err := errors.New(400, "Invalid request: timePeriod is required", "")
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

	leaderboard, err := repository.GetCurrentLeaderboard(timePeriod, tournamentType, timeControl)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, leaderboard), nil
}
