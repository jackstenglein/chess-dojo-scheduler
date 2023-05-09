package main

import (
	"context"
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

func updateIfNecessary(user *database.User, queuedUpdates []*database.User, lichessRatings map[string]int) (*database.User, []*database.User) {
	var chesscomRating, lichessRating, fideRating, uscfRating, ecfRating, cfcRating int
	var err error
	var ok bool

	if chesscomUsername := strings.TrimSpace(user.ChesscomUsername); chesscomUsername != "" {
		if chesscomRating, err = ratings.FetchChesscomRating(chesscomUsername); err != nil {
			log.Errorf("Failed to get Chess.com rating for %q: %v", user.ChesscomUsername, err)
			chesscomRating = user.CurrentChesscomRating
		}
	} else {
		chesscomRating = user.CurrentChesscomRating
	}

	if lichessUsername := strings.TrimSpace(user.LichessUsername); lichessUsername != "" {
		if lichessRating, ok = lichessRatings[lichessUsername]; !ok {
			log.Errorf("No lichess rating found for user %q", user.LichessUsername)
			lichessRating = user.CurrentLichessRating
		}
	} else {
		lichessRating = user.CurrentLichessRating
	}

	if fideId := strings.TrimSpace(user.FideId); fideId != "" {
		if fideRating, err = ratings.FetchFideRating(fideId); err != nil {
			log.Errorf("Failed to get FIDE rating for %q: %v", user.FideId, err)
			fideRating = user.CurrentFideRating
		}
	} else {
		fideRating = user.CurrentFideRating
	}

	if uscfId := strings.TrimSpace(user.UscfId); uscfId != "" {
		if uscfRating, err = ratings.FetchUscfRating(uscfId); err != nil {
			log.Errorf("Failed to get USCF rating for %q: %v", user.UscfId, err)
			uscfRating = user.CurrentUscfRating
		}
	} else {
		uscfRating = user.CurrentUscfRating
	}

	if ecfId := strings.TrimSpace(user.EcfId); ecfId != "" {
		if ecfRating, err = ratings.FetchEcfRating(ecfId); err != nil {
			log.Errorf("Failed to get ECF rating for %q: %v", user.EcfId, err)
			ecfRating = user.CurrentEcfRating
		}
	} else {
		ecfRating = user.CurrentEcfRating
	}

	if cfcId := strings.TrimSpace(user.CfcId); cfcId != "" {
		if cfcRating, err = ratings.FetchCfcRating(cfcId); err != nil {
			log.Errorf("Failed to get CFC rating for %q: %v", user.CfcId, err)
			cfcRating = user.CurrentCfcRating
		}
	} else {
		cfcRating = user.CurrentCfcRating
	}

	if user.CurrentChesscomRating != chesscomRating ||
		user.CurrentLichessRating != lichessRating ||
		user.CurrentFideRating != fideRating ||
		user.CurrentUscfRating != uscfRating ||
		user.CurrentEcfRating != ecfRating ||
		user.CurrentCfcRating != cfcRating ||
		user.StartChesscomRating == 0 ||
		user.StartLichessRating == 0 ||
		user.StartFideRating == 0 ||
		user.StartUscfRating == 0 ||
		user.StartEcfRating == 0 ||
		user.StartCfcRating == 0 {

		user.CurrentChesscomRating = chesscomRating
		user.CurrentLichessRating = lichessRating
		user.CurrentFideRating = fideRating
		user.CurrentUscfRating = uscfRating
		user.CurrentEcfRating = ecfRating
		user.CurrentCfcRating = cfcRating

		queuedUpdates = append(queuedUpdates, user)
		if len(queuedUpdates) == 25 {
			log.Debugf("Updating users: %#v", queuedUpdates)
			if err := repository.UpdateUserRatings(queuedUpdates); err != nil {
				log.Error(err)
			} else {
				log.Debugf("Updated %d users", len(queuedUpdates))
			}
			queuedUpdates = nil
		}
	}

	return user, queuedUpdates
}

func updateStats(stats *database.UserStatistics, user *database.User) {
	if !user.DojoCohort.IsValid() || user.RatingSystem == "" {
		return
	}

	isActive := user.UpdatedAt >= monthAgo
	ratingChange := user.GetRatingChange()

	stats.Participants[database.AllCohorts] += 1
	stats.Participants[user.DojoCohort] += 1

	stats.RatingChanges[database.AllCohorts] += ratingChange
	stats.RatingChanges[user.DojoCohort] += ratingChange

	stats.RatingSystems[database.AllCohorts][user.RatingSystem] += 1
	stats.RatingSystems[user.DojoCohort][user.RatingSystem] += 1

	if isActive {
		stats.ActiveParticipants[database.AllCohorts] += 1
		stats.ActiveParticipants[user.DojoCohort] += 1

		stats.ActiveRatingChanges[database.AllCohorts] += ratingChange
		stats.ActiveRatingChanges[user.DojoCohort] += ratingChange

		stats.ActiveRatingSystems[database.AllCohorts][user.RatingSystem] += 1
		stats.ActiveRatingSystems[user.DojoCohort][user.RatingSystem] += 1
	}

	for _, progress := range user.Progress {
		for cohort, minutes := range progress.MinutesSpent {
			stats.MinutesSpent[database.AllCohorts] += minutes
			stats.MinutesSpent[cohort] += minutes

			if isActive {
				stats.ActiveMinutesSpent[database.AllCohorts] += minutes
				stats.ActiveMinutesSpent[cohort] += minutes
			}
		}
	}
}

func updateUsers(users []*database.User, stats *database.UserStatistics) {
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
		updateStats(stats, user)
	}

	if len(queuedUpdates) > 0 {
		if err := repository.UpdateUserRatings(queuedUpdates); err != nil {
			log.Error(err)
		} else {
			log.Debugf("Updated %d users", len(queuedUpdates))
		}
	}
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)
	log.SetRequestId(event.ID)

	stats := database.NewUserStatistics()

	var users []*database.User
	var startKey string
	var err error
	for ok := true; ok; ok = startKey != "" {
		users, startKey, err = repository.ScanUserRatings(startKey)
		if err != nil {
			log.Errorf("Failed to scan users: %v", err)
			return event, err
		}
		log.Debugf("Updating %d users", len(users))
		updateUsers(users, stats)
	}

	if err := repository.SetUserStatistics(stats); err != nil {
		log.Error(err)
	}

	return event, nil
}

func main() {
	lambda.Start(Handler)
}
