// Handles sending events to Meta Conversions API.
package meta

import (
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	stripe "github.com/stripe/stripe-go/v81"
)

var pixelId = os.Getenv("metaPixelId")
var accessToken = os.Getenv("metaAccessToken")
var frontendHost = os.Getenv("frontendHost")

type baseEvent struct {
	EventName      string `json:"event_name"`
	EventTime      int    `json:"event_time"`
	ActionSource   string `json:"action_source"`
	EventSourceUrl string `json:"event_source_url"`
}

type userData struct {
	UserAgent string `json:"client_user_agent"`
	Email     string `json:"em,omitempty"`
	IpAddress string `json:"client_ip_address,omitempty"`
}

type purchaseCustomData struct {
	Currency string  `json:"currency"`
	Value    float32 `json:"value"`
}

type purchaseEventRequest struct {
	baseEvent
	UserData   userData           `json:"user_data"`
	CustomData purchaseCustomData `json:"custom_data"`
}

type metaRequest struct {
	Data []any `json:"data"`
}

// Emits a Purchase event to the Meta Conversions API for the given CheckoutSession.
func PurchaseEvent(checkoutSession *stripe.CheckoutSession) error {
	url := fmt.Sprintf("https://graph.facebook.com/v21.0/%s/events?access_token=%s", pixelId, accessToken)
	email := fmt.Sprintf("%x", sha256.Sum256([]byte(checkoutSession.CustomerDetails.Email)))
	request := metaRequest{
		Data: []any{
			purchaseEventRequest{
				baseEvent: baseEvent{
					EventName:      "Purchase",
					EventTime:      int(time.Now().Unix()),
					ActionSource:   "website",
					EventSourceUrl: frontendHost,
				},
				UserData: userData{
					UserAgent: checkoutSession.Metadata["userAgent"],
					Email:     email,
					IpAddress: checkoutSession.Metadata["ipAddress"],
				},
				CustomData: purchaseCustomData{
					Currency: "usd",
					Value:    float32(checkoutSession.AmountTotal) / 100,
				},
			},
		},
	}

	body, err := json.Marshal(&request)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return err
	}

	log.Infof("Got response from Meta events: %v", resp)
	return nil
}
