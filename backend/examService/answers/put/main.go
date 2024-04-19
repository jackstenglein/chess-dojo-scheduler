// Implements a Lambda handler which saves an exam answer in the database.
package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

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

	answer := database.ExamAnswer{}
	if err := json.Unmarshal([]byte(event.Body), &answer); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: failed to unmarshal body", "", err)), nil
	}

	if string(answer.Type) != info.Username {
		return api.Failure(errors.New(400, "Invalid request: type must equal username", "")), nil
	}
	if answer.Id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}
	if answer.Cohort == "" {
		return api.Failure(errors.New(400, "Invalid request: cohort is required", "")), nil
	}
	if answer.Rating == 0 {
		return api.Failure(errors.New(400, "Invalid request: rating is required", "")), nil
	}

	answer.CreatedAt = time.Now().Format(time.RFC3339)

	if err := repository.PutExamAnswerSummary(&answer); err != nil {
		return api.Failure(err), nil
	}

	if err := repository.PutExamAnswer(&answer); err != nil {
		return api.Failure(err), nil
	}
	return api.Success(&answer), nil
}
