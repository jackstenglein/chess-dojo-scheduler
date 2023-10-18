package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/malbrecht/chess/pgn"
)

const funcName = "openClassical-pairings-put-handler"

const (
	minRound = 1
	maxRound = 7
)

var repository = database.DynamoDB

type PutPairingsRequest struct {
	Round   int    `json:"round"`
	PgnData string `json:"pgnData"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	request, err := getRequest(event)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := validateCaller(event); err != nil {
		return api.Failure(funcName, err), nil
	}

	pairings, err := getPairings(request)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	openClassical, err := repository.GetOpenClassical(database.CurrentLeaderboard)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if len(openClassical.Rounds) < request.Round-1 {
		err := errors.New(400, fmt.Sprintf("Invalid request: request is for round %d, but next round is %d", request.Round, len(openClassical.Rounds)+1), "")
		return api.Failure(funcName, err), nil
	}

	if len(openClassical.Rounds) < request.Round {
		openClassical.Rounds = append(openClassical.Rounds, database.OpenClassicalRound{
			Pairings: pairings,
		})
	} else {
		openClassical.Rounds[request.Round-1].Pairings = pairings
	}

	if err := repository.SetOpenClassical(openClassical); err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, openClassical), nil
}

func getRequest(event api.Request) (*PutPairingsRequest, error) {
	request := PutPairingsRequest{}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		err = errors.Wrap(400, "Invalid request: failed to unmarshal body", "", err)
		return nil, err
	}
	if request.Round < minRound || request.Round > maxRound {
		err := errors.New(400, "Invalid request: round must be between 1 and 7", "")
		return nil, err
	}
	if request.PgnData == "" {
		err := errors.New(400, "Invalid request: pgnData cannot be empty", "")
		return nil, err
	}

	return &request, nil
}

func validateCaller(event api.Request) error {
	info := api.GetUserInfo(event)
	if info.Username == "" {
		return errors.New(400, "Invalid request: username is required", "")
	}

	caller, err := repository.GetUser(info.Username)
	if err != nil {
		return err
	}

	if !caller.IsAdmin && !caller.IsTournamentAdmin {
		return errors.New(403, "Invalid request: user is not admin or tournament admin", "")
	}
	return nil
}

func getPairings(request *PutPairingsRequest) ([]database.OpenClassicalPairing, error) {
	pgnDB := pgn.DB{}
	errs := pgnDB.Parse(request.PgnData)
	if len(errs) > 0 {
		err := errors.Wrap(400, "Invalid request: could not parse PGN data", "", errs[0])
		return nil, err
	}

	if len(pgnDB.Games) == 0 {
		err := errors.New(400, "Invalid request: PGN data contains 0 pairings", "")
		return nil, err
	}

	pairings := make([]database.OpenClassicalPairing, 0, len(pgnDB.Games))
	for _, game := range pgnDB.Games {
		pairings = append(pairings, getPairing(game))
	}

	return pairings, nil
}

func getPairing(game *pgn.Game) database.OpenClassicalPairing {
	whiteLichess, whiteDiscord := getUsernames(game.Tags["White"])
	whiteRating := 0
	if whiteRatingStr := game.Tags["WhiteElo"]; whiteRatingStr != "" {
		whiteRating, _ = strconv.Atoi(whiteRatingStr)
	}

	blackLichess, blackDiscord := getUsernames(game.Tags["Black"])
	blackRating := 0
	if blackRatingStr := game.Tags["BlackElo"]; blackRatingStr != "" {
		blackRating, _ = strconv.Atoi(blackRatingStr)
	}

	return database.OpenClassicalPairing{
		White: database.OpenClassicalPlayer{
			LichessUsername: whiteLichess,
			DiscordUsername: whiteDiscord,
			Title:           game.Tags["WhiteTitle"],
			Rating:          whiteRating,
		},
		Black: database.OpenClassicalPlayer{
			LichessUsername: blackLichess,
			DiscordUsername: blackDiscord,
			Title:           game.Tags["BlackTitle"],
			Rating:          blackRating,
		},
	}
}

func getUsernames(playerName string) (lichessUsername, discordUsername string) {
	tokens := strings.Split(playerName, ",discord:")

	lichessUsername = strings.TrimPrefix(tokens[0], "lichess:")
	if len(tokens) > 1 {
		discordUsername = tokens[1]
	}

	return lichessUsername, discordUsername
}
