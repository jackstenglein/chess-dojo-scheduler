package main

import (
	"context"
	"errors"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CognitoEventUserPoolsPostConfirmation

var repository = database.DynamoDB

const triggerSource = "PostConfirmation_ConfirmSignUp"

func handleError(event Event, err error) (Event, error) {
	log.Error(err)
	return event, err
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)

	if event.TriggerSource != triggerSource {
		log.Debugf("Invalid trigger source: ", event.TriggerSource)
		return event, nil
	}

	email, ok := event.Request.UserAttributes["email"]
	if !ok {
		return handleError(event, errors.New("Invalid request: email field is required"))
	}

	cognitoUsername := event.UserName
	if cognitoUsername == "" {
		return handleError(event, errors.New("Invalid request: cognitoUsername field is required"))
	}

	name, ok := event.Request.UserAttributes["name"]
	if !ok {
		return handleError(event, errors.New("Invalid request: name field is required"))
	}

	_, err := repository.CreateUser(cognitoUsername, email, name)
	if err != nil {
		return handleError(event, err)
	}
	return event, nil
}

func main() {
	lambda.Start(Handler)
}
