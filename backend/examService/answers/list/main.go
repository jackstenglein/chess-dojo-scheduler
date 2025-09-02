// Implements a Lambda handler which returns a paginated list of answers
// for the calling users. Pagination is handled by the query parameter startKey.
package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

type ListAnswersResponse struct {
	Answers          []database.ExamAnswer `json:"answers"`
	LastEvaluatedKey string                `json:"lastEvaluatedKey"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	answers := []database.ExamAnswer{}
	startKey := event.QueryStringParameters["startKey"]
	lastKey, err := repository.ListExams(database.ExamType(info.Username), startKey, &answers)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(ListAnswersResponse{Answers: answers, LastEvaluatedKey: lastKey}), nil
}
