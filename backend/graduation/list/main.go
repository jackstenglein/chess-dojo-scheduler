package main

import (
	"context"
	"time"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GraduationLister = database.DynamoDB

type ListGraduationsResponse struct {
	Graduations      []*database.Graduation `json:"graduations"`
	LastEvaluatedKey string                 `json:"lastEvaluatedKey,omitempty"`
}

func byCohortHandler(event api.Request) (api.Response, error) {
	cohort, _ := event.PathParameters["cohort"]
	startKey, _ := event.QueryStringParameters["startKey"]
	graduations, lastKey, err := repository.ListGraduationsByCohort(database.DojoCohort(cohort), startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(&ListGraduationsResponse{
		Graduations:      graduations,
		LastEvaluatedKey: lastKey,
	}), nil
}

func byOwnerHandler(event api.Request) (api.Response, error) {
	username, _ := event.PathParameters["username"]
	startKey, _ := event.QueryStringParameters["startKey"]
	graduations, lastKey, err := repository.ListGraduationsByOwner(username, startKey)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(&ListGraduationsResponse{
		Graduations:      graduations,
		LastEvaluatedKey: lastKey,
	}), nil
}

func byDateHandler(event api.Request) (api.Response, error) {
	startKey, _ := event.QueryStringParameters["startKey"]
	monthAgo := time.Now().Add(database.ONE_MONTH_AGO).Format(time.RFC3339)
	graduations, lastKey, err := repository.ListGraduationsByDate(monthAgo, startKey)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(&ListGraduationsResponse{
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

	return byDateHandler(event)
}

func main() {
	lambda.Start(Handler)
}
