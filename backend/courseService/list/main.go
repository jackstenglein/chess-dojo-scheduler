package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.CourseLister = database.DynamoDB

const funcName = "course-list-handler"

type ListCoursesResponse struct {
	Courses          []*database.Course `json:"courses"`
	LastEvaluatedKey string             `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	courseType := event.PathParameters["type"]
	if courseType == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: type is required", "")), nil
	}

	startKey := event.QueryStringParameters["startKey"]
	courses, lastKey, err := repository.ListCourses(courseType, startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListCoursesResponse{
		Courses:          courses,
		LastEvaluatedKey: lastKey,
	}), nil
}
