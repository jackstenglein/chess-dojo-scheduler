package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/game"
)

type CreateGameRequest struct {
	Type        game.ImportType `json:"type"`
	Url         string          `json:"url"`
	PgnText     string          `json:"pgnText"`
	Orientation string          `json:"orientation"`
}

var repository database.GameUpdater = database.DynamoDB

func featureGame(event api.Request) api.Response {
	user, err := repository.GetUser(api.GetUserInfo(event).Username)
	if err != nil {
		return api.Failure(err)
	}
	if !user.IsAdmin && !user.IsCalendarAdmin {
		err := errors.New(403, "You do not have permission to perform this action", "")
		return api.Failure(err)
	}

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(err)
	}

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err)
	}
	if b, err := base64.StdEncoding.DecodeString(id); err != nil {
		err = errors.Wrap(400, "Invalid request: id is not base64 encoded", "", err)
		return api.Failure(err)
	} else {
		id = string(b)
	}

	isFeatured, ok := event.QueryStringParameters["featured"]
	if !ok || (isFeatured != "true" && isFeatured != "false") {
		err := errors.New(400, "Invalid request: featured must be `true` or `false`", "")
		return api.Failure(err)
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
		return api.Failure(err)
	}

	return api.Success(game)
}

func updatePgn(event api.Request) api.Response {
	info := api.GetUserInfo(event)

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(err)
	}

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err)
	}
	if b, err := base64.StdEncoding.DecodeString(id); err != nil {
		err = errors.Wrap(400, "Invalid request: id is not base64 encoded", "", err)
		return api.Failure(err)
	} else {
		id = string(b)
	}

	req := CreateGameRequest{}
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		err = errors.Wrap(400, "Invalid request: body cannot be unmarshaled", "", err)
		return api.Failure(err)
	}
	if req.Orientation != "white" && req.Orientation != "black" {
		err := errors.New(400, "Invalid request: orientation must be `white` or `black`", "")
		return api.Failure(err)
	}

	var pgnText string
	var err error
	if req.Type == game.LichessChapter {
		pgnText, err = game.GetLichessChapter(req.Url)
	} else if req.Type == game.Manual {
		pgnText = req.PgnText
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: type `%s` not supported", req.Type), "")
	}

	if err != nil {
		return api.Failure(err)
	}

	update, err := game.GetGameUpdate(pgnText, req.Orientation)
	if err != nil {
		return api.Failure(err)
	}

	game, err := repository.UpdateGame(cohort, id, info.Username, update)
	if err != nil {
		return api.Failure(err)
	}
	return api.Success(game)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	if _, ok := event.QueryStringParameters["featured"]; ok {
		return featureGame(event), nil
	}

	return updatePgn(event), nil
}

func main() {
	lambda.Start(Handler)
}
