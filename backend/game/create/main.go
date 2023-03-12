package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"

	"github.com/malbrecht/chess/pgn"
)

type ImportType string

const (
	Lichess  ImportType = "lichess"
	Chesscom            = "chesscom"
	Manual              = "manual"
)

type CreateGameRequest struct {
	Type    ImportType `json:"type"`
	Url     string     `json:"url"`
	PgnText string     `json:"pgnText"`
}

var repository database.GamePutter = database.DynamoDB

const funcName = "game-create-handler"

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	req := CreateGameRequest{}
	if err := json.Unmarshal([]byte(event.Body), &req); err != nil {
		err = errors.Wrap(400, "Invalid request: body cannot be unmarshaled", "", err)
		return api.Failure(funcName, err), nil
	}

	var pgnText string
	var err error
	if req.Type == Lichess {
		pgnText, err = getLichessPgn(&req)
	} else if req.Type == Manual {
		pgnText = req.PgnText
	} else {
		err = errors.New(400, fmt.Sprintf("Invalid request: type `%s` not supported", req.Type), "")
	}

	if err != nil {
		return api.Failure(funcName, err), nil
	}

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	game, err := saveGame(user, pgnText)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.RecordGameCreation(user); err != nil {
		// Only log this error as this happens on best effort
		log.Error("Failed RecordGameCreation: ", err)
	}

	return api.Success(funcName, game), nil
}

func getLichessPgn(req *CreateGameRequest) (string, error) {
	matched, err := regexp.MatchString("^https://lichess.org/study/.{8}/.{8}$", req.Url)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed regexp.MatchString", err)
		return "", err
	}

	if !matched {
		err = errors.New(400, fmt.Sprintf("Invalid request: url `%s` does not match the lichess study format", req.Url), "")
		return "", err
	}

	resp, err := http.Get(req.Url + ".pgn")
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed http.Get", err)
		return "", err
	}

	if resp.StatusCode != 200 {
		err = errors.New(400, fmt.Sprintf("Invalid request: lichess returned status `%d`", resp.StatusCode), "")
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

func saveGame(user *database.User, pgnText string) (*database.Game, error) {
	headers, err := getHeaders(pgnText)
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

	if _, ok := headers["PlyCount"]; !ok {
		pgnText, err = addPlyCount(headers, pgnText)
		if err != nil {
			// Log this error only as this shouldn't prevent the game from being created
			log.Warn("Failed to add PlyCount header: ", err)
		}
	}

	game := database.Game{
		Cohort:              user.DojoCohort,
		Id:                  date + "_" + uuid.New().String(),
		White:               white,
		Black:               black,
		Date:                date,
		Owner:               user.Username,
		OwnerDiscord:        user.DiscordUsername,
		OwnerPreviousCohort: user.PreviousCohort,
		Headers:             headers,
		IsFeatured:          "false",
		FeaturedAt:          "NOT_FEATURED",
		Pgn:                 pgnText,
	}

	if err := repository.PutGame(&game); err != nil {
		return nil, err
	}

	return &game, nil
}

func getHeaders(pgnText string) (map[string]string, error) {
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

func addPlyCount(headers map[string]string, pgnText string) (string, error) {
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

func main() {
	lambda.Start(Handler)
}
