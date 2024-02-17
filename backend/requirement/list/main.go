package main

import (
	"context"
	"os"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.RequirementLister = database.DynamoDB
var stage = os.Getenv("stage")

type ListRequirementsResponse struct {
	Requirements     []*database.Requirement `json:"requirements"`
	LastEvaluatedKey string                  `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	startKey := event.QueryStringParameters["startKey"]
	cohort := event.PathParameters["cohort"]

	if cohort == "" || cohort == string(database.AllCohorts) {
		requirements, lastKey, err := repository.ScanRequirements("", startKey)
		if err != nil {
			return api.Failure(err), nil
		}
		return api.Success(&ListRequirementsResponse{
			Requirements:     requirements,
			LastEvaluatedKey: lastKey,
		}), nil
	}

	scoreboard := event.QueryStringParameters["scoreboardOnly"]
	scoreboardOnly := scoreboard == "true"

	requirements, lastKey, err := repository.ListRequirements(database.DojoCohort(cohort), scoreboardOnly, startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(&ListRequirementsResponse{
		Requirements:     requirements,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	if stage == "prod" {
		log.SetLevel(log.InfoLevel)
	}
	lambda.Start(Handler)
}
