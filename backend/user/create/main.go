package main

import (
	"context"
	"errors"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/access"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CognitoEventUserPoolsPostConfirmation

var repository database.UserCreator = database.DynamoDB

const triggerSource = "PostConfirmation_ConfirmSignUp"

func handleError(event Event, err error) (Event, error) {
	log.Error(err)
	return event, err
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)

	if event.TriggerSource != triggerSource {
		log.Debugf("Invalid trigger source: %s\n", event.TriggerSource)
		return event, nil
	}

	email, _ := event.Request.UserAttributes["email"]
	if email == "" {
		return handleError(event, errors.New("Invalid request: email field is required"))
	}

	cognitoUsername := event.UserName
	if cognitoUsername == "" {
		return handleError(event, errors.New("Invalid request: cognitoUsername field is required"))
	}

	name, _ := event.Request.UserAttributes["name"]
	if name == "" {
		return handleError(event, errors.New("Invalid request: name field is required"))
	}

	subscriptionStatus := database.SubscriptionStatus_Subscribed
	if isForbidden, _ := access.IsForbidden(email); isForbidden {
		subscriptionStatus = database.SubscriptionStatus_FreeTier
	}

	_, err := repository.CreateUser(cognitoUsername, email, name, subscriptionStatus)
	if err != nil {
		return handleError(event, err)
	}
	return event, nil
}

func main() {
	lambda.Start(Handler)
}
