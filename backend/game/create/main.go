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
	"github.com/jackstenglein/chess-dojo-scheduler/backend/game"
)

type ImportType string

const (
	Lichess  ImportType = "lichess"
	Chesscom            = "chesscom"
	Manual              = "manual"
)

type CreateGameRequest struct {
	Type    ImportType `json:"type"`
	Url     string     `json:"url"`
	PgnText string     `json:"pgnText"`
}

var repository database.GamePutter = database.DynamoDB

const funcName = "game-create-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	req := CreateGameRequest{}
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		err = errors.Wrap(400, "Invalid request: body cannot be unmarshaled", "", err)
		return api.Failure(funcName, err), nil
	}

	var pgnText string
	var err error
	if req.Type == Lichess {
		pgnText, err = game.GetLichessPgn(req.Url)
	} else if req.Type == Manual {
		pgnText = req.PgnText
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: type `%s` not supported", req.Type), "")
	}

	if err != nil {
		return api.Failure(funcName, err), nil
	}

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	game, err := saveGame(user, pgnText)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.RecordGameCreation(user); err != nil {
		// Only log this error as this happens on best effort
		log.Error("Failed RecordGameCreation: ", err)
	}

	return api.Success(funcName, game), nil
}

func saveGame(user *database.User, pgnText string) (*database.Game, error) {
	game, err := game.GetGame(user, pgnText)
	if err != nil {
		return nil, err
	}

	if err := repository.PutGame(game); err != nil {
		return nil, err
	}

	return game, nil
}

func main() {
	lambda.Start(Handler)
}
