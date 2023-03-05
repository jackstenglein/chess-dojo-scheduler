package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CloudWatchEvent

const funcName = "user-ratings-update-handler"

var repository = database.DynamoDB

type ChesscomResponse struct {
	Rapid struct {
		Last struct {
			Rating int `json:"rating"`
		} `json:"last"`
	} `json:"chess_rapid"`
}

type LichessResponse struct {
	Performances struct {
		Classical struct {
			Rating int `json:"rating"`
		} `json:"classical"`
	} `json:"perfs"`
}

func fetchChesscomRating(chesscomUsername string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://api.chess.com/pub/player/%s/stats", chesscomUsername))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get chess.com stats", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: chess.com returned status `%d`", resp.StatusCode), "")
		return 0, err
	}

	var rating ChesscomResponse
	err = json.NewDecoder(resp.Body).Decode(&rating)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read chess.com response", err)
		return 0, err
	}

	return rating.Rapid.Last.Rating, nil
}

func fetchLichessRating(lichessUsername string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://lichess.org/api/user/%s", lichessUsername))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get lichess stats", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: lichess returned status `%d`", resp.StatusCode), "")
		return 0, err
	}

	var rating LichessResponse
	err = json.NewDecoder(resp.Body).Decode(&rating)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read lichess response", err)
		return 0, err
	}

	return rating.Performances.Classical.Rating, nil
}

func updateUsers(users []*database.User) {
	var updatedUsers []*database.User
	for _, user := range users {
		chesscomRating, err := fetchChesscomRating(user.ChesscomUsername)
		if err != nil {
			log.Errorf("Failed to get Chess.com rating for %s: %v", user.ChesscomUsername, err)
			chesscomRating = user.CurrentChesscomRating
		}

		lichessRating, err := fetchLichessRating(user.LichessUsername)
		if err != nil {
			log.Errorf("Failed to get Lichess rating for %s: %v", user.LichessUsername, err)
			lichessRating = user.CurrentLichessRating
		}

		if user.CurrentChesscomRating != chesscomRating || user.CurrentLichessRating != lichessRating {
			user.CurrentChesscomRating = chesscomRating
			user.CurrentLichessRating = lichessRating
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
