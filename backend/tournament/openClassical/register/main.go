package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/ratings"
)

var repository = database.DynamoDB

const maxByeLength = 7

var validTitles = []string{
	"",
	"GM",
	"WGM",
	"IM",
	"WIM",
	"FM",
	"WFM",
	"CM",
	"WCM",
}

type RegisterRequest struct {
	Email           string `json:"email"`
	LichessUsername string `json:"lichessUsername"`
	LichessRating   int    `json:"-"`
	DiscordUsername string `json:"discordUsername"`
	Title           string `json:"title"`
	Region          string `json:"region"`
	Section         string `json:"section"`
	ByeRequests     []bool `json:"byeRequests"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)

	request := &RegisterRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)
		return api.Failure(err), nil
	}
	if info.Email != "" {
		request.Email = info.Email
	}

	if err := checkRequest(request); err != nil {
		return api.Failure(err), nil
	}

	openClassical, err := repository.GetOpenClassical(database.CurrentLeaderboard)
	if err != nil {
		return api.Failure(err), nil
	}

	if !openClassical.AcceptingRegistrations {
		err := errors.New(400, "Registration for this tournament has already closed", "")
		return api.Failure(err), nil
	}

	lichessLowercase := strings.ToLower(request.LichessUsername)
	if _, ok := openClassical.BannedPlayers[lichessLowercase]; ok {
		err := errors.New(400, "You are currently not in good standing. Please contact TD Alex Dodd via Discord to register", "")
		return api.Failure(err), nil
	}

	openClassicalPlayer := database.OpenClassicalPlayer{
		OpenClassicalPlayerSummary: database.OpenClassicalPlayerSummary{
			LichessUsername: request.LichessUsername,
			DiscordUsername: request.DiscordUsername,
			Title:           request.Title,
			Rating:          request.LichessRating,
		},
		Username:    info.Username,
		Email:       request.Email,
		Region:      request.Region,
		Section:     request.Section,
		ByeRequests: request.ByeRequests,
	}

	openClassical, err = repository.UpdateOpenClassicalRegistration(openClassical, &openClassicalPlayer)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(openClassical), nil
}

// Returns an error if the request is invalid.
func checkRequest(req *RegisterRequest) error {
	if strings.TrimSpace(req.Email) == "" {
		return errors.New(400, "Invalid request: email is required", "")
	}
	if strings.TrimSpace(req.LichessUsername) == "" {
		return errors.New(400, "Invalid request: lichessUsername is required", "")
	}
	if strings.TrimSpace(req.DiscordUsername) == "" {
		return errors.New(400, "Invalid request: discordUsername is required", "")
	}
	if req.Region != "A" && req.Region != "B" {
		return errors.New(400, fmt.Sprintf("Invalid request: region `%s` is not supported", req.Region), "")
	}
	if req.Section != "Open" && req.Section != "U1900" {
		return errors.New(400, fmt.Sprintf("Invalid request: section `%s` is not supported", req.Section), "")
	}
	if len(req.ByeRequests) > maxByeLength {
		return errors.New(400, "Invalid request: byeRequests has too many items", "")
	}

	found := false
	for _, t := range validTitles {
		if t == req.Title {
			found = true
			break
		}
	}
	if !found {
		errors.New(400, "Invalid request: title is not in list of valid titles", "")
	}

	rating, err := ratings.FetchLichessRating(req.LichessUsername)
	if req.Section == "U1900" && rating.CurrentRating >= 1900 {
		return errors.New(400, "Your Lichess rating is above 1900. Please register for the open section instead.", "")
	}

	req.LichessRating = rating.CurrentRating
	return err
}
