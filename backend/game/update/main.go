package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

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

var repository database.GameUpdater = database.DynamoDB

const funcName = "game-update-handler"

func featureGame(event api.Request) api.Response {
	user, err := repository.GetUser(api.GetUserInfo(event).Username)
	if err != nil {
		return api.Failure(funcName, err)
	}
	if !user.IsAdmin {
		err := errors.New(403, "You do not have permission to perform this action", "")
		return api.Failure(funcName, err)
	}

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(funcName, err)
	}
	cohort = strings.ReplaceAll(cohort, "%2B", "+")

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err)
	}
	id = strings.ReplaceAll(id, "%3F", "?")

	isFeatured, ok := event.QueryStringParameters["featured"]
	if !ok || (isFeatured != "true" && isFeatured != "false") {
		err := errors.New(400, "Invalid request: featured must be `true` or `false`", "")
		return api.Failure(funcName, err)
	}

	featuredAt := "NOT_FEATURED"
	if isFeatured == "true" {
		featuredAt = time.Now().Format(time.RFC3339)
	}

	update := &database.GameUpdate{
		IsFeatured: &isFeatured,
		FeaturedAt: &featuredAt,
	}

	game, err := repository.UpdateGame(cohort, id, "", update)
	if err != nil {
		return api.Failure(funcName, err)
	}

	return api.Success(funcName, game)
}

func updatePgn(event api.Request) api.Response {
	info := api.GetUserInfo(event)

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(funcName, err)
	}
	cohort = strings.ReplaceAll(cohort, "%2B", "+")

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err)
	}
	id = strings.ReplaceAll(id, "%3F", "?")

	req := CreateGameRequest{}
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		err = errors.Wrap(400, "Invalid request: body cannot be unmarshaled", "", err)
		return api.Failure(funcName, err)
	}

	var pgnText string
	var err error
	if req.Type == Lichess {
		pgnText, err = game.GetLichessChapter(req.Url)
	} else if req.Type == Manual {
		pgnText = req.PgnText
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: type `%s` not supported", req.Type), "")
	}

	if err != nil {
		return api.Failure(funcName, err)
	}

	update, err := game.GetGameUpdate(pgnText)
	if err != nil {
		return api.Failure(funcName, err)
	}

	game, err := repository.UpdateGame(cohort, id, info.Username, update)
	if err != nil {
		return api.Failure(funcName, err)
	}
	return api.Success(funcName, game)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	if _, ok := event.QueryStringParameters["featured"]; ok {
		return featureGame(event), nil
	}

	return updatePgn(event), nil
}

func main() {
	lambda.Start(Handler)
}
