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

func GetLichessPgn(url string) (string, error) {
	matched, err := regexp.MatchString("^https://lichess.org/study/.{8}/.{8}$", url)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed regexp.MatchString", err)
		return "", err
	}

	if !matched {
		err = errors.New(400, fmt.Sprintf("Invalid request: url `%s` does not match the lichess study format", url), "")
		return "", err
	}

	resp, err := http.Get(url + ".pgn")
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed http.Get", err)
		return "", err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: lichess returned status `%d`. The study must be public.", resp.StatusCode), "")
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
	headers["PlyCount"] = fmt.Sprintf("%d", plies)

	headerEndIndex := strings.Index(pgnText, "\n\n")
	if headerEndIndex < 0 {
		return pgnText, errors.New(500, "Failed to find PGN header end", "")
	}

	plyCountHeader := fmt.Sprintf("[PlyCount \"%d\"]", plies)
	newPgn := fmt.Sprintf("%s\n%s\n\n%s", pgnText[:headerEndIndex], plyCountHeader, pgnText[headerEndIndex+2:])
	return newPgn, nil
}

var dateRegex, _ = regexp.Compile(`^\d{4}\.\d{2}\.\d{2}$`)

func GetGame(user *database.User, pgnText string) (*database.Game, error) {
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

	date, ok := headers["Date"]
	if !ok {
		return nil, errors.New(400, "Invalid request: PGN missing `Date` tag", "")
	}

	if !dateRegex.MatchString(date) {
		return nil, errors.New(400, "Invalid request: PGN `Date` tag must be in YYYY.MM.DD format", "")
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
		White:               white,
		Black:               black,
		Date:                date,
		Owner:               user.Username,
		OwnerDisplayName:    user.DisplayName,
		OwnerPreviousCohort: user.PreviousCohort,
		Headers:             headers,
		IsFeatured:          "false",
		FeaturedAt:          "NOT_FEATURED",
		Pgn:                 pgnText,
	}, nil
}

func GetGameUpdate(pgnText string) (*database.GameUpdate, error) {
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
		White:   &white,
		Black:   &black,
		Headers: headers,
		Pgn:     &pgnText,
	}, nil
}
