package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/access"
)

var repository database.UserUpdater = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}

	var isForbidden bool
	subscriptionStatus := database.SubscriptionStatus_Subscribed
	if !user.SubscriptionOverride && !user.PaymentInfo.IsSubscribed() {
		isForbidden, err = access.IsForbidden(user.WixEmail, 0)
		if isForbidden {
			subscriptionStatus = database.SubscriptionStatus_FreeTier
		}
	}

	if subscriptionStatus != user.SubscriptionStatus {
		// Cache the user's subscription status, that way future reloads of the
		// frontend immediately show the correct version of the site
		_, err := repository.UpdateUser(info.Username, &database.UserUpdate{
			SubscriptionStatus: aws.String(subscriptionStatus),
		})
		if err != nil {
			log.Error("Failed UpdateUser: ", err)
		}

		if user.SubscriptionStatus == database.SubscriptionStatus_Subscribed {
			err = repository.RecordSubscriptionCancelation(user.DojoCohort)
		} else if user.SubscriptionStatus == database.SubscriptionStatus_FreeTier {
			err = repository.RecordFreeTierConversion(user.DojoCohort)
		}
		if err != nil {
			log.Error("Failed to update statistics: ", err)
		}
	}

	if err != nil {
		return api.Failure(err), nil
	}

	return api.Success(nil), nil
}

func main() {
	lambda.Start(Handler)
}
