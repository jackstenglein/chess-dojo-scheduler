package main

import (
	"context"
	"os"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB
var coachesStr = os.Getenv("coaches")

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	coaches := strings.Split(coachesStr, ",")
	users, err := repository.BatchGetUsers(coaches)
	if err != nil {
		return api.Failure(err), nil
	}

	for _, u := range users {
		for _, rating := range u.Ratings {
			if rating.HideUsername {
				rating.Username = ""
			}
		}
	}
	return api.Success(users), err
}
