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

const funcName = "event-set-handler"

var repository database.EventSetter = database.DynamoDB

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

func checkTimes(event *database.Event) error {
	if event.StartTime >= event.EndTime {
		return errors.New(400, "Invalid request: startTime must be less than endTime", "")
	}

	if _, err := time.Parse(time.RFC3339, event.StartTime); err != nil {
		return errors.Wrap(400, "Invalid request: startTime must be RFC3339 format", "", err)
	}

	endTime, err := time.Parse(time.RFC3339, event.EndTime)
	if err != nil {
		return errors.Wrap(400, "Invalid request: endTime must be RFC3339 format", "", err)
	}

	expirationTime := endTime.Add(48 * time.Hour)
	event.ExpirationTime = expirationTime.Unix()
	return nil
}

func handleAvailability(info *api.UserInfo, event *database.Event) (api.Response, error) {
	if event.Owner != info.Username {
		err := errors.New(403, "Invalid request: username does not match availability owner", "")
		return api.Failure(funcName, err), nil
	}

	if event.Status != database.Scheduled {
		err := errors.New(400, fmt.Sprintf("Invalid request: event status must be set to `%s`", database.Scheduled), "")
		return api.Failure(funcName, err), nil
	}

	if event.OwnerDisplayName == "" {
		err := errors.New(400, "Invalid request: ownerDisplayName is required", "")
		return api.Failure(funcName, err), nil
	}

	if event.MaxParticipants < 1 {
		err := errors.New(400, "Invalid request: maxParticipants must be at least one", "")
		return api.Failure(funcName, err), nil
	}

	if !database.IsValidCohort(event.OwnerCohort) {
		err := errors.New(400, fmt.Sprintf("Invalid request: ownerCohort `%s` is invalid", event.OwnerCohort), "")
		return api.Failure(funcName, err), nil
	}

	if err := checkTimes(event); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := checkAvailabilityTypes(event.Types); err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := checkCohorts(event.Cohorts); err != nil {
		return api.Failure(funcName, err), nil
	}

	if event.Id == "" {
		event.Id = uuid.New().String()
		// TODO: add this back in
		// if err = repository.RecordAvailabilityCreation(&availability); err != nil {
		// 	log.Error("Failed RecordAvailabilityCreation: ", err)
		// }
	}

	if strings.TrimSpace(event.Location) == "" {
		event.Location = "Discord"
	}

	if err := repository.SetEvent(event); err != nil {
		return api.Failure(funcName, err), nil
	}

	if msgId, err := discord.SendAvailabilityNotification(event); err != nil {
		log.Error("Failed SendAvailabilityNotification: ", err)
	} else if event.DiscordMessageId != msgId {
		// We have to save the event a second time in order to avoid first
		// sending the Discord notification and then failing to save the event.
		// If this save fails, we just log the error and return success since it is non-critical.
		event.DiscordMessageId = msgId
		if err := repository.SetEvent(event); err != nil {
			log.Error("Failed to set event.DiscordMessageId: ", err)
		}
	}

	return api.Success(funcName, event), nil
}

func handleDojoEvent(info *api.UserInfo, event *database.Event) (api.Response, error) {
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	if !user.IsAdmin {
		err := errors.New(403, "You do not have permission to create Dojo events", "")
		return api.Failure(funcName, err), nil
	}

	if event.Title == "" {
		err := errors.New(400, "Invalid request: title is required", "")
		return api.Failure(funcName, err), nil
	}

	if event.Status != database.Scheduled {
		err := errors.New(400, fmt.Sprintf("Invalid request: event status must be set to `%s`", database.Scheduled), "")
		return api.Failure(funcName, err), nil
	}

	if err := checkTimes(event); err != nil {
		return api.Failure(funcName, err), nil
	}

	if event.Id == "" {
		event.Id = uuid.New().String()
		// TODO: add this back in
		// if err = repository.RecordAvailabilityCreation(&availability); err != nil {
		// 	log.Error("Failed RecordAvailabilityCreation: ", err)
		// }
	}

	event.Owner = database.EventTypeDojoOwner
	event.OwnerDisplayName = database.EventTypeDojoOwner
	event.OwnerCohort = ""
	event.OwnerPreviousCohort = ""
	event.BookedStartTime = ""
	event.Types = nil
	event.BookedType = ""
	event.Cohorts = nil
	event.MaxParticipants = 0
	event.DiscordMessageId = ""

	if strings.TrimSpace(event.Location) == "" {
		event.Location = "No Location Provided"
	}

	if err := repository.SetEvent(event); err != nil {
		return api.Failure(funcName, err), nil
	}

	if privateEventId, publicEventId, err := discord.SetEvent(event); err != nil {
		log.Error("Failed SendAvailabilityNotification: ", err)
	} else if event.PrivateDiscordEventId != privateEventId || event.PublicDiscordEventId != publicEventId {
		// We have to save the event a second time in order to avoid first
		// pushing the Discord event and then failing to save the event in our database.
		// If this save fails, we just log the error and return success since it is non-critical.
		event.PrivateDiscordEventId, event.PublicDiscordEventId = privateEventId, publicEventId
		if err := repository.SetEvent(event); err != nil {
			log.Error("Failed to set event.DiscordEventIds: ", err)
		}
	}

	return api.Success(funcName, event), nil
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	info := api.GetUserInfo(request)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: username is required", "")
		return api.Failure(funcName, err), nil
	}

	event := &database.Event{}
	if err := json.Unmarshal([]byte(request.Body), event); err != nil {
		err := errors.Wrap(400, "Invalid request: body format is invalid", "Unable to unmarshal body", err)
		return api.Failure(funcName, err), nil
	}

	if event.Participants == nil {
		event.Participants = make([]*database.Participant, 0)
	}

	if event.Type == database.EventTypeAvailability {
		return handleAvailability(info, event)
	} else if event.Type == database.EventTypeDojo {
		return handleDojoEvent(info, event)
	}

	err := errors.New(400, fmt.Sprintf("Invalid request: event type `%s` is not supported", event.Type), "")
	return api.Failure(funcName, err), nil
}

func main() {
	lambda.Start(Handler)
}
