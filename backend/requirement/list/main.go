package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.RequirementLister = database.DynamoDB

const funcName = "requirement-list-handler"

type ListRequirementsResponse struct {
	Requirements     []*database.Requirement `json:"requirements"`
	LastEvaluatedKey string                  `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		return api.Failure(funcName, errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	scoreboard, _ := event.QueryStringParameters["scoreboardOnly"]
	scoreboardOnly := scoreboard == "true"
	startKey, _ := event.QueryStringParameters["startKey"]

	requirements, lastKey, err := repository.ListRequirements(database.DojoCohort(cohort), scoreboardOnly, startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListRequirementsResponse{
		Requirements:     requirements,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
