package main

import (
	"context"
	"encoding/json"
	"fmt"
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
var mediaStore database.MediaStore = database.S3

func fetchCurrentRating(rating *database.Rating, fetcher ratings.RatingFetchFunc) error {
	rating.Username = strings.TrimSpace(rating.Username)
	if rating.Username == "" {
		rating.CurrentRating = 0
		rating.StartRating = 0
		return nil
	}

	currentRating, err := fetcher(rating.Username)
	rating.CurrentRating = currentRating
	if rating.StartRating == 0 {
		rating.StartRating = currentRating
	}
	return err
}

func fetchRatings(user *database.User, update *database.UserUpdate) error {
	if update.Ratings == nil {
		return nil
	}

	for system, rating := range *update.Ratings {
		existingRating, _ := user.Ratings[system]
		if system != database.Custom && (existingRating == nil || rating.Username != existingRating.Username ||
			rating.CurrentRating == 0 || rating.StartRating == 0) {
			if err := fetchCurrentRating(rating, ratings.RatingFetchFuncs[system]); err != nil {
				return err
			}
		}
	}
	return nil
}

func handleAutopickCohort(user *database.User, update *database.UserUpdate) api.Response {
	if update.RatingSystem == nil || *update.RatingSystem == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: ratingSystem is required when autopickCohort is true", ""))
	}
	if *update.RatingSystem == database.Custom {
		return api.Failure(funcName, errors.New(400, "Invalid request: ratingSystem cannot be CUSTOM when autopickCohort is true", ""))
	}

	if err := fetchRatings(user, update); err != nil {
		return api.Failure(funcName, err)
	}
	if cohort := update.AutopickCohort(); cohort == database.NoCohort {
		return api.Failure(funcName, errors.New(500, "Unable to choose cohort. Please contact support", fmt.Sprintf("Autopick cohort returned NoCohort for update %+v", update)))
	}

	user, err := repository.UpdateUser(user.Username, update)
	if err != nil {
		return api.Failure(funcName, err)
	}
	return api.Success(funcName, user)
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

	autopickCohort, _ := event.QueryStringParameters["autopickCohort"]
	if autopickCohort == "true" {
		return handleAutopickCohort(user, update), nil
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
			avatarUrl, err := discord.GetDiscordAvatarURL(*update.DiscordUsername)
			if err != nil {
				return api.Failure(funcName, err), nil
			}
			if !user.ProfilePictureSet && avatarUrl != "" {
				if err := mediaStore.CopyImageFromURL(avatarUrl, fmt.Sprintf("/profile/%s", info.Username)); err != nil {
					log.Errorf("Failed to copy Discord avatar URL: %v", err)
				}
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
		update.SubscriptionStatus = aws.String("SUBSCRIBED")
	}

	if update.ProfilePictureData != nil {
		if *update.ProfilePictureData == "" {
			err = mediaStore.DeleteImage(fmt.Sprintf("/profile/%s", info.Username))
		} else {
			err = mediaStore.UploadImage(fmt.Sprintf("/profile/%s", info.Username), *update.ProfilePictureData)
		}
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		update.ProfilePictureSet = aws.Bool(true)
	}

	update.SearchKey = aws.String(database.GetSearchKey(user, update))
	user, err = repository.UpdateUser(info.Username, update)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func main() {
	lambda.Start(Handler)
}
