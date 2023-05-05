package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.UserStatisticsGetter = database.DynamoDB

const funcName = "user-statistics-get-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	stats, err := repository.GetUserStatistics()
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, stats), nil
}

func main() {
	lambda.Start(Handler)
}
