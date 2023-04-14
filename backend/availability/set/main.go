package main

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
)

const funcName = "availability-set-handler"

var repository database.AvailabilitySetter = database.DynamoDB

func checkAvailabilityTypes(types []database.AvailabilityType) error {
	if len(types) == 0 {
		return errors.New(400, "Invalid request: availability must include at least one type", "")
	}

	for _, t := range types {
		if !database.IsValidAvailabilityType(t) {
			return errors.New(400, fmt.Sprintf("Invalid request: availability type `%s` is invalid", t), "")
		}
	}
	return nil
}

func checkCohorts(cohorts []database.DojoCohort) error {
	if len(cohorts) == 0 {
		return errors.New(400, "Invalid request: availability must include at least one cohort", "")
	}

	for _, c := range cohorts {
		if !database.IsValidCohort(c) {
			return errors.New(400, fmt.Sprintf("Invalid request: cohort `%s` is invalid", c), "")
		}
	}
	return nil
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	info := api.GetUserInfo(event)

	if info.Username == "" {
		err := errors.New(403, "Invalid request: username is required", "")
		return api.Failure(funcName, err), nil
	}

	availability := database.Availability{Status: "SCHEDULED"}
	if err := json.Unmarshal([]byte(event.Body), &availability); err != nil {
		err := errors.Wrap(400, "Invalid request: body format is invalid", "Unable to unmarshal body", err)
		return api.Failure(funcName, err), nil
	}

	if availability.Owner != info.Username {
		err := errors.New(403, "Invalid request: username does not match availability owner", "")
		return api.Failure(funcName, err), nil
	}

	if availability.OwnerDisplayName == "" {
		err := errors.New(400, "Invalid request: ownerDisplayName is required", "")
		return api.Failure(funcName, err), nil
	}

	if availability.MaxParticipants < 1 {
		err := errors.New(400, "Invalid request: maxParticipants must be at least one", "")
		return api.Failure(funcName, err), nil
	}

	if !database.IsValidCohort(availability.OwnerCohort) {
		err := errors.New(400, fmt.Sprintf("Invalid request: ownerCohort `%s` is invalid", availability.OwnerCohort), "")
		return api.Failure(funcName, err), nil
	}

	if _, err := time.Parse(time.RFC3339, availability.StartTime); err != nil {
		err := errors.Wrap(400, "Invalid request: startTime must be RFC3339 format", "", err)
		return api.Failure(funcName, err), nil
	}

	endTime, err := time.Parse(time.RFC3339, availability.EndTime)
	if err != nil {
		err := errors.Wrap(400, "Invalid request: endTime must be RFC3339 format", "", err)
		return api.Failure(funcName, err), nil
	}

	expirationTime := endTime.Add(48 * time.Hour)
	availability.ExpirationTime = expirationTime.Unix()

	if availability.StartTime >= availability.EndTime {
		err := errors.New(400, "Invalid request: startTime must be less than endTime", "")
		return api.Failure(funcName, err), nil
	}

	if err := checkAvailabilityTypes(availability.Types); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := checkCohorts(availability.Cohorts); err != nil {
		return api.Failure(funcName, err), nil
	}

	if availability.Id == "" {
		availability.Id = uuid.New().String()
		if err = repository.RecordAvailabilityCreation(&availability); err != nil {
			log.Error("Failed RecordAvailabilityCreation: ", err)
		}
	}

	if availability.Participants == nil {
		availability.Participants = make([]*database.Participant, 0)
	}

	if strings.TrimSpace(availability.Location) == "" {
		availability.Location = "Discord"
	}

	if err := repository.SetAvailability(&availability); err != nil {
		return api.Failure(funcName, err), nil
	}

	if msgId, err := discord.SendAvailabilityNotification(&availability); err != nil {
		log.Error("Failed SendAvailabilityNotification: ", err)
	} else if availability.DiscordMessageId != msgId {
		// We have to save the availability a second time in order to avoid first
		// sending the Discord notification and then failing to save the availability.
		// If this save fails, we just log the error and return success since it is non-critical.
		availability.DiscordMessageId = msgId
		if err := repository.SetAvailability(&availability); err != nil {
			log.Error("Failed to set availability.DiscordMessageId: ", err)
		}
	}

	return api.Success(funcName, availability), nil
}

func main() {
	lambda.Start(Handler)
}
