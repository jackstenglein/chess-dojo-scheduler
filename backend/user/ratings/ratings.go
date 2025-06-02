package ratings

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var client = http.Client{Timeout: 5 * time.Second}

var fideRegexp, _ = regexp.Compile(`<p>(\d+)</p>\s*<p.*>STANDARD`)
var uscfCurrRegexp, _ = regexp.Compile(`Regular Rating\s*</td>\s*<td>\s*<b><nobr>\s*(\d+)`)
var uscfFutureRegexp, _ = regexp.Compile(`(?s)Regular Rating\s*<\/td>\s*<td>\s*<b><nobr>.*<\/nobr>\s*<\/b>\s*<\/td>\s*<td>\s*(\d+)`)
var uscfGameCountRegexp, _ = regexp.Compile(`<tr><td></td><td><b>(\d+)`)
var acfRegexp, _ = regexp.Compile(`Current Rating:\s*</div>\s*<div id="stats-box-data-col">\s*[-\d]*\s*</div>\s*<div id="stats-box-data-col">\s*(\d+)`)

type ChesscomResponse struct {
	Rapid struct {
		Last struct {
			Rating    int `json:"rating"`
			Deviation int `json:"rd"`
		} `json:"last"`

		Record struct {
			Wins   int `json:"win"`
			Losses int `json:"loss"`
			Draws  int `json:"draw"`
		} `json:"record"`
	} `json:"chess_rapid"`
}

type LichessResponse struct {
	Id       string `json:"id"`
	Username string `json:"username"`

	Performances struct {
		Classical struct {
			Rating    int `json:"rating"`
			NumGames  int `json:"games"`
			Deviation int `json:"rd"`
		} `json:"classical"`
	} `json:"perfs"`

	TosViolation bool `json:"tosViolation"`
}

type EcfResponse struct {
	Rating int `json:"revised_rating"`
}

type CfcResponse struct {
	Player struct {
		Rating int `json:"regular_rating"`
	} `json:"player"`
}

type KnsbResponse struct {
	Rating   int `json:"rating"`
	NumGames int `json:"num_played"`
}

type KnsbList struct {
	ListId   int    `json:"list_id"`
	Category string `json:"category"`
}

type KnsbListResponse struct {
	Items []KnsbList `json:"items"`
}

type RatingFetchFunc func(username string) (*database.Rating, error)

var RatingFetchFuncs map[database.RatingSystem]RatingFetchFunc = map[database.RatingSystem]RatingFetchFunc{
	database.Chesscom: FetchChesscomRating,
	database.Lichess:  FetchLichessRating,
	database.Fide:     FetchFideRating,
	database.Uscf:     FetchUscfRating,
	database.Ecf:      FetchEcfRating,
	database.Cfc:      FetchCfcRating,
	database.Dwz:      FetchDwzRating,
	database.Acf:      FetchAcfRating,
	database.Knsb:     FetchKnsbRating,
}

func FetchChesscomRating(chesscomUsername string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://api.chess.com/pub/player/%s/stats", chesscomUsername))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get chess.com stats", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: chess.com returned status `%d` for given player", resp.StatusCode), "")
		return nil, err
	}

	var rating ChesscomResponse
	err = json.NewDecoder(resp.Body).Decode(&rating)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read chess.com response", err)
		return nil, err
	}

	dojoRating := &database.Rating{
		CurrentRating: rating.Rapid.Last.Rating,
		Deviation:     rating.Rapid.Last.Deviation,
		NumGames:      rating.Rapid.Record.Wins + rating.Rapid.Record.Draws + rating.Rapid.Record.Losses,
	}

	return dojoRating, nil
}

func FetchLichessRating(lichessUsername string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://lichess.org/api/user/%s", lichessUsername))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get lichess stats", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: lichess returned status `%d` for given player", resp.StatusCode), "")
		return nil, err
	}

	var rating LichessResponse
	err = json.NewDecoder(resp.Body).Decode(&rating)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read lichess response", err)
		return nil, err
	}

	dojoRating := &database.Rating{
		CurrentRating: rating.Performances.Classical.Rating,
		Deviation:     rating.Performances.Classical.Deviation,
		NumGames:      rating.Performances.Classical.NumGames,
	}
	return dojoRating, nil
}

func FetchBulkLichessRatings(lichessUsernames []string) (map[string]LichessResponse, error) {
	log.Debugf("Fetching bulk lichess usernames: %#v", lichessUsernames)
	if len(lichessUsernames) == 0 {
		return make(map[string]LichessResponse, 0), nil
	}

	resp, err := client.Post("https://lichess.org/api/users", "text/plain", strings.NewReader(strings.Join(lichessUsernames, ",")))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get lichess bulk stats", err)
		return nil, err
	}

	var rs []*LichessResponse
	if err = json.NewDecoder(resp.Body).Decode(&rs); err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read lichess response", err)
		return nil, err
	}

	result := make(map[string]LichessResponse, len(rs))
	for _, r := range rs {
		result[r.Id] = *r
	}
	log.Debugf("Bulk Lichess result: %#v", result)
	return result, nil
}

func findRating(body []byte, regex *regexp.Regexp) (int, error) {
	groups := regex.FindSubmatch(body)
	if len(groups) < 2 {
		err := errors.New(400, "Unable to find rating on website", "")
		return 0, err
	}

	rating, err := strconv.Atoi(string(groups[1]))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to convert rating to int", err)
		return 0, err
	}
	return rating, nil
}

func FetchFideRating(fideId string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://ratings.fide.com/profile/%s", fideId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get Fide page", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: FIDE returned status `%d` for given ID", resp.StatusCode), "")
		return nil, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read FIDE response", err)
		return nil, err
	}

	rating, err := findRating(b, fideRegexp)
	if err != nil {
		log.Warnf("FIDE id %q: no rating found on website", fideId)
		rating = 0
	}
	return &database.Rating{CurrentRating: rating}, nil
}

func FetchUscfRating(uscfId string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://www.uschess.org/msa/MbrDtlMain.php?%s", uscfId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to get USCF page", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: USCF returned status `%d` for given ID", resp.StatusCode), "")
		return nil, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read USCF response", err)
		return nil, err
	}

	rating, err := findRating(b, uscfFutureRegexp)
	if err != nil {
		rating, err = findRating(b, uscfCurrRegexp)
		if err != nil {
			if bytes.Contains(b, []byte("Non-Member")) {
				err := errors.New(404, "Invalid request: the given USCF ID does not exist", "")
				return nil, err
			}
			log.Warnf("USCF id %q: no rating found on website", uscfId)
			rating = 0
		}
	}

	dojoRating := &database.Rating{CurrentRating: rating}

	resp, err = client.Get(fmt.Sprintf("https://www.uschess.org/datapage/gamestats.php?memid=%s", uscfId))
	if err != nil {
		log.Errorf("Failed to get USCF game stats for ID %s: %v", uscfId, err)
		return dojoRating, nil
	}
	if resp.StatusCode != 200 {
		log.Errorf("Invalid request: USCF game stats returned status `%d` for ID %s", resp.StatusCode, uscfId)
		return dojoRating, nil
	}
	b, err = io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		log.Errorf("Failed to read USCF game stats response for ID %s: %v", uscfId, err)
		return dojoRating, nil
	}

	gameCount, err := findRating(b, uscfGameCountRegexp)
	if err != nil {
		log.Errorf("Failed to find game count for USCF ID %s: %v", uscfId, err)
		return dojoRating, nil
	}

	dojoRating.NumGames = gameCount
	return dojoRating, nil
}

func FetchEcfRating(ecfId string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://rating.englishchess.org.uk/v2/new/api.php?v2/ratings/S/%s/%s", ecfId, time.Now().Format(time.DateOnly)))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed call to ECF API", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: ECF API returned status `%d`", resp.StatusCode), "")
		return nil, err
	}

	var rating EcfResponse
	if err := json.NewDecoder(resp.Body).Decode(&rating); err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to parse ECF API response", err)
		return nil, err
	}

	return &database.Rating{CurrentRating: rating.Rating}, nil
}

func FetchCfcRating(cfcId string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://server.chess.ca/api/player/v1/%s", cfcId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed call to CFC API", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: CFC API returned status `%d`", resp.StatusCode), "")
		return nil, err
	}

	var r CfcResponse
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to parse CFC API response", err)
		return nil, err
	}
	return &database.Rating{CurrentRating: r.Player.Rating}, nil
}

func FetchDwzRating(dwzId string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://www.schachbund.de/php/dewis/spieler.php?pkz=%s", dwzId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed call to DWZ API", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: DWZ API returned status `%d`", resp.StatusCode), "")
		return nil, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read DWZ response", err)
		return nil, err
	}

	const ratingIndex = 13
	tokens := strings.Split(string(b), "|")
	if ratingIndex >= len(tokens) {
		err = errors.New(400, "Invalid request: DWZ API did not return a rating", fmt.Sprintf("ratingIndex out of bounds for tokens %v", tokens))
		return nil, err
	}

	rating, err := strconv.Atoi(tokens[ratingIndex])
	if err != nil {
		return nil, errors.Wrap(400, fmt.Sprintf("Invalid request: DWZ API returned rating `%s` which cannot be converted to integer", tokens[14]), "", err)
	}
	return &database.Rating{CurrentRating: rating}, nil
}

func FetchAcfRating(acfId string) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://sachess.org.au/ratings/player?id=%s", acfId))
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to fetch ACF site", err)
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: ACF site returned status `%d`", resp.StatusCode), "")
		return nil, err
	}

	b, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read ACF response", err)
		return nil, err
	}

	rating, err := findRating(b, acfRegexp)
	if err != nil {
		log.Warnf("ACF id %q: no rating found on website", acfId)
		rating = 0
	}
	return &database.Rating{CurrentRating: rating}, nil
}

func FetchKnsbRating(knsbId string) (*database.Rating, error) {
	resp, err := client.Get("https://ratingviewer.nl/rating-lists/index.json?page=1&pageSize=10")
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed call to KNSB list API", err)
	}
	if resp.StatusCode != 200 {
		return nil, errors.New(500, "Temporary server error", fmt.Sprintf("Invalid request: KNSB list API returned status `%d`", resp.StatusCode))
	}

	var listResp KnsbListResponse
	if err := json.NewDecoder(resp.Body).Decode(&listResp); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal KNSB list response", err)
	}

	for _, item := range listResp.Items {
		if item.Category == "C" {
			return fetchKnsbListRating(knsbId, item.ListId)
		}
	}
	return nil, errors.New(500, "Temporary server error", "Failed to find category C in KNSB list API response")
}

func fetchKnsbListRating(knsbId string, listId int) (*database.Rating, error) {
	resp, err := client.Get(fmt.Sprintf("https://ratingviewer.nl/metrics/ratingList/%s/%d.json", knsbId, listId))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed call to KNSB API", err)
		return nil, err
	}

	if resp.StatusCode != 200 {
		return nil, errors.New(400, fmt.Sprintf("Invalid request: KNSB API returned status `%d`", resp.StatusCode), "")
	}

	var r KnsbResponse
	if err := json.NewDecoder(resp.Body).Decode(&r); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal KNSB response", err)
	}
	return &database.Rating{CurrentRating: r.Rating, NumGames: r.NumGames}, nil
}
