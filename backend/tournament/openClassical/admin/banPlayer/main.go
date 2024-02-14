// This package implements a Lambda handler which bans the provided player
// from the Open Classical. If the player is present in the current open classical,
// their info from their registration is copied to the banned players section.
// If the player is not present, their info from the request is used.
//
// The caller must be an admin or a tournament admin.
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
)

var repository = database.DynamoDB

type BanPlayerRequest struct {
	// The Lichess username of the player to ban
	LichessUsername string `json:"lichessUsername"`

	// The region the player is in
	Region string `json:"region"`

	// The section the player is in
	Section string `json:"section"`

	// The last round the player was active
	LastActiveRound int `json:"lastActiveRound"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	request := BanPlayerRequest{}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: failed to unmarshal body", "", err)), nil
	}

	if request.LichessUsername == "" {
		return api.Failure(errors.New(400, "Invalid request: lichessUsername is required", "")), nil
	}
	if request.Region == "" {
		return api.Failure(errors.New(400, "Invalid request: region is required", "")), nil
	}
	if request.Section == "" {
		return api.Failure(errors.New(400, "Invalid request: section is required", "")), nil
	}
	if request.LastActiveRound < 0 {
		return api.Failure(errors.New(400, "Invalid request: lastActiveRound must be non-negative", "")), nil
	}

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(err), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}
	if !user.IsAdmin && !user.IsTournamentAdmin {
		err := errors.New(403, "Invalid request: you are not a tournament admin", "")
		return api.Failure(err), nil
	}

	openClassical, err := repository.GetOpenClassical(database.CurrentLeaderboard)
	if err != nil {
		return api.Failure(err), nil
	}

	section, ok := openClassical.Sections[fmt.Sprintf("%s_%s", request.Region, request.Section)]
	if !ok {
		return api.Failure(errors.New(400, fmt.Sprintf("Invalid request: region %q and section %q not found", request.Region, request.Section), "")), nil
	}

	player, ok := section.Players[strings.ToLower(request.LichessUsername)]
	if !ok {
		return api.Failure(errors.New(400, fmt.Sprintf("Invalid request: player %q not found", request.LichessUsername), "")), nil
	}

	player.Status = database.OpenClassicalPlayerStatus_Banned
	player.LastActiveRound = request.LastActiveRound

	openClassical, err = repository.BanPlayer(&player)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(openClassical), nil
}
