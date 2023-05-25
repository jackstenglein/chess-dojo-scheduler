package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
)

const funcName = "user-access-handler"

var wixApiKey = os.Getenv("wixApiKey")

type ChessDojoClubResponse struct {
	User *struct {
		Id string `json:"_id"`
	} `json:"user"`

	Subscriptions []*struct {
		Id string `json:"_id"`
	} `json:"subscriptions"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	var email string
	if jwt, ok := event.RequestContext.Authorizer["jwt"]; ok {
		if jwtMap, ok := jwt.(map[string]interface{}); ok {
			if claims, ok := jwtMap["claims"]; ok {
				if claimsMap, ok := claims.(map[string]interface{}); ok {
					email, ok = claimsMap["email"].(string)
				}
			}
		}
	}

	if email == "" {
		err := errors.New(403, "Not Authorized: no email present", "")
		return api.Failure(funcName, err), nil
	}

	req, err := http.NewRequest("GET", fmt.Sprintf("https://chessdojo.club/_functions/user/%s", email), nil)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to create request to chessdojo.club", err)
		return api.Failure(funcName, err), nil
	}
	req.Header.Set("Auth", wixApiKey)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to send request to chessdojo.club", err)
		return api.Failure(funcName, err), nil
	}

	if res.StatusCode == 404 {
		err := errors.New(403, fmt.Sprintf("Not Authorized: email `%s` not found on https://chessdojo.club", email), "")
		return api.Failure(funcName, err), nil
	}
	if res.StatusCode != 200 {
		err := errors.New(403, fmt.Sprintf("Not Authorized: https://chessdojo.club returned status `%d` for email `%s`", res.StatusCode, email), "")
		return api.Failure(funcName, err), nil
	}

	var body ChessDojoClubResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		err = errors.Wrap(500, "Temporary server error", "Failed to read ChessDojoClub response", err)
		return api.Failure(funcName, err), nil
	}

	if len(body.Subscriptions) == 0 {
		err := errors.New(403, fmt.Sprintf("Not Authorized: no active subscriptions found on https://chessdojo.club for email `%s`", email), "")
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, nil), nil
}

func main() {
	lambda.Start(Handler)
}
