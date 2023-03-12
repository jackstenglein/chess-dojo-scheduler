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

func byCohortHandler(event api.Request) (api.Response, error) {
	cohort, _ := event.PathParameters["cohort"]
	startKey, _ := event.QueryStringParameters["startKey"]
	graduations, lastKey, err := repository.ListGraduationsByCohort(database.DojoCohort(cohort), startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListGraduationsResponse{
		Graduations:      graduations,
		LastEvaluatedKey: lastKey,
	}), nil
}

func byOwnerHandler(event api.Request) (api.Response, error) {
	username, _ := event.PathParameters["username"]
	startKey, _ := event.QueryStringParameters["startKey"]
	graduations, lastKey, err := repository.ListGraduationsByOwner(username, startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, &ListGraduationsResponse{
		Graduations:      graduations,
		LastEvaluatedKey: lastKey,
	}), nil
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	if _, ok := event.PathParameters["cohort"]; ok {
		return byCohortHandler(event)
	}

	if _, ok := event.PathParameters["username"]; ok {
		return byOwnerHandler(event)
	}

	err := errors.New(400, "Invalid request: either cohort or username is required", "")
	return api.Failure(funcName, err), nil
}

func main() {
	lambda.Start(Handler)
}
