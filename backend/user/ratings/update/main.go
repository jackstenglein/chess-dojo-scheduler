package main

import (
	"context"
	"encoding/json"
	"errors"
	"strings"
	"time"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/ratings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CloudWatchEvent

const funcName = "user-ratings-update-handler"

var repository = database.DynamoDB

var monthAgo = time.Now().Add(database.ONE_MONTH_AGO).Format(time.RFC3339)

type ratingFetchFunc func(username string) (int, error)

func fetchRating(username string, ratingSystem string, currentRating *int, startRating int, fetcher ratingFetchFunc) bool {
	trimmedUsername := strings.TrimSpace(username)
	if trimmedUsername == "" {
		return false
	}

	rating, err := fetcher(trimmedUsername)
	if err != nil {
		log.Errorf("Failed to get %s rating for %q: %v", ratingSystem, username, err)
		return false
	}

	if rating != *currentRating {
		*currentRating = rating
		return true
	}

	if startRating == 0 {
		return true
	}

	return false
}

func updateIfNecessary(user *database.User, queuedUpdates []*database.User, lichessRatings map[string]int) (*database.User, []*database.User) {
	shouldUpdate := fetchRating(user.ChesscomUsername, "Chess.com", &user.CurrentChesscomRating, user.StartChesscomRating, ratings.FetchChesscomRating)
	shouldUpdate = fetchRating(user.FideId, "FIDE", &user.CurrentFideRating, user.StartFideRating, ratings.FetchFideRating) || shouldUpdate
	shouldUpdate = fetchRating(user.UscfId, "USCF", &user.CurrentUscfRating, user.StartUscfRating, ratings.FetchUscfRating) || shouldUpdate
	shouldUpdate = fetchRating(user.EcfId, "ECF", &user.CurrentEcfRating, user.StartEcfRating, ratings.FetchEcfRating) || shouldUpdate
	shouldUpdate = fetchRating(user.CfcId, "CFC", &user.CurrentCfcRating, user.StartCfcRating, ratings.FetchCfcRating) || shouldUpdate
	shouldUpdate = fetchRating(user.DwzId, "DWZ", &user.CurrentDwzRating, user.StartDwzRating, ratings.FetchDwzRating) || shouldUpdate

	shouldUpdate = fetchRating(user.LichessUsername, "Lichess", &user.CurrentLichessRating, user.StartLichessRating,
		func(username string) (int, error) {
			if rating, ok := lichessRatings[strings.ToLower(username)]; !ok {
				return 0, errors.New("No Lichess rating found in cache")
			} else {
				return rating, nil
			}
		},
	) || shouldUpdate

	if shouldUpdate {
		queuedUpdates = append(queuedUpdates, user)
		if len(queuedUpdates) == 25 {
			if err := repository.UpdateUserRatings(queuedUpdates); err != nil {
				log.Error(err)
			} else {
				log.Infof("Updated %d users", len(queuedUpdates))
			}
			queuedUpdates = nil
		}
	}

	return user, queuedUpdates
}

func updateUsers(users []*database.User) {
	if len(users) == 0 {
		return
	}

	lichessUsernames := make([]string, 0, len(users))
	for _, user := range users {
		if lichessUsername := strings.TrimSpace(user.LichessUsername); lichessUsername != "" {
			lichessUsernames = append(lichessUsernames, lichessUsername)
		}
	}
	lichessRatings, err := ratings.FetchBulkLichessRatings(lichessUsernames)
	if err != nil {
		log.Error(err)
	}

	var queuedUpdates []*database.User
	for _, user := range users {
		user, queuedUpdates = updateIfNecessary(user, queuedUpdates, lichessRatings)
	}

	if len(queuedUpdates) > 0 {
		if err := repository.UpdateUserRatings(queuedUpdates); err != nil {
			log.Error(err)
		} else {
			log.Infof("Updated %d users", len(queuedUpdates))
		}
	}
}

type RatingUpdateRequest struct {
	Cohorts []database.DojoCohort `json:"cohorts"`
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)
	log.SetRequestId(event.ID)

	var req RatingUpdateRequest
	err := json.Unmarshal(event.Detail, &req)
	if err != nil {
		log.Errorf("Failed to unmarshal request:%v ", err)
		return event, err
	}
	log.Debugf("Request: %+v", req)

	var startKey string
	for _, cohort := range req.Cohorts {
		log.Debugf("Processing cohort %s", cohort)

		var users []*database.User
		startKey = ""
		for ok := true; ok; ok = startKey != "" {
			users, startKey, err = repository.ListUserRatings(cohort, startKey)
			if err != nil {
				log.Errorf("Failed to scan users: %v", err)
				return event, err
			}
			log.Infof("Processing %d users", len(users))
			updateUsers(users)
		}
	}

	return event, nil
}

func main() {
	lambda.Start(Handler)
}
