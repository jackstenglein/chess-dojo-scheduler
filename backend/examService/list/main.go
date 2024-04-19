// Implements a Lambda handler which returns a paginated list of exams.
// Pagination is handled by the query parameter startKey.
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

type ListExamsResponse struct {
	Exams            []database.Exam `json:"exams"`
	LastEvaluatedKey string          `json:"lastEvaluatedKey"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	examType := event.QueryStringParameters["type"]
	if examType == "" {
		return api.Failure(errors.New(400, "Invalid request: type is required", "")), nil
	}

	startKey := event.QueryStringParameters["startKey"]
	exams := []database.Exam{}
	lastKey, err := repository.ListExams(database.ExamType(examType), startKey, &exams)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(ListExamsResponse{Exams: exams, LastEvaluatedKey: lastKey}), nil
}
