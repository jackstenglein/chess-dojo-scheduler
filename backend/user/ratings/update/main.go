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

var now = time.Now()

type ratingFetchFunc func(username string) (int, error)

func updateRating(rating *database.Rating, systemName string, fetcher ratingFetchFunc) bool {
	rating.Username = strings.TrimSpace(rating.Username)
	if rating.Username == "" {
		return false
	}

	currentRating, err := fetcher(rating.Username)
	if err != nil {
		log.Errorf("Failed to get %s rating for %q: %v", systemName, rating.Username, err)
		return false
	}

	shouldUpdate := false

	if currentRating != rating.CurrentRating {
		rating.CurrentRating = currentRating
		shouldUpdate = true
	}

	if rating.StartRating == 0 {
		rating.StartRating = currentRating
		shouldUpdate = true
	}

	return shouldUpdate
}

func updateIfNecessary(user *database.User, queuedUpdates []*database.User, lichessRatings map[string]int) (*database.User, []*database.User) {
	fetchLichessRating := func(username string) (int, error) {
		if rating, ok := lichessRatings[strings.ToLower(username)]; !ok {
			return 0, errors.New("No Lichess rating found in cache")
		} else {
			return rating, nil
		}
	}

	ratingFetchFuncs := map[database.RatingSystem]ratingFetchFunc{
		database.Chesscom: ratings.FetchChesscomRating,
		database.Lichess:  fetchLichessRating,
		database.Fide:     ratings.FetchFideRating,
		database.Uscf:     ratings.FetchUscfRating,
		database.Ecf:      ratings.FetchEcfRating,
		database.Cfc:      ratings.FetchCfcRating,
		database.Dwz:      ratings.FetchDwzRating,
	}

	shouldUpdate := false

	for system, rating := range user.Ratings {
		if system != database.Custom {
			shouldUpdate = updateRating(rating, string(system), ratingFetchFuncs[system]) || shouldUpdate
		}

		if now.Weekday() == time.Monday {
			history := user.RatingHistories[system]
			if history == nil || history[len(history)-1].Rating != rating.CurrentRating {
				if user.RatingHistories == nil {
					user.RatingHistories = make(map[database.RatingSystem][]database.RatingHistory)
				}
				user.RatingHistories[system] = append(history, database.RatingHistory{
					Date:   now.Format(time.RFC3339),
					Rating: rating.CurrentRating,
				})
				shouldUpdate = true
			}
		}
	}

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
		if lichess, _ := user.Ratings[database.Lichess]; lichess != nil {
			if lichessUsername := strings.TrimSpace(lichess.Username); lichessUsername != "" {
				lichessUsernames = append(lichessUsernames, lichessUsername)
			}
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
