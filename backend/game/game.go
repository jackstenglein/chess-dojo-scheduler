package game

import (
	"bufio"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/google/uuid"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/malbrecht/chess/pgn"
)

type ImportType string

type HeaderData struct {
	White string `json:"white"`
	Black string `json:"black"`
	Date  string `json:"date"`
}

const (
	LichessChapter ImportType = "lichessChapter"
	LichessStudy              = "lichessStudy"
	Manual                    = "manual"
)

func GetLichessChapter(url string) (string, error) {
	matched, err := regexp.MatchString("^https://lichess.org/study/.{8}/.{8}$", url)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed regexp.MatchString", err)
		return "", err
	}
	if !matched {
		err = errors.New(400, fmt.Sprintf("Invalid request: url `%s` does not match the Lichess chapter format", url), "")
		return "", err
	}

	return fetchLichessStudy(url)
}

func GetLichessStudy(url string) ([]string, error) {
	matched, err := regexp.MatchString("^https://lichess.org/study/.{8}$", url)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed regexp.MatchString", err)
		return nil, err
	}
	if !matched {
		err = errors.New(400, fmt.Sprintf("Invalid request: url `%s` does not match the Lichess study format", url), "")
		return nil, err
	}

	allPgns, err := fetchLichessStudy(url)
	if err != nil {
		return nil, err
	}

	log.Debug("PGN data before splitting: ", allPgns)
	games := strings.Split(allPgns, "\n\n\n[")
	result := make([]string, 0, len(games))
	for i, g := range games {
		g = strings.TrimSpace(g)
		if g != "" {
			if i != 0 {
				g = fmt.Sprintf("[%s", g)
			}
			result = append(result, g)
		}
	}
	return result, nil
}

func fetchLichessStudy(url string) (string, error) {
	resp, err := http.Get(url + ".pgn?source=true")
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed http.Get", err)
		return "", err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: lichess returned status `%d`. The study must be unlisted or public.", resp.StatusCode), "")
		return "", err
	}

	body, err := io.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read lichess response", err)
		return "", err
	}
	return string(body), nil
}

func GetHeaders(pgnText string) (map[string]string, error) {
	headers := make(map[string]string)

	scanner := bufio.NewScanner(strings.NewReader(pgnText))
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "[") && strings.HasSuffix(line, "\"]") {
			valueIndex := strings.Index(line, " \"")
			if valueIndex < 0 {
				return nil, errors.New(400, fmt.Sprintf("Invalid request: PGN header `%s` has wrong format", line), "")
			}

			key := line[1:valueIndex]
			value := line[valueIndex+2 : len(line)-2]

			headers[key] = value
		} else {
			break
		}
	}

	return headers, nil
}

func AddPlyCount(headers map[string]string, pgnText string) (string, error) {
	pgnDB := pgn.DB{}
	errs := pgnDB.Parse(pgnText)
	if len(errs) > 0 {
		return pgnText, errors.Wrap(500, "Failed to parse PGN Text", "", errs[0])
	}

	plies := pgnDB.Games[0].Plies()
	return AddHeader(headers, "PlyCount", fmt.Sprintf("%d", plies), pgnText)
}

func AddHeader(headers map[string]string, name, value, pgnText string) (string, error) {
	headerEndIndex := strings.Index(pgnText, "\n\n")
	if headerEndIndex < 0 {
		return pgnText, errors.New(500, "Failed to find PGN header end", "")
	}

	headers[name] = value
	header := fmt.Sprintf("[%s \"%s\"]", name, value)
	newPgn := fmt.Sprintf("%s\n%s\n\n%s", pgnText[:headerEndIndex], header, pgnText[headerEndIndex+2:])
	return newPgn, nil
}

var dateRegex, _ = regexp.Compile(`^\d{4}\.\d{2}\.\d{2}$`)
var dateRegexDash, _ = regexp.Compile(`^\d{4}-\d{2}-\d{2}$`)

func GetGame(user *database.User, pgnText string, headerData *HeaderData, orientation string) (*database.Game, *HeaderData, error) {
	headers, err := GetHeaders(pgnText)
	if err != nil {
		return nil, nil, err
	}

	white, _ := headers["White"]
	if headerData != nil && headerData.White != "" {
		white = headerData.White
		pgnText, err = AddHeader(headers, "White", white, pgnText)
		if err != nil {
			return nil, nil, err
		}
	}

	black, _ := headers["Black"]
	if headerData != nil && headerData.Black != "" {
		black = headerData.Black
		pgnText, err = AddHeader(headers, "Black", black, pgnText)
		if err != nil {
			return nil, nil, err
		}
	}

	date, _ := headers["Date"]
	if headerData != nil && headerData.Date != "" {
		date = headerData.Date
		pgnText, err = AddHeader(headers, "Date", date, pgnText)
		if err != nil {
			return nil, nil, err
		}
	} else if dateRegexDash.MatchString(date) {
		date = strings.ReplaceAll(date, "-", ".")
		headers["Date"] = date
	}

	if white == "" || black == "" || !dateRegex.MatchString(date) {
		return nil, &HeaderData{
			White: white,
			Black: black,
			Date:  date,
		}, nil
	}

	if _, ok := headers["PlyCount"]; !ok {
		pgnText, err = AddPlyCount(headers, pgnText)
		if err != nil {
			// Log this error only as this shouldn't prevent the game from being created
			log.Warn("Failed to add PlyCount header: ", err)
		}
	}

	return &database.Game{
			Cohort:              user.DojoCohort,
			Id:                  date + "_" + uuid.New().String(),
			White:               strings.ToLower(white),
			Black:               strings.ToLower(black),
			Date:                date,
			Owner:               user.Username,
			OwnerDisplayName:    user.DisplayName,
			OwnerPreviousCohort: user.PreviousCohort,
			Headers:             headers,
			IsFeatured:          "false",
			FeaturedAt:          "NOT_FEATURED",
			Pgn:                 pgnText,
			Orientation:         orientation,
		}, &HeaderData{
			White: white,
			Black: black,
			Date:  date,
		}, nil
}

func String(v string) *string {
	return &v
}

func GetGameUpdate(pgnText, orientation string) (*database.GameUpdate, error) {
	headers, err := GetHeaders(pgnText)
	if err != nil {
		return nil, err
	}

	white, ok := headers["White"]
	if !ok {
		return nil, errors.New(400, "Invalid request: PGN missing `White` tag", "")
	}

	black, ok := headers["Black"]
	if !ok {
		return nil, errors.New(400, "Invalid request: PGN missing `Black` tag", "")
	}

	if _, ok := headers["PlyCount"]; !ok {
		pgnText, err = AddPlyCount(headers, pgnText)
		if err != nil {
			// Log this error only as this shouldn't prevent the game from being created
			log.Warn("Failed to add PlyCount header: ", err)
		}
	}

	return &database.GameUpdate{
		White:       String(strings.ToLower(white)),
		Black:       String(strings.ToLower(black)),
		Headers:     headers,
		Pgn:         &pgnText,
		Orientation: &orientation,
	}, nil
}
