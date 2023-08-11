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

const funcName = "tournament-leaderboard-update-handler"

var repository = database.DynamoDB

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	yearlyLeaderboard := database.Leaderboard{}
	if err := json.Unmarshal([]byte(request.Body), &yearlyLeaderboard); err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	log.Debugf("Request leaderboard: %#v", yearlyLeaderboard)
	monthlyType, yearlyType, err := getLeaderboardTypes(yearlyLeaderboard)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	yearlyLeaderboard.StartsAt = database.CurrentLeaderboard
	yearlyLeaderboard.Type = database.LeaderboardType(yearlyType)

	monthlyLeaderboard := database.Leaderboard{
		Type:        database.LeaderboardType(monthlyType),
		StartsAt:    database.CurrentLeaderboard,
		TimeControl: yearlyLeaderboard.TimeControl,
		Players:     yearlyLeaderboard.Players,
	}

	if err := repository.SetLeaderboard(monthlyLeaderboard); err != nil {
		return api.Failure(funcName, err), nil
	}
	if err := repository.SetLeaderboard(yearlyLeaderboard); err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, nil), nil
}

// getLeaderboardTypes returns the type names for the monthly leaderboard and the yearly
// leaderboard, in that order.
func getLeaderboardTypes(leaderboard database.Leaderboard) (string, string, error) {
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
		return "", "", errors.New(400, fmt.Sprintf("Invalid request: type `%s` is invalid", leaderboard.Type), "")
	}

	timeControl := strings.ToUpper(leaderboard.TimeControl)
	if timeControl != "BLITZ" && timeControl != "RAPID" && timeControl != "CLASSICAL" {
		return "", "", errors.New(400, fmt.Sprintf("Invalid request: timeControl `%s` is invalid", leaderboard.TimeControl), "")
	}

	return fmt.Sprintf("LEADERBOARD_MONTHLY_%s_%s", tournamentType, timeControl),
		fmt.Sprintf("LEADERBOARD_YEARLY_%s_%s", tournamentType, timeControl),
		nil
}
