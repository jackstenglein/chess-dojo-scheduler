package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/ratings"
)

const funcName = "user-update-handler"

var repository database.UserUpdater = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	update := &database.UserUpdate{}
	if err := json.Unmarshal([]byte(event.Body), update); err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	if update.DiscordUsername != nil && *update.DiscordUsername != "" {
		if err := discord.CheckDiscordUsername(*update.DiscordUsername); err != nil {
			return api.Failure(funcName, err), nil
		}
	}

	if update.ChesscomUsername != nil && *update.ChesscomUsername != "" {
		if chesscomRating, err := ratings.FetchChesscomRating(*update.ChesscomUsername); err != nil {
			return api.Failure(funcName, err), nil
		} else {
			update.CurrentChesscomRating = &chesscomRating
		}
	}
	if update.LichessUsername != nil && *update.LichessUsername != "" {
		if lichessRating, err := ratings.FetchLichessRating(*update.LichessUsername); err != nil {
			return api.Failure(funcName, err), nil
		} else {
			update.CurrentLichessRating = &lichessRating
		}
	}
	if update.FideId != nil && *update.FideId != "" {
		if fideRating, err := ratings.FetchFideRating(*update.FideId); err != nil {
			return api.Failure(funcName, err), nil
		} else {
			update.CurrentFideRating = &fideRating
		}
	}
	if update.UscfId != nil && *update.UscfId != "" {
		if uscfRating, err := ratings.FetchUscfRating(*update.UscfId); err != nil {
			return api.Failure(funcName, err), nil
		} else {
			update.CurrentUscfRating = &uscfRating
		}
	}

	user, err := repository.UpdateUser(info.Username, update)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func main() {
	lambda.Start(Handler)
}
