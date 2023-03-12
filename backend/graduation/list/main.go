package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GraduationLister = database.DynamoDB

const funcName = "graduation-list-handler"

type ListGraduationsResponse struct {
	Graduations      []*database.Graduation `json:"graduations"`
	LastEvaluatedKey string                 `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		return api.Failure(funcName, errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	startKey, _ := event.QueryStringParameters["startKey"]

	graduations, lastKey, err := repository.ListGraduations(database.DojoCohort(cohort), startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListGraduationsResponse{
		Graduations:      graduations,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
