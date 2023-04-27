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
	LichessChapter ImportType = "lichessChapter"
	LichessStudy              = "lichessStudy"
	Manual                    = "manual"
)

type CreateGameRequest struct {
	Type    ImportType `json:"type"`
	Url     string     `json:"url"`
	PgnText string     `json:"pgnText"`
}

type CreateGameResponse struct {
	Count int `json:"count"`
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
	var pgnTexts []string
	var err error
	if req.Type == LichessChapter {
		pgnText, err = game.GetLichessChapter(req.Url)
	} else if req.Type == LichessStudy {
		pgnTexts, err = game.GetLichessStudy(req.Url)
	} else if req.Type == Manual {
		pgnText = req.PgnText
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: type `%s` not supported", req.Type), "")
	}

	if pgnTexts == nil {
		pgnTexts = []string{pgnText}
	}

	if err != nil {
		return api.Failure(funcName, err), nil
	}

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	games, err := getGames(user, pgnTexts)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	if len(games) == 0 {
		err := errors.New(400, "Invalid request: no games found", "")
		return api.Failure(funcName, err), nil
	}

	updated, err := repository.BatchPutGames(games)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.RecordGameCreation(user, updated); err != nil {
		// Only log this error as this happens on best effort
		log.Error("Failed RecordGameCreation: ", err)
	}

	if req.Type == LichessChapter || req.Type == Manual {
		return api.Success(funcName, games[0]), nil
	}
	return api.Success(funcName, &CreateGameResponse{Count: updated}), nil
}

func getGames(user *database.User, pgnTexts []string) ([]*database.Game, error) {
	games := make([]*database.Game, 0, len(pgnTexts))

	for i, pgnText := range pgnTexts {
		log.Debugf("Parsing game %d: %s", i+1, pgnText)
		g, err := game.GetGame(user, pgnText)
		if err != nil {
			if aerr, ok := err.(*errors.Error); ok {
				return nil, errors.Wrap(400, fmt.Sprintf("Failed to read chapter %d: %s", i+1, aerr.PublicMessage), "", aerr)
			}
			return nil, err
		}
		games = append(games, g)
	}

	return games, nil
}

func main() {
	lambda.Start(Handler)
}
