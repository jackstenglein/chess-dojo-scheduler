package main

import (
	"context"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "user-followers-list-handler"

var repository database.FollowerLister = database.DynamoDB

type ListFollowersResponse struct {
	Followers []database.FollowerEntry `json:"followers"`
	LastKey   string                   `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event events.APIGatewayV2HTTPRequest) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	username := event.PathParameters["username"]
	if username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(funcName, err), nil
	}
	startKey := event.QueryStringParameters["startKey"]

	var followers []database.FollowerEntry
	var lastKey string
	var err error

	if strings.HasSuffix(event.RawPath, "/followers") {
		followers, lastKey, err = repository.ListFollowers(username, startKey)
	} else if strings.HasSuffix(event.RawPath, "/following") {
		followers, lastKey, err = repository.ListFollowing(username, startKey)
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: path `%s` not recognized", event.RawPath), "")
	}

	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &ListFollowersResponse{
		Followers: followers,
		LastKey:   lastKey,
	}), nil
}
