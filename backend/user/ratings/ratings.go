package ratings

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

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

type EcfResponse struct {
	Rating int `json:"revised_rating"`
}

func FetchChesscomRating(chesscomUsername string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://api.chess.com/pub/player/%s/stats", chesscomUsername))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get chess.com stats", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: chess.com returned status `%d` for given player", resp.StatusCode), "")
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

func FetchLichessRating(lichessUsername string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://lichess.org/api/user/%s", lichessUsername))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get lichess stats", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: lichess returned status `%d` for given player", resp.StatusCode), "")
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
		err := errors.New(400, "Unable to find rating on website ", "")
		return 0, err
	}

	rating, err := strconv.Atoi(string(groups[1]))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to convert rating to int", err)
		return 0, err
	}
	return rating, nil
}

func FetchFideRating(fideId string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://ratings.fide.com/profile/%s", fideId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get Fide page", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: FIDE returned status `%d` for given ID", resp.StatusCode), "")
		return 0, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read FIDE response", err)
		return 0, err
	}

	rating, err := findRating(b, fideRegexp)
	if err != nil {
		return 0, errors.Wrap(400, fmt.Sprintf("Invalid FIDE id `%s`: no rating found on FIDE website", fideId), "", err)
	}
	return rating, nil
}

func FetchUscfRating(uscfId string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://www.uschess.org/msa/thin3.php?%s", uscfId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get lichess stats", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: USCF returned status `%d` for given ID", resp.StatusCode), "")
		return 0, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read USCF response", err)
		return 0, err
	}

	rating, err := findRating(b, uscfRegexp)
	if err != nil {
		if bytes.Contains(b, []byte("Non-Member")) {
			err := errors.New(404, "Invalid request: the given USCF ID does not exist", "")
			return 0, err
		}
		return 0, errors.Wrap(400, fmt.Sprintf("Invalid USCF id `%s`: no rating found on USCF website", uscfId), "", err)
	}
	return rating, nil
}

func FetchEcfRating(ecfId string) (int, error) {
	resp, err := http.Get(fmt.Sprintf("https://www.ecfrating.org.uk/v2/new/api.php?v2/ratings/S/%s/%s", ecfId, time.Now().Format(time.DateOnly)))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed call to ECF API", err)
		return 0, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: ECF API returned status `%d`", resp.StatusCode), "")
		return 0, err
	}

	var rating EcfResponse
	if err := json.NewDecoder(resp.Body).Decode(&rating); err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to parse ECF API response", err)
		return 0, err
	}

	return rating.Rating, nil
}
