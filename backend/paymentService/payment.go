package payment

import (
	"fmt"
	"os"
	"strings"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService/secrets"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/account"
	"github.com/stripe/stripe-go/v76/accountlink"
	bpsession "github.com/stripe/stripe-go/v76/billingportal/session"
	"github.com/stripe/stripe-go/v76/checkout/session"
	"github.com/stripe/stripe-go/v76/loginlink"
)

var frontendHost = os.Getenv("frontendHost")
var monthlyPriceId = os.Getenv("monthlyPriceId")
var yearlyPriceId = os.Getenv("yearlyPriceId")

func init() {
	key, err := secrets.GetApiKey()
	if err != nil {
		log.Error("Failed to get Stripe key: ", err)
		return
	}
	stripe.Key = key
}

func PurchaseCourseUrl(user *database.User, course *database.Course, purchaseOption database.CoursePurchaseOption, cancelUrl string) (string, error) {
	price := purchaseOption.FullPrice
	if purchaseOption.CurrentPrice > 0 {
		price = purchaseOption.CurrentPrice
	}

	courseIds := course.Id
	if len(purchaseOption.CourseIds) > 0 {
		courseIds = strings.Join(purchaseOption.CourseIds, ",")
	}

	courseUrl := fmt.Sprintf("%s/courses/%s/%s", frontendHost, course.Type, course.Id)

	if cancelUrl == "" {
		cancelUrl = courseUrl
	}

	params := &stripe.CheckoutSessionParams{
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				PriceData: &stripe.CheckoutSessionLineItemPriceDataParams{
					Currency:   stripe.String("usd"),
					UnitAmount: stripe.Int64(int64(price)),
					ProductData: &stripe.CheckoutSessionLineItemPriceDataProductDataParams{
						Name:        stripe.String(purchaseOption.Name),
						Description: stripe.String(course.Description),
					},
				},
				Quantity: stripe.Int64(1),
			},
		},
		Mode:                stripe.String(string(stripe.CheckoutSessionModePayment)),
		SuccessURL:          stripe.String(fmt.Sprintf("%s?checkout={CHECKOUT_SESSION_ID}", courseUrl)),
		CancelURL:           stripe.String(cancelUrl),
		AllowPromotionCodes: stripe.Bool(true),
		Metadata: map[string]string{
			"type":      "COURSE",
			"courseIds": courseIds,
		},
	}

	if user != nil {
		params.ClientReferenceID = stripe.String(user.Username)
		if user.PaymentInfo.GetCustomerId() != "" {
			params.Customer = stripe.String(user.PaymentInfo.GetCustomerId())
		}
	}

	checkoutSession, err := session.New(params)
	if err != nil {
		return "", errors.Wrap(500, "Temporary server error", "Failed to create Stripe checkout session", err)
	}

	return checkoutSession.URL, nil
}

type PurchaseSubscriptionRequest struct {
	Interval   string `json:"interval"`
	SuccessUrl string `json:"successUrl"`
	CancelUrl  string `json:"cancelUrl"`
}

func PurchaseSubscriptionUrl(user *database.User, request *PurchaseSubscriptionRequest) (string, error) {
	var priceId string

	if user == nil {
		return "", errors.New(400, "Invalid request: user is not authenticated", "")
	}

	if request.Interval == string(stripe.PriceRecurringIntervalMonth) {
		priceId = monthlyPriceId
	} else if request.Interval == string(stripe.PriceRecurringIntervalYear) {
		priceId = yearlyPriceId
	} else {
		return "", errors.New(400, fmt.Sprintf("Invalid request: interval must be either `%s` or `%s`", stripe.PriceRecurringIntervalMonth, stripe.PriceRecurringIntervalYear), "")
	}

	successUrl := request.SuccessUrl
	if successUrl == "" {
		successUrl = frontendHost
	}

	cancelUrl := request.CancelUrl
	if cancelUrl == "" {
		cancelUrl = frontendHost
	}

	params := &stripe.CheckoutSessionParams{
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceId),
				Quantity: stripe.Int64(1),
			},
		},
		Mode:                stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		SuccessURL:          stripe.String(successUrl),
		CancelURL:           stripe.String(cancelUrl),
		ClientReferenceID:   stripe.String(user.Username),
		AllowPromotionCodes: stripe.Bool(true),
		Metadata: map[string]string{
			"type": "SUBSCRIPTION",
		},
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			TrialSettings: &stripe.CheckoutSessionSubscriptionDataTrialSettingsParams{
				EndBehavior: &stripe.CheckoutSessionSubscriptionDataTrialSettingsEndBehaviorParams{
					MissingPaymentMethod: stripe.String(string(stripe.SubscriptionTrialSettingsEndBehaviorMissingPaymentMethodCancel)),
				},
			},
			Metadata: map[string]string{
				"username": user.Username,
			},
		},
	}

	if user.PaymentInfo.GetCustomerId() != "" {
		params.Customer = stripe.String(user.PaymentInfo.GetCustomerId())
	}

	checkoutSession, err := session.New(params)
	if err != nil {
		return "", errors.Wrap(500, "Temporary server error", "Failed to create Stripe checkout session", err)
	}
	return checkoutSession.URL, nil
}

func GetCheckoutSession(id string) (*stripe.CheckoutSession, error) {
	session, err := session.Get(id, nil)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to get Stripe checkout session", err)
	}
	return session, nil
}

func GetBillingPortalSession(customerId string) (*stripe.BillingPortalSession, error) {
	params := &stripe.BillingPortalSessionParams{
		Customer:  stripe.String(customerId),
		ReturnURL: stripe.String(fmt.Sprintf("%s/profile/edit", frontendHost)),
	}
	session, err := bpsession.New(params)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create Stripe Billing Portal session", err)
	}
	return session, nil
}

func CreateConnectedAccount(username, email string) (*stripe.Account, error) {
	params := &stripe.AccountParams{
		Type:         stripe.String(string(stripe.AccountTypeExpress)),
		BusinessType: stripe.String(string(stripe.AccountBusinessTypeIndividual)),
		BusinessProfile: &stripe.AccountBusinessProfileParams{
			ProductDescription: stripe.String("Chess courses and coaching"),
		},
		Capabilities: &stripe.AccountCapabilitiesParams{
			Transfers: &stripe.AccountCapabilitiesTransfersParams{
				Requested: stripe.Bool(true),
			},
			TaxReportingUS1099K: &stripe.AccountCapabilitiesTaxReportingUS1099KParams{
				Requested: stripe.Bool(true),
			},
		},
		Email: stripe.String(email),
		Metadata: map[string]string{
			"username": username,
		},
	}
	account, err := account.New(params)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create Stripe account", err)
	}
	return account, nil
}

func GetConnectedAccount(stripeId string) (*stripe.Account, error) {
	account, err := account.GetByID(stripeId, nil)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to get Stripe account", err)
	}
	return account, nil
}

func AccountLink(id string) (*stripe.AccountLink, error) {
	params := &stripe.AccountLinkParams{
		Account:    stripe.String(id),
		RefreshURL: stripe.String(frontendHost + "/coach/stripe-refresh"),
		ReturnURL:  stripe.String(frontendHost + "/coach/stripe-return"),
		Type:       stripe.String(string(stripe.AccountLinkTypeAccountOnboarding)),
	}
	accountLink, err := accountlink.New(params)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create Stripe AccountLink", err)
	}
	return accountLink, nil
}

func LoginLink(stripeId string) (*stripe.LoginLink, error) {
	params := &stripe.LoginLinkParams{
		Account: stripe.String(stripeId),
	}
	link, err := loginlink.New(params)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to create Stripe LoginLink", err)
	}
	return link, nil
}
