package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.RequirementScanner = database.DynamoDB

const funcName = "requirement-list-handler"

type ListRequirementsResponse struct {
	Requirements     []*database.Requirement `json:"requirements"`
	LastEvaluatedKey string                  `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	user, err := repository.GetUser(api.GetUserInfo(event).Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	if !user.IsAdmin {
		err := errors.New(403, "You do not have permission to perform this action", "")
		return api.Failure(funcName, err), nil
	}

	startKey, _ := event.QueryStringParameters["startKey"]
	requirements, lastKey, err := repository.ScanRequirements("", startKey)
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
