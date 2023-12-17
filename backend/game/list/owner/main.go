package main

import (
	"context"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.GameLister = database.DynamoDB

type ListGamesResponse struct {
	Games            []*database.Game `json:"games"`
	LastEvaluatedKey string           `json:"lastEvaluatedKey,omitempty"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	owner, ownerSpecified := event.QueryStringParameters["owner"]
	player, _ := event.QueryStringParameters["player"]
	color, _ := event.QueryStringParameters["color"]
	startDate, _ := event.QueryStringParameters["startDate"]
	endDate, _ := event.QueryStringParameters["endDate"]
	startKey, _ := event.QueryStringParameters["startKey"]

	if ownerSpecified || player == "" {
		searchUsername := info.Username
		if ownerSpecified {
			searchUsername = owner
		}
		games, lastKey, err := repository.ListGamesByOwner(searchUsername, startDate, endDate, startKey)
		if err != nil {
			return api.Failure(err), nil
		}

		return api.Success(&ListGamesResponse{
			Games:            games,
			LastEvaluatedKey: lastKey,
		}), nil
	}

	if color != string(database.White) && color != string(database.Black) && color != string(database.Either) {
		err := errors.New(400, fmt.Sprintf("Invalid request: color `%s` is invalid", color), "")
		return api.Failure(err), nil
	}

	games, lastKey, err := repository.ListGamesByPlayer(player, database.PlayerColor(color), startDate, endDate, startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(&ListGamesResponse{
		Games:            games,
		LastEvaluatedKey: lastKey,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
