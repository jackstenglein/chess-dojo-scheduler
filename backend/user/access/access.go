package access

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
)

var wixApiKey = os.Getenv("wixApiKey")

type AccessResponse struct {
	User *struct {
		Id string `json:"_id"`
	} `json:"user"`

	Subscriptions []*struct {
		Id string `json:"_id"`
	} `json:"subscriptions"`
}

func IsForbidden(email string, timeout time.Duration) (bool, error) {
	if email == "" {
		return true, errors.New(403, "Not Authorized: no email present", "")
	}

	var req *http.Request
	var err error

	if timeout > 0 {
		ctx, cncl := context.WithTimeout(context.Background(), timeout)
		defer cncl()
		req, err = http.NewRequestWithContext(ctx, "GET", fmt.Sprintf("https://chessdojo.shop/_functions/user/%s", email), nil)
	} else {
		req, err = http.NewRequest("GET", fmt.Sprintf("https://chessdojo.shop/_functions/user/%s", email), nil)
	}

	if err != nil {
		return false, errors.Wrap(500, "Temporary server error", "Failed to create request to chessdojo.shop", err)
	}
	req.Header.Set("Auth", wixApiKey)

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return false, errors.Wrap(500, "Temporary server error", "Failed to send request to chessdojo.shop", err)
	}

	if res.StatusCode >= 500 {
		body, _ := io.ReadAll(res.Body)
		defer res.Body.Close()
		log.Errorf("Failed to check auth for email `%s`. chessdojo.shop returned status `%d`: %v", email, res.StatusCode, string(body))
		return false, nil
	}
	if res.StatusCode == 404 {
		return true, errors.New(403, fmt.Sprintf("Not Authorized: email `%s` not found on https://chessdojo.shop", email), "")
	}
	if res.StatusCode != 200 {
		return true, errors.New(403, fmt.Sprintf("Not Authorized: https://chessdojo.shop returned status `%d` for email `%s`", res.StatusCode, email), "")
	}

	var body AccessResponse
	if err := json.NewDecoder(res.Body).Decode(&body); err != nil {
		return false, errors.Wrap(500, "Temporary server error", "Failed to read ChessDojoClub response", err)
	}

	if len(body.Subscriptions) == 0 {
		return true, errors.New(403, fmt.Sprintf("Not Authorized: no active subscriptions found on https://chessdojo.shop for email `%s`", email), "")
	}

	return false, nil
}
