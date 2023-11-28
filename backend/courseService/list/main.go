package main

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.CourseLister = database.DynamoDB

const funcName = "course-list-handler"

type ListCoursesResponse struct {
	Courses          []database.Course `json:"courses"`
	LastEvaluatedKey string            `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	var courses []database.Course
	var lastKey string
	var err error

	startKey := event.QueryStringParameters["startKey"]

	if strings.Contains(event.RawPath, "public/") {
		courses, lastKey, err = repository.ScanCourses(startKey)
	} else {
		courseType := event.PathParameters["type"]
		if courseType == "" {
			return api.Failure(funcName, errors.New(400, "Invalid request: type is required", "")), nil
		}
		courses, lastKey, err = repository.ListCourses(courseType, startKey)
	}

	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListCoursesResponse{
		Courses:          courses,
		LastEvaluatedKey: lastKey,
	}), nil
}
