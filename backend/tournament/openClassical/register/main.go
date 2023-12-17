package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"google.golang.org/api/option"
	sheets "google.golang.org/api/sheets/v4"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/ratings"
)

var media = database.S3
var stage = os.Getenv("stage")

const (
	maxByeLength = 7
	sheetId      = "1P04-l4B0LeasPzCOgnVT_3NRbClEIwCwPmVyPz-OtWo"
)

var validTitles = []string{
	"",
	"GM",
	"WGM",
	"IM",
	"WIM",
	"FM",
	"WFM",
	"CM",
	"WCM",
}

type RegisterRequest struct {
	Email           string `json:"email"`
	LichessUsername string `json:"lichessUsername"`
	LichessRating   int    `json:"-"`
	DiscordUsername string `json:"discordUsername"`
	Title           string `json:"title"`
	Region          string `json:"region"`
	Section         string `json:"section"`
	ByeRequests     []bool `json:"byeRequests"`
}

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	request := &RegisterRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)
		return api.Failure(err), nil
	}
	if info.Email != "" {
		request.Email = info.Email
	}

	if err := checkRequest(request); err != nil {
		return api.Failure(err), nil
	}

	client, err := getSheetsClient(ctx)
	if err != nil {
		return api.Failure(err), nil
	}

	call := getAppendCall(ctx, client, request)
	_, err = call.Do()
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to write to sheet", err)
		return api.Failure(err), nil
	}

	if err := os.Remove("/tmp/openClassicalServiceAccountKey.json"); err != nil {
		log.Errorf("Failed to rmeove JSON file: %v", err)
	}

	return api.Success(nil), nil
}

// Returns an error if the request is invalid.
func checkRequest(req *RegisterRequest) error {
	if strings.TrimSpace(req.Email) == "" {
		return errors.New(400, "Invalid request: email is required", "")
	}
	if strings.TrimSpace(req.LichessUsername) == "" {
		return errors.New(400, "Invalid request: lichessUsername is required", "")
	}
	if strings.TrimSpace(req.DiscordUsername) == "" {
		return errors.New(400, "Invalid request: discordUsername is required", "")
	}
	if req.Region != "A" && req.Region != "B" {
		return errors.New(400, fmt.Sprintf("Invalid request: region `%s` is not supported", req.Region), "")
	}
	if req.Section != "Open" && req.Section != "U1800" {
		return errors.New(400, fmt.Sprintf("Invalid request: section `%s` is not supported", req.Section), "")
	}
	if len(req.ByeRequests) > maxByeLength {
		return errors.New(400, "Invalid request: byeRequests has too many items", "")
	}

	found := false
	for _, t := range validTitles {
		if t == req.Title {
			found = true
			break
		}
	}
	if !found {
		errors.New(400, "Invalid request: title is not in list of valid titles", "")
	}

	rating, err := ratings.FetchLichessRating(req.LichessUsername)
	req.LichessRating = rating
	return err
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

// Returns the SpreadsheetValuesAppendCall that will append the values in the RegisterRequest
// to the spreadsheet.
func getAppendCall(ctx context.Context, client *sheets.Service, req *RegisterRequest) *sheets.SpreadsheetsValuesAppendCall {
	byeRounds := make([]string, 0)
	for i, v := range req.ByeRequests {
		if v {
			byeRounds = append(byeRounds, fmt.Sprintf("%d", i+1))
		}
	}

	byeRequests := ""
	if len(byeRounds) > 0 {
		byeRequests = fmt.Sprintf("Bye requests for rounds %s", strings.Join(byeRounds, ", "))
	}

	valueRange := &sheets.ValueRange{
		MajorDimension: "ROWS",
		Values: [][]interface{}{
			{
				time.Now().Format(time.RFC3339), // submission_date
				"=ROW()-1",                      // number
				req.Title,                       // title
				fmt.Sprintf("lichess:%s,discord:%s", req.LichessUsername, req.DiscordUsername), // name
				req.LichessRating, // rating
				"",                // club
				"",                // birthdate
				"",                // sex
				"",                // federation
				"",                // fide_id
				"",                // local_id
				req.LichessRating, // rating_classic
				"",                //rating_rapid
				"",                //rating_blitz
				"",                //rating_local
				"",                //labels
				req.Email,         // contact_email
				"",                // contact_phone
				"",                // signedin
				"ACCEPTED",        // status
				"",                // payments
				byeRequests,       // notes_admin
				"",                // notes_public
			},
		},
	}
	sheetRange := fmt.Sprintf("%s_%s_Registrations", req.Region, req.Section)
	return client.Spreadsheets.Values.Append(sheetId, sheetRange, valueRange).ValueInputOption("USER_ENTERED").Context(ctx)
}
