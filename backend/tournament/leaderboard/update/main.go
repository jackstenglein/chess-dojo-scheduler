package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"sort"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

var botAccessToken = os.Getenv("botAccessToken")

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Infof("Request: %#v", request)

	auth, _ := request.Headers["authorization"]
	if auth != fmt.Sprintf("Basic %s", botAccessToken) {
		err := errors.New(401, "Authorization header is invalid", "")
		return api.Failure(err), nil
	}

	leaderboardReq := database.Leaderboard{}
	if err := json.Unmarshal([]byte(request.Body), &leaderboardReq); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	log.Debugf("Request leaderboard: %#v", leaderboardReq)
	tournamentType, err := getTournamentType(leaderboardReq)
	if err != nil {
		return api.Failure(err), nil
	}

	currentMonthly, err := repository.GetLeaderboard("monthly", tournamentType, leaderboardReq.TimeControl, database.CurrentLeaderboard)
	if err != nil {
		if lerr, ok := err.(*errors.Error); !ok || lerr.Code != 404 {
			return api.Failure(err), nil
		}
		// If we get here, the leaderboard doesn't exist yet and the error was a 404, which is fine
	}

	currentYearly, err := repository.GetLeaderboard("yearly", tournamentType, leaderboardReq.TimeControl, database.CurrentLeaderboard)
	if err != nil {
		if lerr, ok := err.(*errors.Error); !ok || lerr.Code != 404 {
			return api.Failure(err), nil
		}
		// If we get here, the leaderboard doesn't exist yet and the error was a 404, which is fine
	}

	yearlyPlayers := make(map[string]database.LeaderboardPlayer)
	for _, player := range currentYearly.Players {
		yearlyPlayers[player.Username] = player
	}

	currentMonthlyScores := make(map[string]float32)
	for _, player := range currentMonthly.Players {
		currentMonthlyScores[player.Username] = player.Score
	}

	for _, player := range leaderboardReq.Players {
		currentScore, _ := currentMonthlyScores[player.Username]
		if currentPlayer, ok := yearlyPlayers[player.Username]; !ok {
			yearlyPlayers[player.Username] = player
		} else {
			currentPlayer.Score += player.Score - currentScore
			yearlyPlayers[player.Username] = currentPlayer
		}
	}

	yearlyPlayersSlice := make([]database.LeaderboardPlayer, 0, len(yearlyPlayers))
	for _, v := range yearlyPlayers {
		yearlyPlayersSlice = append(yearlyPlayersSlice, v)
	}
	sort.Slice(yearlyPlayersSlice, func(i, j int) bool {
		return yearlyPlayersSlice[i].Score > yearlyPlayersSlice[j].Score
	})
	currentYearly.Players = yearlyPlayersSlice

	currentMonthly.Players = leaderboardReq.Players
	if err := repository.SetLeaderboard(*currentMonthly); err != nil {
		return api.Failure(err), nil
	}
	if err := repository.SetLeaderboard(*currentYearly); err != nil {
		return api.Failure(err), nil
	}

	return api.Success(nil), nil
}

// getTournamentType returns the tournament type for the given leaderboard.
func getTournamentType(leaderboard database.Leaderboard) (string, error) {
	tournamentType := ""
	switch leaderboard.Type {
	case "Arena Total":
		tournamentType = "ARENA"
	case "Swiss Total":
		tournamentType = "SWISS"
	case "Grand Prix":
		tournamentType = "GRAND_PRIX"
	case "Middlegame Sparring Total":
		tournamentType = "MIDDLEGAME_SPARRING"
	case "Endgame Sparring Total":
		tournamentType = "ENDGAME_SPARRING"
	default:
		return "", errors.New(400, fmt.Sprintf("Invalid request: type `%s` is invalid", leaderboard.Type), "")
	}

	return tournamentType, nil
}
