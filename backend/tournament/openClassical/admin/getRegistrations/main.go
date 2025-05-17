package main

import (
	"context"
	"encoding/csv"
	"fmt"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	region := event.QueryStringParameters["region"]
	sectionName := event.QueryStringParameters["section"]
	if region == "" || sectionName == "" {
		err := errors.New(400, "Invalid request: region and section are required", "")
		return api.Failure(err), nil
	}

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(err), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}
	if !user.IsAdmin && !user.IsTournamentAdmin {
		err := errors.New(403, "Invalid request: you are not a tournament admin", "")
		return api.Failure(err), nil
	}

	openClassical, err := repository.GetOpenClassical(database.CurrentLeaderboard)
	if err != nil {
		return api.Failure(err), nil
	}

	section, ok := openClassical.Sections[fmt.Sprintf("%s_%s", region, sectionName)]
	if !ok {
		err := errors.New(400, fmt.Sprintf("Invalid request: region %s and section %s does not exist", region, sectionName), "")
		return api.Failure(err), nil
	}

	var sb strings.Builder
	writer := csv.NewWriter(&sb)
	writer.Write([]string{
		"number", "title", "name", "rating", "club", "birthdate", "sex", "federation", "fide_id", "local_id",
		"rating_classic", "rating_rapid", "rating_blitz", "rating_local", "labels", "contact_email", "contact_phone",
		"signedin", "status", "payments", "notes_admin", "notes_public",
	})

	count := 1
	for _, player := range section.Players {
		byeRounds := make([]string, 0)
		for i, v := range player.ByeRequests {
			if v {
				byeRounds = append(byeRounds, fmt.Sprintf("%d", i+1))
			}
		}

		byeRequests := ""
		if len(byeRounds) > 0 {
			byeRequests = fmt.Sprintf("Bye requests for rounds %s", strings.Join(byeRounds, ", "))
		}

		writer.Write([]string{
			fmt.Sprintf("%d", count),
			player.Title,
			fmt.Sprintf("username:%s,lichess:%s,discord:%s", player.Username, player.LichessUsername, player.DiscordUsername),
			fmt.Sprintf("%d", player.Rating),
			"",                               // club
			"",                               // birthdate
			"",                               // sex
			"",                               // federation
			"",                               // fide_id
			"",                               // local_id
			fmt.Sprintf("%d", player.Rating), // rating_classic
			"",                               //rating_rapid
			"",                               //rating_blitz
			"",                               //rating_local
			"",                               //labels
			player.Email,                     // contact_email
			"",                               // contact_phone
			"",                               // signedin
			"ACCEPTED",                       // status
			"",                               // payments
			byeRequests,                      // notes_admin
			"",                               // notes_public
		})
		count++
	}
	writer.Flush()

	return api.Response{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            sb.String(),
		Headers: map[string]string{
			"Content-Type":                "text/csv",
			"Access-Control-Allow-Origin": "*",
		},
	}, nil
}
