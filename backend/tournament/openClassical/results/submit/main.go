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

var repository = database.DynamoDB

type SubmitResultsRequest struct {
	Email           string `json:"email"`
	Region          string `json:"region"`
	Section         string `json:"section"`
	Round           int    `json:"-"`
	GameUrl         string `json:"gameUrl"`
	White           string `json:"white"`
	Black           string `json:"black"`
	Result          string `json:"result"`
	ReportOppponent bool   `json:"reportOpponent"`
	Notes           string `json:"notes"`
	Verified        bool   `json:"-"`
}

type LichessGameResponse struct {
	Status  string `json:"status"`
	Winner  string `json:"winner"`
	Players struct {
		White struct {
			Username string `json:"userId"`
		} `json:"white"`
		Black struct {
			Username string `json:"userId"`
		} `json:"black"`
	} `json:"players"`
}

type ChesscomGameResponse struct {
	Game struct {
		PgnHeaders struct {
			White  string `json:"white"`
			Black  string `json:"black"`
			Result string `json:"result"`
		} `json:"pgnHeaders"`
	} `json:"game"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)

	request := &SubmitResultsRequest{Verified: false}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)
		return api.Failure(err), nil
	}
	if info.Email != "" {
		request.Email = info.Email
	}

	if err := getGameUrl(request); err != nil {
		return api.Failure(err), nil
	}

	if err := checkRequest(request); err != nil {
		return api.Failure(err), nil
	}

	openClassical, err := repository.GetOpenClassical(database.CurrentLeaderboard)
	if err != nil {
		return api.Failure(err), nil
	}

	update, err := getPairingUpdate(openClassical, request)
	if err != nil {
		return api.Failure(err), nil
	}

	openClassical, err = repository.UpdateOpenClassicalResult(update)
	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(openClassical), nil
}

func checkRequest(request *SubmitResultsRequest) error {
	if strings.TrimSpace(request.Email) == "" {
		return errors.New(400, "Invalid request: email is required", "")
	}
	if strings.TrimSpace(request.Region) == "" {
		return errors.New(400, "Invalid request: region is required", "")
	}
	if strings.TrimSpace(request.Section) == "" {
		return errors.New(400, "Invalid request: section is required", "")
	}
	if strings.TrimSpace(request.White) == "" {
		return errors.New(400, "Invalid request: white is required", "")
	}
	if strings.TrimSpace(request.Black) == "" {
		return errors.New(400, "Invalid request: black is required", "")
	}
	if strings.TrimSpace(request.Result) == "" {
		return errors.New(400, "Invalid request: result is required", "")
	}
	return nil
}

// Returns the pairing update for the given open classical and result request.
func getPairingUpdate(openClassical *database.OpenClassical, request *SubmitResultsRequest) (*database.OpenClassicalPairingUpdate, error) {
	section, ok := openClassical.Sections[fmt.Sprintf("%s_%s", request.Region, request.Section)]
	if !ok {
		return nil, errors.New(400, fmt.Sprintf("Invalid request: region/section combo `%s/%s` does not exist", request.Region, request.Section), "")
	}
	white := strings.ToLower(request.White)
	black := strings.ToLower(request.Black)

	roundIdx := len(section.Rounds) - 1
	request.Round = roundIdx + 1

	round := section.Rounds[roundIdx]
	for idx, pairing := range round.Pairings {
		if strings.ToLower(pairing.White.LichessUsername) == white && strings.ToLower(pairing.Black.LichessUsername) == black {
			return &database.OpenClassicalPairingUpdate{
				Region:       request.Region,
				Section:      request.Section,
				Round:        roundIdx,
				PairingIndex: idx,
				Pairing: &database.OpenClassicalPairing{
					White:          pairing.White,
					Black:          pairing.Black,
					Result:         request.Result,
					GameUrl:        request.GameUrl,
					Verified:       request.Verified,
					ReportOpponent: request.ReportOppponent,
					Notes:          request.Notes,
				},
			}, nil
		}
	}
	return nil, errors.New(400, fmt.Sprintf("Invalid request: round %d does not contain a pairing for %s (white) vs %s (black)", roundIdx+1, request.White, request.Black), "")
}

func getGameUrl(request *SubmitResultsRequest) error {
	if request.GameUrl == "" {
		return nil
	}

	if strings.HasPrefix(request.GameUrl, "https://lichess.org/") {
		return getLichessGame(request)
	}

	if strings.HasPrefix(request.GameUrl, "https://www.chess.com/") {
		return getChesscomGame(request)
	}

	return nil
}

func getLichessGame(request *SubmitResultsRequest) error {
	gameId := strings.TrimPrefix(request.GameUrl, "https://lichess.org/")
	gameId, _, _ = strings.Cut(gameId, "/")
	if gameId == "" {
		return nil
	}
	gameId, _, _ = strings.Cut(gameId, "#")
	if gameId == "" {
		return nil
	}

	log.Debugf("Fetching Lichess game with ID %q\n", gameId)
	resp, err := http.Get(fmt.Sprintf("https://lichess.org/api/game/%s", gameId))
	if err != nil {
		log.Errorf("Failed to get Lichess game: %v", err)
		return nil
	}
	if resp.StatusCode != 200 {
		log.Errorf("Lichess game returned status %d", resp.StatusCode)
		return nil
	}

	var game LichessGameResponse
	if err = json.NewDecoder(resp.Body).Decode(&game); err != nil {
		log.Errorf("Failed to unmarshal Lichess response: %v", err)
		return nil
	}

	if request.White != "" && !strings.EqualFold(request.White, game.Players.White.Username) {
		return errors.New(400, fmt.Sprintf("Invalid request: provided game has white %q but form specified white %q", game.Players.White.Username, request.White), "")
	}
	if request.Black != "" && !strings.EqualFold(request.Black, game.Players.Black.Username) {
		return errors.New(400, fmt.Sprintf("Invalid request: provided game has black %q but form specified black %q", game.Players.Black.Username, request.Black), "")
	}

	request.White = game.Players.White.Username
	request.Black = game.Players.Black.Username
	if game.Winner == "white" {
		if request.Result != "" && request.Result != "1-0" {
			return errors.New(400, fmt.Sprintf("Invalid request: provided game has result %q but form specified result %q", "1-0", request.Result), "")
		}
		request.Result = "1-0"
	} else if game.Winner == "black" {
		if request.Result != "" && request.Result != "0-1" {
			return errors.New(400, fmt.Sprintf("Invalid request: provided game has result %q but form specified result %q", "0-1", request.Result), "")
		}
		request.Result = "0-1"
	} else {
		if request.Result != "" && request.Result != "1/2-1/2" {
			return errors.New(400, fmt.Sprintf("Invalid request: provided game has result %q but form specified result %q", "1/2-1/2", request.Result), "")
		}
		request.Result = "1/2-1/2"
	}
	request.Verified = true
	return nil
}

func getChesscomGame(request *SubmitResultsRequest) error {
	gameId := strings.TrimPrefix(request.GameUrl, "https://www.chess.com/game/live/")
	gameId = strings.TrimPrefix(gameId, "https://www.chess.com/live/game/")
	if gameId == "" {
		return nil
	}

	log.Debugf("Fetching Chesscom game with ID %q\n", gameId)
	resp, err := http.Get(fmt.Sprintf("https://www.chess.com/callback/live/game/%s", gameId))
	if err != nil {
		log.Errorf("Failed to get Chesscom game: %v", err)
		return nil
	}
	if resp.StatusCode != 200 {
		log.Errorf("Chesscom game returned status %d", resp.StatusCode)
		return nil
	}

	var game ChesscomGameResponse
	if err = json.NewDecoder(resp.Body).Decode(&game); err != nil {
		log.Errorf("Failed to unmarshal Chesscom response: %v", err)
		return nil
	}

	if request.Result != "" && request.Result != game.Game.PgnHeaders.Result {
		return errors.New(400, fmt.Sprintf("Invalid request: provided game has result %q but form specified result %q", game.Game.PgnHeaders.Result, request.Result), "")
	}

	request.Result = game.Game.PgnHeaders.Result
	request.Verified = true
	return nil
}
