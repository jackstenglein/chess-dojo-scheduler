package main

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "user-search-handler"

var repository database.UserLister = database.DynamoDB

type SearchUsersResponse struct {
	Users            []*database.User `json:"users"`
	LastEvaluatedKey string           `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	query, _ := event.QueryStringParameters["query"]
	fieldStr, _ := event.QueryStringParameters["fields"]
	startKey, _ := event.QueryStringParameters["startKey"]

	if query == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: query is required", "")), nil
	}
	if fieldStr == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: fields is required", "")), nil
	}

	fields := strings.Split(fieldStr, ",")
	users, lastKey, err := repository.SearchUsers(query, fields, startKey)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	for _, user := range users {
		user.WixEmail = ""
		for _, rating := range user.Ratings {
			if rating.HideUsername {
				rating.Username = ""
			}
		}
	}

	return api.Success(funcName, &SearchUsersResponse{
		Users:            users,
		LastEvaluatedKey: lastKey,
	}), nil
}
