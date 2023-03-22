package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CloudWatchEvent

const funcName = "user-ratings-update-handler"

var repository = database.DynamoDB

var fideRegexp, _ = regexp.Compile("std</span>\n\\s+(\\d+)")
var uscfRegexp, _ = regexp.Compile("<input type=text name=rating1 size=20 readonly maxlength=20 tabindex=120 value='(\\d+)")

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

func findRating(body []byte, regex *regexp.Regexp) (int, error) {
	groups := regex.FindSubmatch(body)
	if len(groups) < 2 {
		err := errors.New(400, "Invalid request: unable to find rating regexp ", "")
		return 0, err
	}

	rating, err := strconv.Atoi(string(groups[1]))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to convert rating to int", err)
		return 0, err
	}
	return rating, nil
}

func fetchFideRating(fideId string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://ratings.fide.com/profile/%s", fideId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get Fide page", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: FIDE returned status `%d`", resp.StatusCode), "")
		return 0, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read FIDE response", err)
		return 0, err
	}
	return findRating(b, fideRegexp)
}

func fetchUscfRating(uscfId string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://www.uschess.org/msa/thin3.php?%s", uscfId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get lichess stats", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: USCF returned status `%d`", resp.StatusCode), "")
		return 0, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read USCF response", err)
		return 0, err
	}
	return findRating(b, uscfRegexp)
}

func updateUsers(users []*database.User) {
	var chesscomRating int
	var lichessRating int
	var fideRating int
	var uscfRating int
	var err error

	var updatedUsers []*database.User
	for _, user := range users {
		if user.ChesscomUsername != "" {
			if chesscomRating, err = fetchChesscomRating(user.ChesscomUsername); err != nil {
				log.Errorf("Failed to get Chess.com rating for %q: %v", user.ChesscomUsername, err)
				chesscomRating = user.CurrentChesscomRating
			}
		} else {
			chesscomRating = user.CurrentChesscomRating
		}

		if user.LichessUsername != "" {
			if lichessRating, err = fetchLichessRating(user.LichessUsername); err != nil {
				log.Errorf("Failed to get Lichess rating for %q: %v", user.LichessUsername, err)
				lichessRating = user.CurrentLichessRating
			}
		} else {
			lichessRating = user.CurrentLichessRating
		}

		if user.FideId != "" {
			if fideRating, err = fetchFideRating(user.FideId); err != nil {
				log.Errorf("Failed to get FIDE rating for %q: %v", user.FideId, err)
				fideRating = user.CurrentFideRating
			}
		} else {
			fideRating = user.CurrentFideRating
		}

		if user.UscfId != "" {
			if uscfRating, err = fetchUscfRating(user.UscfId); err != nil {
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
