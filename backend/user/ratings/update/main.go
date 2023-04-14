package main

import (
	"context"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/ratings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CloudWatchEvent

const funcName = "user-ratings-update-handler"

var repository = database.DynamoDB

func updateUsers(users []*database.User) {
	var chesscomRating int
	var lichessRating int
	var fideRating int
	var uscfRating int
	var err error

	var updatedUsers []*database.User
	for _, user := range users {
		if user.ChesscomUsername != "" {
			if chesscomRating, err = ratings.FetchChesscomRating(user.ChesscomUsername); err != nil {
				log.Errorf("Failed to get Chess.com rating for %q: %v", user.ChesscomUsername, err)
				chesscomRating = user.CurrentChesscomRating
			}
		} else {
			chesscomRating = user.CurrentChesscomRating
		}

		if user.LichessUsername != "" {
			if lichessRating, err = ratings.FetchLichessRating(user.LichessUsername); err != nil {
				log.Errorf("Failed to get Lichess rating for %q: %v", user.LichessUsername, err)
				lichessRating = user.CurrentLichessRating
			}
		} else {
			lichessRating = user.CurrentLichessRating
		}

		if user.FideId != "" {
			if fideRating, err = ratings.FetchFideRating(user.FideId); err != nil {
				log.Errorf("Failed to get FIDE rating for %q: %v", user.FideId, err)
				fideRating = user.CurrentFideRating
			}
		} else {
			fideRating = user.CurrentFideRating
		}

		if user.UscfId != "" {
			if uscfRating, err = ratings.FetchUscfRating(user.UscfId); err != nil {
				log.Errorf("Failed to get USCF rating for %q: %v", user.UscfId, err)
				uscfRating = user.CurrentUscfRating
			}
		} else {
			uscfRating = user.CurrentUscfRating
		}

		if user.CurrentChesscomRating != chesscomRating || user.CurrentLichessRating != lichessRating ||
			user.CurrentFideRating != fideRating || user.CurrentUscfRating != uscfRating {
			user.CurrentChesscomRating = chesscomRating
			user.CurrentLichessRating = lichessRating
			user.CurrentFideRating = fideRating
			user.CurrentUscfRating = uscfRating
			updatedUsers = append(updatedUsers, user)
		}

		if len(updatedUsers) == 25 {
			if err := repository.UpdateUserRatings(updatedUsers); err != nil {
				log.Error(err)
			} else {
				log.Debugf("Updated %d users", len(updatedUsers))
			}
			updatedUsers = nil
		}
	}

	if len(updatedUsers) > 0 {
		if err := repository.UpdateUserRatings(updatedUsers); err != nil {
			log.Error(err)
		} else {
			log.Debugf("Updated %d users", len(updatedUsers))
		}
	}
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)
	log.SetRequestId(event.ID)

	var users []*database.User
	var startKey string
	var err error
	for ok := true; ok; ok = startKey != "" {
		users, startKey, err = repository.ScanUserRatings(startKey)
		if err != nil {
			log.Errorf("Failed to scan users: %v", err)
			return event, err
		}
		updateUsers(users)
	}

	return event, nil
}

func main() {
	lambda.Start(Handler)
}
