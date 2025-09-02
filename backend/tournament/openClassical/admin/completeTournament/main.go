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

type CompleteTournamentRequest struct {
	NextStartDate string `json:"nextStartDate"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	request := CompleteTournamentRequest{}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(errors.New(400, "Invalid request: failed to unmarshal body", "")), nil
	}
	if request.NextStartDate == "" {
		return api.Failure(errors.New(400, "Invalid request: nextStartDate is required", "")), nil
	}

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}
	if !user.IsAdmin && !user.IsTournamentAdmin {
		return api.Failure(errors.New(403, "Invalid request: you are not a tournament admin", "")), nil
	}

	openClassical, err := repository.GetOpenClassical(database.CurrentLeaderboard)
	if err != nil {
		return api.Failure(err), nil
	}
	if openClassical.AcceptingRegistrations {
		return api.Failure(errors.New(400, "Invalid request: the tournament is still accepting registrations", "")), nil
	}

	openClassical.StartsAt = openClassical.StartMonth
	openClassical.Name = openClassical.StartsAt

	if err := repository.SetOpenClassical(openClassical); err != nil {
		return api.Failure(err), nil
	}

	openClassical.StartsAt = database.CurrentLeaderboard
	openClassical.Name = ""
	openClassical.AcceptingRegistrations = true
	openClassical.StartMonth = ""
	openClassical.RegistrationClose = request.NextStartDate
	for key, section := range openClassical.Sections {
		section.Players = make(map[string]database.OpenClassicalPlayer)
		section.Rounds = make([]database.OpenClassicalRound, 0)
		delete(openClassical.Sections, key)
		openClassical.Sections[strings.ReplaceAll(key, "U1800", "U1900")] = section
	}

	if err := repository.SetOpenClassical(openClassical); err != nil {
		return api.Failure(err), nil
	}
	return api.Success(openClassical), nil
}
