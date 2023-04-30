package main

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/ratings"
)

const funcName = "user-update-handler"

var repository database.UserUpdater = database.DynamoDB

type ratingFetchFunc func(username string) (int, error)

func fetchCurrentRating(username **string, currentRating **int, fetcher ratingFetchFunc) error {
	if *username == nil {
		return nil
	}
	trimmedUsername := strings.TrimSpace(**username)
	*username = &trimmedUsername
	if trimmedUsername == "" {
		*currentRating = aws.Int(0)
		return nil
	}
	rating, err := fetcher(trimmedUsername)
	*currentRating = &rating
	return err
}

func fetchRatings(update *database.UserUpdate) error {
	if update.ChesscomUsername != nil {
		err := fetchCurrentRating(&update.ChesscomUsername, &update.CurrentChesscomRating, ratings.FetchChesscomRating)
		if err != nil {
			return err
		}
	}
	if update.LichessUsername != nil {
		err := fetchCurrentRating(&update.LichessUsername, &update.CurrentLichessRating, ratings.FetchLichessRating)
		if err != nil {
			return err
		}
	}
	if update.FideId != nil {
		err := fetchCurrentRating(&update.FideId, &update.CurrentFideRating, ratings.FetchFideRating)
		if err != nil {
			return err
		}
	}
	if update.UscfId != nil {
		err := fetchCurrentRating(&update.UscfId, &update.CurrentUscfRating, ratings.FetchUscfRating)
		if err != nil {
			return err
		}
	}
	if update.EcfId != nil {
		err := fetchCurrentRating(&update.EcfId, &update.CurrentEcfRating, ratings.FetchEcfRating)
		if err != nil {
			return err
		}
	}
	return nil
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	update := &database.UserUpdate{}
	if err := json.Unmarshal([]byte(event.Body), update); err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	if update.DisplayName != nil {
		displayName := strings.TrimSpace(*update.DisplayName)
		update.DisplayName = &displayName
		if *update.DisplayName == "" {
			return api.Failure(funcName, errors.New(400, "Invalid request: displayName cannot be empty", "")), nil
		}
	}
	if update.RatingSystem != nil {
		ratingSystem := strings.TrimSpace(string(*update.RatingSystem))
		update.RatingSystem = (*database.RatingSystem)(&ratingSystem)
		if *update.RatingSystem == "" {
			return api.Failure(funcName, errors.New(400, "Invalid request: ratingSystem cannot be empty", "")), nil
		}
	}
	if update.DojoCohort != nil {
		cohort := strings.TrimSpace(string(*update.DojoCohort))
		update.DojoCohort = (*database.DojoCohort)(&cohort)
		if *update.DojoCohort == "" {
			return api.Failure(funcName, errors.New(400, "Invalid request: dojoCohort cannot be empty", "")), nil
		}
	}

	if update.DiscordUsername != nil {
		username := strings.TrimSpace(*update.DiscordUsername)
		update.DiscordUsername = &username
		if *update.DiscordUsername != "" {
			if err := discord.CheckDiscordUsername(*update.DiscordUsername); err != nil {
				return api.Failure(funcName, err), nil
			}
		}
	}

	if err := fetchRatings(update); err != nil {
		return api.Failure(funcName, err), nil
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
