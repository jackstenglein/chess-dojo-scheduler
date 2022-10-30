package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.AvailabilityBooker = database.DynamoDB

const funcName = "availability-book-handler"

// checkRequest verifies that all required fields of the provided Meeting are present
// and in the proper format.
func checkRequest(request *database.Meeting) error {
	if request.Owner == "" {
		return errors.New(400, "Invalid request: owner is required", "")
	}

	if request.Id == "" {
		return errors.New(400, "Invalid request: id is required", "")
	}

	if request.StartTime == "" {
		return errors.New(400, "Invalid request: startTime is required", "")
	}

	_, err := time.Parse(time.RFC3339, request.StartTime)
	if err != nil {
		return errors.Wrap(400, "Invalid request: startTime must be RFC3339 format", "", err)
	}

	if request.Type == "" {
		return errors.New(400, "Invalid request: type is required", "")
	}

	return nil
}

// checkTimes verifies that the provided startTime and endTime are contained within the provided Availability.
func checkTimes(availability *database.Availability, startTime string) error {
	if startTime < availability.StartTime {
		return errors.New(400, "Invalid request: startTime must be greater than or equal to availability.startTime", "")
	}

	if startTime > availability.EndTime {
		return errors.New(400, "Invalid request: startTime must be less than or equal to availability.endTime", "")
	}

	return nil
}

// checkType verifies that the provided meeting type is offered by the provided Availability.
func checkType(availability *database.Availability, t database.AvailabilityType) error {
	for _, t2 := range availability.Types {
		if t == t2 {
			return nil
		}
	}
	return errors.New(400, fmt.Sprintf("Invalid request: type `%s` is not offered by this availability", t), "")
}

// checkCohort verifies that the provided class is offered by the provided Availability.
func checkCohort(availability *database.Availability, cohort database.DojoCohort) error {
	for _, c := range availability.Cohorts {
		if c == cohort {
			return nil
		}
	}
	return errors.New(400, fmt.Sprintf("Invalid request: cohort `%s` is not allowed to book this availability", cohort), "")
}

// Handler implements the BookAvailability endpoint.
func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	request := database.Meeting{Participant: info.Username}
	if err := json.Unmarshal([]byte(event.Body), &request); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
		return api.Failure(funcName, err), nil
	}

	if err := checkRequest(&request); err != nil {
		return api.Failure(funcName, err), nil
	}

	if info.Username == request.Owner {
		err := errors.New(400, "Invalid request: you cannot book your own availability", "")
		return api.Failure(funcName, err), nil
	}

	availability, err := repository.GetAvailability(request.Owner, request.Id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	participant, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err = checkTimes(availability, request.StartTime); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err = checkType(availability, request.Type); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err = checkCohort(availability, participant.DojoCohort); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.BookAvailability(availability, &request); err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, request), nil
}

func main() {
	lambda.Start(Handler)
}
