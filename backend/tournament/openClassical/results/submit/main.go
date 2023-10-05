package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"google.golang.org/api/option"
	"google.golang.org/api/sheets/v4"
)

const funcName = "open-classical-submit-results-handler"

var media = database.S3
var stage = os.Getenv("stage")

const (
	sheetId    = "1P04-l4B0LeasPzCOgnVT_3NRbClEIwCwPmVyPz-OtWo"
	sheetRange = "Results"
)

type SubmitResultsRequest struct {
	Email           string `json:"email"`
	Section         string `json:"section"`
	Round           string `json:"round"`
	GameUrl         string `json:"gameUrl"`
	White           string `json:"white"`
	Black           string `json:"black"`
	Result          string `json:"result"`
	ReportOppponent bool   `json:"reportOpponent"`
	Notes           string `json:"notes"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	request := &SubmitResultsRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)
		return api.Failure(funcName, err), nil
	}
	if info.Email != "" {
		request.Email = info.Email
	}

	if err := checkRequest(request); err != nil {
		return api.Failure(funcName, err), nil
	}

	client, err := getSheetsClient(ctx)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	call := getAppendCall(ctx, client, request)
	_, err = call.Do()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to write to sheet", err)
		return api.Failure(funcName, err), nil
	}

	if err := os.Remove("/tmp/openClassicalServiceAccountKey.json"); err != nil {
		log.Errorf("Failed to rmeove JSON file: %v", err)
	}

	return api.Success(funcName, nil), nil
}

func checkRequest(request *SubmitResultsRequest) error {
	if strings.TrimSpace(request.Email) == "" {
		return errors.New(400, "Invalid request: email is required", "")
	}
	if strings.TrimSpace(request.Section) == "" {
		return errors.New(400, "Invalid request: section is required", "")
	}
	if strings.TrimSpace(request.Round) == "" {
		return errors.New(400, "Invalid request: round is required", "")
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

// Gets a client for Google Sheets.
func getSheetsClient(ctx context.Context) (*sheets.Service, error) {
	f, err := os.Create("/tmp/openClassicalServiceAccountKey.json")
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create file for service account key", err)
	}

	if err = media.Download(fmt.Sprintf("chess-dojo-%s-secrets", stage), "openClassicalServiceAccountKey.json", f); err != nil {
		return nil, err
	}
	if err = f.Close(); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to close file for service account key", err)
	}

	client, err := sheets.NewService(ctx, option.WithCredentialsFile("/tmp/openClassicalServiceAccountKey.json"))
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create Sheets client", err)
	}
	return client, nil
}

// Returns the SpreadsheetValuesAppendCall that will append the values in the SubmitResultsRequest
// to the spreadsheet.
func getAppendCall(ctx context.Context, client *sheets.Service, req *SubmitResultsRequest) *sheets.SpreadsheetsValuesAppendCall {
	valueRange := &sheets.ValueRange{
		MajorDimension: "ROWS",
		Values: [][]interface{}{
			{
				time.Now().Format(time.RFC3339),
				req.Email,
				req.Section,
				req.Round,
				req.GameUrl,
				req.White,
				req.Black,
				req.Result,
				req.ReportOppponent,
				req.Notes,
			},
		},
	}
	return client.Spreadsheets.Values.Append(sheetId, sheetRange, valueRange).ValueInputOption("USER_ENTERED").Context(ctx)
}
