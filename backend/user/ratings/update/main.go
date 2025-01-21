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

var repository = database.DynamoDB

var now = time.Now()

type isBannedFunc func(username string) bool

func updateRating(rating *database.Rating, systemName string, fetcher ratings.RatingFetchFunc) bool {
	rating.Username = strings.TrimSpace(rating.Username)
	if rating.Username == "" {
		return false
	}

	data, err := fetcher(rating.Username)
	if err != nil {
		log.Errorf("Failed to get %s rating for %q: %v", systemName, rating.Username, err)
		return false
	}

	shouldUpdate := false

	if data.CurrentRating != rating.CurrentRating || data.Deviation != rating.Deviation || data.NumGames != rating.NumGames {
		rating.CurrentRating = data.CurrentRating
		rating.Deviation = data.Deviation
		rating.NumGames = data.NumGames
		shouldUpdate = true
	}

	if rating.StartRating == 0 {
		rating.StartRating = data.CurrentRating
		shouldUpdate = true
	}

	return shouldUpdate
}

func updateIfNecessary(user *database.User, queuedUpdates []*database.User, ratingFetchFuncs map[database.RatingSystem]ratings.RatingFetchFunc, isBannedLichess isBannedFunc) (*database.User, []*database.User) {
	shouldUpdate := false

	for system, rating := range user.Ratings {
		if system != database.Custom {
			shouldUpdate = updateRating(rating, string(system), ratingFetchFuncs[system]) || shouldUpdate
		}

		if system == database.Lichess && isBannedLichess(rating.Username) {
			if user.LichessBan == "" {
				user.LichessBan = rating.Username
				shouldUpdate = true
			}
		}

		if now.Weekday() == time.Monday {
			history := user.RatingHistories[system]
			if rating.CurrentRating > 0 && (history == nil || history[len(history)-1].Rating != rating.CurrentRating) {
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
		if lichess := user.Ratings[database.Lichess]; lichess != nil {
			if lichessUsername := strings.TrimSpace(lichess.Username); lichessUsername != "" {
				lichessUsernames = append(lichessUsernames, lichessUsername)
			}
		}
	}
	lichessRatings, err := ratings.FetchBulkLichessRatings(lichessUsernames)
	if err != nil {
		log.Error(err)
	}

	fetchLichessRating := func(username string) (*database.Rating, error) {
		if rating, ok := lichessRatings[strings.ToLower(username)]; !ok {
			return nil, errors.New("no Lichess rating found in cache")
		} else {
			return &database.Rating{
				CurrentRating: rating.Performances.Classical.Rating,
				Deviation:     rating.Performances.Classical.Deviation,
				NumGames:      rating.Performances.Classical.NumGames,
			}, nil
		}
	}

	isBannedLichess := func(username string) bool {
		if result, ok := lichessRatings[strings.ToLower(username)]; !ok {
			return false
		} else {
			return result.TosViolation
		}
	}

	ratingFetchFuncs := map[database.RatingSystem]ratings.RatingFetchFunc{
		database.Chesscom: ratings.FetchChesscomRating,
		database.Lichess:  fetchLichessRating,
		database.Fide:     ratings.FetchFideRating,
		database.Uscf:     ratings.FetchUscfRating,
		database.Ecf:      ratings.FetchEcfRating,
		database.Cfc:      ratings.FetchCfcRating,
		database.Dwz:      ratings.FetchDwzRating,
		database.Acf:      ratings.FetchAcfRating,
		database.Knsb:     ratings.FetchKnsbRating,
	}

	var queuedUpdates []*database.User
	for _, user := range users {
		_, queuedUpdates = updateIfNecessary(user, queuedUpdates, ratingFetchFuncs, isBannedLichess)
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
	log.Infof("Event: %#v", event)
	log.SetRequestId(event.ID)

	var req RatingUpdateRequest
	err := json.Unmarshal(event.Detail, &req)
	if err != nil {
		log.Errorf("Failed to unmarshal request:%v ", err)
		return event, err
	}
	log.Infof("Request: %+v", req)

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
