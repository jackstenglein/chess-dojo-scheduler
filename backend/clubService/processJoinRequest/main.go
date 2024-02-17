package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

type ProcessJoinRequest struct {
	Status database.ClubJoinRequestStatus `json:"status"`
}

type ProcessJoinRequestResponse struct {
	Club       *database.Club               `json:"club"`
	Scoreboard []database.ScoreboardSummary `json:"scoreboard,omitempty"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: caller username is required", "")), nil
	}

	id := event.PathParameters["id"]
	if id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", "")), nil
	}

	username := event.PathParameters["username"]
	if username == "" {
		return api.Failure(errors.New(400, "Invalid request: join request username is required", "")), nil
	}

	request := &ProcessJoinRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		return api.Failure(errors.New(400, "Invalid request: unable to unmarshal body", "")), nil
	}

	var club *database.Club
	var scoreboard []database.ScoreboardSummary
	var err error

	if request.Status == database.ClubJoinRequestStatus_Approved {
		club, scoreboard, err = approveJoinRequest(id, username, info.Username)
	} else if request.Status == database.ClubJoinRequestStatus_Rejected {
		club, err = repository.RejectClubJoinRequest(id, username, info.Username)
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: status %q is not supported", request.Status), "")
	}

	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(ProcessJoinRequestResponse{Club: club, Scoreboard: scoreboard}), nil
}

func approveJoinRequest(id, username, caller string) (*database.Club, []database.ScoreboardSummary, error) {
	club, err := repository.ApproveClubJoinRequest(id, username, caller)
	if err != nil {
		return nil, nil, err
	}

	scoreboard, err := repository.GetScoreboardSummaries([]string{username})
	if err != nil {
		// This didn't prevent the new member from being added, so just log the error and continue
		log.Errorf("Failed to get new scoreboard summary: %v", err)
	}

	err = repository.PutNotification(database.ClubJoinRequestApprovedNotification(username, club))
	if err != nil {
		log.Errorf("Failed to save approval notification: %v", err)
	}

	return club, scoreboard, nil
}
