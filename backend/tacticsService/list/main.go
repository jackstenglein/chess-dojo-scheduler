// Implements a Lambda handler which returns a paginated list of tactics tests.
// Pagination is handled by the query parameter startKey.
package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

type ListTacticsTestsResponse struct {
	Tests            []database.TacticsTest `json:"tests"`
	LastEvaluatedKey string                 `json:"lastEvaluatedKey"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	startKey := event.QueryStringParameters["startKey"]
	tests, lastKey, err := repository.ListTacticsTests(startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(ListTacticsTestsResponse{Tests: tests, LastEvaluatedKey: lastKey}), nil
}
