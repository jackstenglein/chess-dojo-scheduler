package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const lichessArenaPrefix = "https://lichess.org/tournament/"
const lichessSwissPrefix = "https://lichess.org/swiss/"

var repository = database.DynamoDB
var botAccessToken = os.Getenv("botAccessToken")

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
	Perf struct {
		Key string `json:"key"`
	} `json:"perf"`
}

func (a LichessArenaResponse) ToEvent() (*database.Event, error) {
	startTime, err := time.Parse(time.RFC3339, a.StartsAt)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to parse Lichess StartsAt time", err)
		return nil, err
	}
	endTime := startTime.Add(time.Duration(a.LengthMinutes) * time.Minute)
	expirationTime := endTime.Add(6 * 7 * 24 * time.Hour)

	event := &database.Event{
		Id:               a.Id,
		Type:             database.EventType_LigaTournament,
		Owner:            "Sensei",
		OwnerDisplayName: "Sensei",
		Title:            a.Name,
		StartTime:        a.StartsAt,
		EndTime:          endTime.Format(time.RFC3339),
		ExpirationTime:   expirationTime.Unix(),
		Status:           database.SchedulingStatus_Scheduled,
		Location:         fmt.Sprintf("%s%s", lichessArenaPrefix, a.Id),
		Description:      a.Description,
		LigaTournament: &database.LigaTournament{
			Type:             database.TournamentType_Arena,
			Id:               a.Id,
			Rated:            a.Rated,
			TimeControlType:  database.TimeControlType(strings.ToUpper(a.Perf.Key)),
			LimitSeconds:     a.Clock.Limit,
			IncrementSeconds: a.Clock.Increment,
			Fen:              a.Position.Fen,
		},
	}
	return event, nil
}

type LichessSwissResponse struct {
	Id       string `json:"id"`
	StartsAt string `json:"startsAt"`
	Name     string `json:"name"`
	Clock    struct {
		Limit     int `json:"limit"`
		Increment int `json:"increment"`
	} `json:"clock"`
	NumRounds   int    `json:"nbRounds"`
	Rated       bool   `json:"rated"`
	Description string `json:"description"`
	Position    struct {
		Name string `json:"name"`
		Fen  string `json:"fen"`
	} `json:"position"`
}

func (s LichessSwissResponse) TimeControlType() (database.TimeControlType, error) {
	if s.Clock.Limit == 900 && s.Clock.Increment == 5 {
		return database.TimeControlType_Rapid, nil
	}
	if s.Clock.Limit == 300 && s.Clock.Increment == 3 {
		return database.TimeControlType_Blitz, nil
	}
	if s.Clock.Limit == 5400 && s.Clock.Increment == 30 {
		return database.TimeControlType_Classical, nil
	}
	if s.Clock.Limit == 3600 && s.Clock.Increment == 30 {
		return database.TimeControlType_Classical, nil
	}
	if s.Clock.Limit == 2700 && s.Clock.Increment == 30 {
		return database.TimeControlType_Classical, nil
	}
	if s.Clock.Limit == 180 && s.Clock.Increment == 2 {
		return database.TimeControlType_Blitz, nil
	}
	if s.Clock.Limit == 180 && s.Clock.Increment == 0 {
		return database.TimeControlType_Blitz, nil
	}

	return "", errors.New(400, fmt.Sprintf("Invalid time control %d+%d", s.Clock.Limit, s.Clock.Increment), "")
}

func (s LichessSwissResponse) ToEvent(round int) (*database.Event, error) {
	timeControl, err := s.TimeControlType()
	if err != nil {
		return nil, err
	}

	startTime, err := time.Parse(time.RFC3339, s.StartsAt)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to parse Lichess StartsAt time", err)
		return nil, err
	}

	startTime = startTime.Add(time.Duration(round) * 7 * 24 * time.Hour)
	endTime := startTime.Add(60 * time.Minute)
	expirationTime := endTime.Add(6 * 7 * 24 * time.Hour)

	event := &database.Event{
		Id:               fmt.Sprintf("%s-round-%d", s.Id, round+1),
		Type:             database.EventType_LigaTournament,
		Owner:            "Sensei",
		OwnerDisplayName: "Sensei",
		Title:            s.Name,
		StartTime:        startTime.Format(time.RFC3339),
		EndTime:          endTime.Format(time.RFC3339),
		ExpirationTime:   expirationTime.Unix(),
		Status:           database.SchedulingStatus_Scheduled,
		Location:         fmt.Sprintf("%s%s", lichessSwissPrefix, s.Id),
		Description:      s.Description,
		LigaTournament: &database.LigaTournament{
			Type:             database.TournamentType_Swiss,
			Id:               s.Id,
			Rated:            s.Rated,
			TimeControlType:  timeControl,
			LimitSeconds:     s.Clock.Limit,
			IncrementSeconds: s.Clock.Increment,
			Fen:              s.Position.Fen,
		},
	}
	return event, nil
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Infof("Request: %#v", request)

	auth, _ := request.Headers["authorization"]
	if auth != fmt.Sprintf("Basic %s", botAccessToken) {
		err := errors.New(401, "Authorization header is invalid", "")
		return api.Failure(err), nil
	}

	req := CreateTournamentsRequest{}
	err := json.Unmarshal([]byte(request.Body), &req)
	if err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	var events []*database.Event
	if strings.HasPrefix(req.Url, lichessArenaPrefix) {
		event, err := handleArena(req.Url)
		if err != nil {
			return api.Failure(err), nil
		}
		events = append(events, event)
	} else if strings.HasPrefix(req.Url, lichessSwissPrefix) {
		e, err := handleSwiss(req.Url)
		if err != nil {
			return api.Failure(err), nil
		}
		events = append(events, e...)
	} else {
		return api.Failure(errors.New(400, "Invalid request: unknown URL format", "")), nil
	}

	for _, event := range events {
		if err := repository.SetEvent(event); err != nil {
			return api.Failure(err), nil
		}
	}
	return api.Success(events), nil
}

func handleArena(url string) (*database.Event, error) {
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

	return arena.ToEvent()
}

func handleSwiss(url string) ([]*database.Event, error) {
	id := strings.TrimPrefix(url, lichessSwissPrefix)
	if id == "" {
		return nil, errors.New(400, "Invalid request: Lichess swiss id must not be empty", "")
	}

	resp, err := http.Get(fmt.Sprintf("https://lichess.org/api/swiss/%s", id))
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to fetch Lichess swiss tournament", err)
		return nil, err
	}

	if resp.StatusCode == 404 {
		return nil, errors.New(404, fmt.Sprintf("Invalid request: Lichess swiss `%s` not found", id), "")
	}
	if resp.StatusCode != 200 {
		return nil, errors.New(500, "Temporary server error", fmt.Sprintf("Lichess returned non 200 for swiss `%s`", id))
	}

	var swiss LichessSwissResponse
	if err := json.NewDecoder(resp.Body).Decode(&swiss); err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to unmarshal Lichess response", err)
		return nil, err
	}

	var result []*database.Event
	isMonthly := strings.Index(swiss.Name, "Monthly") >= 0
	i := 0

	for ok := true; ok; ok = isMonthly && i < swiss.NumRounds {
		event, err := swiss.ToEvent(i)
		if err != nil {
			return nil, err
		}
		result = append(result, event)
		i++
	}
	return result, nil
}
