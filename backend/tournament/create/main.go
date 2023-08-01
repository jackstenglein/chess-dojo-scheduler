package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

type CreateTournamentsRequest struct {
	Url string `json:"url"`
}

type LichessArenaResponse struct {
	Id            string `json:"id"`
	StartsAt      string `json:"startsAt"`
	Name          string `json:"fullName"`
	LengthMinutes int    `json:"minutes"`
	Clock         struct {
		Limit     int `json:"limit"`
		Increment int `json:"increment"`
	} `json:"clock"`
	Rated       bool   `json:"rated"`
	Description string `json:"description"`
	Position    struct {
		Name string `json:"name"`
		Fen  string `json:"fen"`
	} `json:"position"`
}

const funcName = "tournament-create-handler"
const lichessArenaPrefix = "https://lichess.org/tournament/"
const lichessSwissPrefix = "https://lichess.org/swiss/"

var repository = database.DynamoDB

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	req := CreateTournamentsRequest{}
	err := json.Unmarshal([]byte(request.Body), &req)
	if err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	var tournament *database.Tournament
	if strings.HasPrefix(req.Url, lichessArenaPrefix) {
		tournament, err = handleArena(req.Url)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
	} else if strings.HasPrefix(req.Url, lichessSwissPrefix) {

	} else {
		return api.Failure(funcName, errors.New(400, "Invalid request: unknown URL format", "")), nil
	}

	if err := repository.SetTournament(tournament); err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, tournament), nil
}

func handleArena(url string) (*database.Tournament, error) {
	id := strings.TrimPrefix(url, lichessArenaPrefix)
	if id == "" {
		return nil, errors.New(400, "Invalid request: Lichess arena id must not be empty", "")
	}

	resp, err := http.Get(fmt.Sprintf("https://lichess.org/api/tournament/%s", id))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to fetch Lichess arena", err)
		return nil, err
	}

	if resp.StatusCode == 404 {
		return nil, errors.New(404, fmt.Sprintf("Invalid request: Lichess arena `%s` not found", id), "")
	}
	if resp.StatusCode != 200 {
		return nil, errors.New(500, "Temporary server error", fmt.Sprintf("Lichess returned non 200 for arena `%s`", id))
	}

	var arena LichessArenaResponse
	if err := json.NewDecoder(resp.Body).Decode(&arena); err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to unmarshal Lichess response", err)
		return nil, err
	}

	tournament := &database.Tournament{
		Type:             database.TournamentType_Arena,
		StartsAt:         arena.StartsAt,
		Id:               arena.Id,
		Name:             arena.Name,
		Description:      arena.Description,
		Rated:            arena.Rated,
		LimitSeconds:     arena.Clock.Limit,
		IncrementSeconds: arena.Clock.Increment,
		Fen:              arena.Position.Fen,
		Url:              url,
		LengthMinutes:    arena.LengthMinutes,
	}
	return tournament, nil
}
