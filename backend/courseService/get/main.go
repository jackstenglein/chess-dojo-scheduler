package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.CourseGetter = database.DynamoDB

const funcName = "course-get-handler"

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	courseType := event.PathParameters["type"]
	id := event.PathParameters["id"]
	if courseType == "" || id == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: type and id are required", "")), nil
	}

	course, err := repository.GetCourse(courseType, id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, course), nil
}
