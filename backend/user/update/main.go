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
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/access"
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

func fetchRatings(user *database.User, update *database.UserUpdate) error {
	if update.ChesscomUsername != nil {
		if err := fetchCurrentRating(&update.ChesscomUsername, &update.CurrentChesscomRating, ratings.FetchChesscomRating); err != nil {
			return err
		}
		if user.StartChesscomRating == 0 && update.StartChesscomRating == nil {
			update.StartChesscomRating = update.CurrentChesscomRating
		}
	}
	if update.LichessUsername != nil {
		if err := fetchCurrentRating(&update.LichessUsername, &update.CurrentLichessRating, ratings.FetchLichessRating); err != nil {
			return err
		}
		if user.StartLichessRating == 0 && update.StartLichessRating == nil {
			update.StartLichessRating = update.CurrentLichessRating
		}
	}
	if update.FideId != nil {
		if err := fetchCurrentRating(&update.FideId, &update.CurrentFideRating, ratings.FetchFideRating); err != nil {
			return err
		}
		if user.StartFideRating == 0 && update.StartFideRating == nil {
			update.StartFideRating = update.CurrentFideRating
		}
	}
	if update.UscfId != nil {
		if err := fetchCurrentRating(&update.UscfId, &update.CurrentUscfRating, ratings.FetchUscfRating); err != nil {
			return err
		}
		if user.StartUscfRating == 0 && update.StartUscfRating == nil {
			update.StartUscfRating = update.CurrentUscfRating
		}
	}
	if update.EcfId != nil {
		if err := fetchCurrentRating(&update.EcfId, &update.CurrentEcfRating, ratings.FetchEcfRating); err != nil {
			return err
		}
		if user.StartEcfRating == 0 && update.StartEcfRating == nil {
			update.StartEcfRating = update.CurrentEcfRating
		}
	}
	if update.CfcId != nil {
		if err := fetchCurrentRating(&update.CfcId, &update.CurrentCfcRating, ratings.FetchCfcRating); err != nil {
			return err
		}
		if user.StartCfcRating == 0 && update.StartCfcRating == nil {
			update.StartCfcRating = update.CurrentCfcRating
		}
	}
	if update.DwzId != nil {
		if err := fetchCurrentRating(&update.DwzId, &update.CurrentDwzRating, ratings.FetchDwzRating); err != nil {
			return err
		}
		if user.StartDwzRating == 0 && update.StartDwzRating == nil {
			update.StartDwzRating = update.CurrentDwzRating
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

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
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

	if err := fetchRatings(user, update); err != nil {
		return api.Failure(funcName, err), nil
	}

	if update.WixEmail != nil {
		if *update.WixEmail == "" {
			return api.Failure(funcName, errors.New(400, "Invalid request: wixEmail cannot be empty", "")), nil
		}

		users, _, err := repository.FindUsersByWixEmail(*update.WixEmail, "")
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		if len(users) > 0 && users[0].Username != info.Username {
			return api.Failure(funcName, errors.New(403, "Invalid request: this email is already associated with another account", "")), nil
		}

		if _, err = access.IsForbidden(*update.WixEmail); err != nil {
			return api.Failure(funcName, err), nil
		}
		update.IsForbidden = aws.Bool(false)
	}

	user, err = repository.UpdateUser(info.Username, update)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func main() {
	lambda.Start(Handler)
}
