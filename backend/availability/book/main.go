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
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
)

var repository database.AvailabilityBooker = database.DynamoDB

const funcName = "availability-book-handler"

// checkTimes verifies that the provided startTime and endTime are contained within the provided Availability.
func checkTimes(availability *database.Availability, startTime string) error {
	if startTime == "" {
		return errors.New(400, "Invalid request: startTime is required", "")
	}

	_, err := time.Parse(time.RFC3339, startTime)
	if err != nil {
		return errors.Wrap(400, "Invalid request: startTime must be RFC3339 format", "", err)
	}

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
	if t == "" {
		return errors.New(400, "Invalid request: type is required", "")
	}
	for _, t2 := range availability.Types {
		if t == t2 {
			return nil
		}
	}
	return errors.New(400, fmt.Sprintf("Invalid request: type `%s` is not offered by this availability", t), "")
}

// checkCohort verifies that the provided cohort is bookable by the provided Availability.
func checkCohort(availability *database.Availability, cohort database.DojoCohort) error {
	for _, c := range availability.Cohorts {
		if c == cohort {
			return nil
		}
	}
	return errors.New(400, fmt.Sprintf("Invalid request: cohort `%s` is not allowed to book this availability", cohort), "")
}

// handleGroupBooking handles booking an Availability that allows multiple people to book.
func handleGroupBooking(info *api.UserInfo, availability *database.Availability) (api.Response, error) {
	participant, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err = checkCohort(availability, participant.DojoCohort); err != nil {
		return api.Failure(funcName, err), nil
	}

	a, err := repository.BookGroupAvailability(availability, participant)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, a), nil
}

// handleSoloBooking handles booking an Availability that allows only one person to book.
func handleSoloBooking(info *api.UserInfo, meeting *database.Meeting, availability *database.Availability) (api.Response, error) {
	if err := checkTimes(availability, meeting.StartTime); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := checkType(availability, meeting.Type); err != nil {
		return api.Failure(funcName, err), nil
	}

	participant, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err = checkCohort(availability, participant.DojoCohort); err != nil {
		return api.Failure(funcName, err), nil
	}

	startTime, err := time.Parse(time.RFC3339, meeting.StartTime)
	meeting.ExpirationTime = startTime.Add(48 * time.Hour).Unix()
	meeting.Location = availability.Location
	meeting.Description = availability.Description
	meeting.Participant = info.Username
	meeting.Status = database.Scheduled

	if err := repository.BookAvailability(availability, meeting); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.RecordMeetingCreation(meeting, availability.OwnerCohort, participant.DojoCohort); err != nil {
		log.Error("Failed RecordMeetingCreation: ", err)
	}

	if err := discord.SendBookingNotification(meeting.Owner, meeting.Id); err != nil {
		log.Error("Failed SendBookingNotification: ", err)
	}

	return api.Success(funcName, meeting), nil
}

// Handler implements the BookAvailability endpoint.
func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	meeting := database.Meeting{}
	if err := json.Unmarshal([]byte(event.Body), &meeting); err != nil {
		err = errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
		return api.Failure(funcName, err), nil
	}

	if meeting.Owner == "" {
		err := errors.New(400, "Invalid request: owner is required", "")
		return api.Failure(funcName, err), nil
	}

	if meeting.Id == "" {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err), nil
	}

	if info.Username == meeting.Owner {
		err := errors.New(400, "Invalid request: you cannot book your own availability", "")
		return api.Failure(funcName, err), nil
	}

	availability, err := repository.GetAvailability(meeting.Owner, meeting.Id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if availability.MaxParticipants > 1 {
		return handleGroupBooking(info, availability)
	}

	return handleSoloBooking(info, &meeting, availability)

}

func main() {
	lambda.Start(Handler)
}
