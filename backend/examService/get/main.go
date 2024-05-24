// Implements a Lambda handler which gets both the provided exam and
// the calling user's answer for it.
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

type GetExamResponse struct {
	Exam   *database.Exam       `json:"exam,omitempty"`
	Answer *database.ExamAnswer `json:"answer,omitempty"`
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

	etype := event.PathParameters["type"]
	id := event.PathParameters["id"]
	if etype == "" || id == "" {
		return api.Failure(errors.New(400, "Invalid request: type and id are required", "")), nil
	}

	exam, err := repository.GetExam(etype, id)
	if err != nil {
		return api.Failure(err), nil
	}

	answer, err := repository.GetExamAnswer(info.Username, id)
	if err != nil {
		var aerr *errors.Error
		if !errors.As(err, &aerr) || aerr.Code != 404 {
			return api.Failure(err), nil
		}
	}

	return api.Success(GetExamResponse{Exam: exam, Answer: answer}), nil
}
