package main

import (
	"context"
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
	shouldUpdate = shouldUpdate || fetchRating(user.FideId, "FIDE", &user.CurrentFideRating, user.StartFideRating, ratings.FetchFideRating)
	shouldUpdate = shouldUpdate || fetchRating(user.UscfId, "USCF", &user.CurrentUscfRating, user.StartUscfRating, ratings.FetchUscfRating)
	shouldUpdate = shouldUpdate || fetchRating(user.EcfId, "ECF", &user.CurrentEcfRating, user.StartEcfRating, ratings.FetchEcfRating)
	shouldUpdate = shouldUpdate || fetchRating(user.CfcId, "CFC", &user.CurrentCfcRating, user.StartCfcRating, ratings.FetchCfcRating)
	shouldUpdate = shouldUpdate || fetchRating(user.DwzId, "DWZ", &user.CurrentDwzRating, user.StartDwzRating, ratings.FetchDwzRating)

	shouldUpdate = shouldUpdate || fetchRating(user.LichessUsername, "Lichess", &user.CurrentLichessRating, user.StartLichessRating,
		func(username string) (int, error) {
			if rating, ok := lichessRatings[strings.ToLower(username)]; !ok {
				return 0, errors.New("No Lichess rating found in cache")
			} else {
				return rating, nil
			}
		},
	)

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

func updateStats(stats *database.UserStatistics, user *database.User, requirements []*database.Requirement) {
	if !user.DojoCohort.IsValid() || user.RatingSystem == "" {
		return
	}

	isActive := user.UpdatedAt >= monthAgo
	ratingChange := user.GetRatingChange()

	score := user.CalculateScore(requirements)

	stats.Participants[user.DojoCohort] += 1
	stats.DojoScores[user.DojoCohort] += score
	stats.RatingChanges[user.DojoCohort] += ratingChange
	stats.RatingSystems[user.DojoCohort][user.RatingSystem] += 1

	if isActive {
		stats.ActiveParticipants[user.DojoCohort] += 1
		stats.ActiveDojoScores[user.DojoCohort] += score
		stats.ActiveRatingChanges[user.DojoCohort] += ratingChange
		stats.ActiveRatingSystems[user.DojoCohort][user.RatingSystem] += 1
	}

	for _, progress := range user.Progress {
		for cohort, minutes := range progress.MinutesSpent {
			stats.MinutesSpent[cohort] += minutes

			if isActive {
				stats.ActiveMinutesSpent[cohort] += minutes
			}
		}
	}
}

func updateUsers(users []*database.User, stats *database.UserStatistics, requirements []*database.Requirement) {
	var queuedUpdates []*database.User

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

	for _, user := range users {
		user, queuedUpdates = updateIfNecessary(user, queuedUpdates, lichessRatings)
		updateStats(stats, user, requirements)
	}

	if len(queuedUpdates) > 0 {
		if err := repository.UpdateUserRatings(queuedUpdates); err != nil {
			log.Error(err)
		} else {
			log.Infof("Updated %d users", len(queuedUpdates))
		}
	}
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)
	log.SetRequestId(event.ID)

	log.Debug("Fetching requirements")
	var requirements []*database.Requirement
	var rs []*database.Requirement
	var startKey string
	var err error
	for ok := true; ok; ok = startKey != "" {
		rs, startKey, err = repository.ScanRequirements("", startKey)
		if err != nil {
			log.Errorf("Failed to scan requirements: %v", err)
			return event, err
		}
		requirements = append(requirements, rs...)
	}
	log.Debugf("Got %d requirements", len(requirements))

	stats := database.NewUserStatistics()
	var users []*database.User
	startKey = ""
	err = nil
	for ok := true; ok; ok = startKey != "" {
		users, startKey, err = repository.ScanUserRatings(startKey)
		if err != nil {
			log.Errorf("Failed to scan users: %v", err)
			return event, err
		}
		log.Infof("Processing %d users", len(users))
		updateUsers(users, stats, requirements)
	}

	if err := repository.SetUserStatistics(stats); err != nil {
		log.Error(err)
	}

	return event, nil
}

func main() {
	lambda.Start(Handler)
}
