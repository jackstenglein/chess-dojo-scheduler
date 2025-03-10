package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.FollowerEditor = database.DynamoDB

type EditFollowerRequest struct {
	Poster string `json:"poster"`
	Action string `json:"action"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(err), nil
	}

	req := EditFollowerRequest{}
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		err := errors.Wrap(400, "Invalid request: failed to unmarshal request body", "", err)
		return api.Failure(err), nil
	}

	if req.Poster == "" {
		err := errors.New(400, "Invalid request: poster is required", "")
		return api.Failure(err), nil
	}
	if info.Username == req.Poster {
		err := errors.New(400, "Invalid request: you cannot follow yourself", "")
		return api.Failure(err), nil
	}

	if req.Action == "follow" {
		return handleFollow(req.Poster, info.Username), nil
	} else if req.Action == "unfollow" {
		return handleUnfollow(req.Poster, info.Username), nil
	}

	err := errors.New(400, "Invalid request: action must be `follow` or `unfollow`", "")
	return api.Failure(err), nil
}

// handleFollow handles a follow request.
func handleFollow(posterUsername, followerUsername string) api.Response {
	poster, err := repository.GetUser(posterUsername)
	if err != nil {
		return api.Failure(err)
	}

	follower, err := repository.GetUser(followerUsername)
	if err != nil {
		return api.Failure(err)
	}

	entry, err := repository.CreateFollower(poster, follower)
	if err != nil {
		return api.Failure(err)
	}

	if err := database.SendFollowerEvent(entry, follower.DojoCohort); err != nil {
		log.Error("Failed to create notification: ", err)
	}

	return api.Success(entry)
}

// handleUnfollow handles an unfollow request.
func handleUnfollow(poster, follower string) api.Response {
	err := repository.DeleteFollower(poster, follower)
	if err != nil {
		return api.Failure(err)
	}
	return api.Success(nil)
}
