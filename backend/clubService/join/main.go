package main

import (
	"context"
	"encoding/json"
	"strings"

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

	if strings.Contains(event.RawPath, "requests") {
		return handleJoinRequest(event), nil
	}
	return handleImmediateJoin(event), nil
}

func handleJoinRequest(event api.Request) api.Response {
	id := event.PathParameters["id"]
	if id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", ""))
	}

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", ""))
	}

	var request database.ClubJoinRequest
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err))
	}

	if request.DisplayName == "" {
		return api.Failure(errors.New(400, "Invalid request: displayName is required", ""))
	}
	if request.Cohort == "" {
		return api.Failure(errors.New(400, "Invalid request: cohort is required", ""))
	}

	request.Username = info.Username
	club, err := repository.RequestToJoinClub(id, &request)
	if err != nil {
		return api.Failure(err)
	}

	if err := repository.PutNotification(database.NewClubJoinRequestNotification(club)); err != nil {
		log.Errorf("Failed to leave notification for club owner: %v", err)
	}

	return api.Success(club)
}

type ImmediateJoinResponse struct {
	Club       *database.Club               `json:"club"`
	Scoreboard []database.ScoreboardSummary `json:"scoreboard,omitempty"`
}

func handleImmediateJoin(event api.Request) api.Response {
	id := event.PathParameters["id"]
	if id == "" {
		return api.Failure(errors.New(400, "Invalid request: id is required", ""))
	}

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", ""))
	}

	club, err := repository.JoinClub(id, info.Username)
	if err != nil {
		return api.Failure(err)
	}

	scoreboard, err := repository.GetScoreboardSummaries([]string{info.Username})
	if err != nil {
		// This didn't prevent the new member from being added, so just log the error and continue
		log.Errorf("Failed to get new scoreboard summary: %v", err)
	}

	return api.Success(ImmediateJoinResponse{Club: club, Scoreboard: scoreboard})
}
