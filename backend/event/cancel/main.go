package main

import (
	"context"
	"fmt"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

var repository database.EventLeaver = database.DynamoDB
var frontendHost = os.Getenv("frontendHost")

const funcName = "event-leave-handler"

const newOwnerPrefix = "Hello, the owner of your upcoming meeting has canceled, and you have been made the new owner of the meeting. "
const noParticipantsSuffix = "The meeting currently has no other participants but is available for others to book. You can edit the meeting from the [Calendar](%s)."
const sameOwnerPrefix = "Hello, a member of your upcoming meeting has canceled. "
const withParticipantsSuffix = "There are still %d participants in the meeting. View it [here](%s)."

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Debugf("Request: %#v", request)

	info := api.GetUserInfo(request)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(funcName, err), nil
	}

	id, ok := request.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err), nil
	}

	event, err := repository.GetEvent(id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if event.Type == database.EventType_Coaching {
		if info.Username == event.Owner {
			return cancelCoachingSession(event), nil
		}
		return leaveCoachingSession(info.Username, event), nil
	}

	if event.Type != database.EventType_Availability {
		err := errors.New(400, "Invalid request: this event type is not supported", "")
		return api.Failure(funcName, err), nil
	}

	if len(event.Participants) == 0 {
		err := errors.New(400, "Invalid request: nobody has booked this availability. Delete it instead", "")
		return api.Failure(funcName, err), nil
	}

	participant := event.Participants[info.Username]
	if event.Owner != info.Username && participant == nil {
		err := errors.New(403, "Invalid request: user is not a participant in this meeting", "")
		return api.Failure(funcName, err), nil
	}

	newEvent, err := repository.LeaveEvent(event, participant)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if err := repository.RecordEventCancelation(event); err != nil {
		log.Error("Failed RecordEventCancelation: ", err)
	}

	if msgId, err := discord.SendAvailabilityNotification(newEvent); err != nil {
		log.Error("Failed SendAvailabilityNotification: ", err)
	} else if newEvent.DiscordMessageId != msgId {
		// We have to save the event a second time in order to avoid first
		// sending the Discord notification and then failing to save the event.
		// If this save fails, we just log the error and return success since it is non-critical.
		newEvent.DiscordMessageId = msgId
		if err := repository.SetEvent(newEvent); err != nil {
			log.Error("Failed to set event.DiscordMessageId: ", err)
		}
	}

	sendNotification(event, newEvent)
	return api.Success(funcName, newEvent), nil
}

// handles a coach canceling a session that has been booked. Any users who have paid are issued
// a full refund.
func cancelCoachingSession(event *database.Event) api.Response {
	newEvent, err := repository.CancelEvent(event)
	if err != nil {
		return api.Failure(funcName, err)
	}

	for _, p := range newEvent.Participants {
		_, err := payment.CreateEventRefund(event, p, 100)
		if err != nil {
			log.Errorf("Failed to create refund: %v", err)
		}
	}

	return api.Success(funcName, newEvent)
}

// handles a user leaving a coaching session that they have booked. The user may need a refund
// depending on whether they have already paid and how far in advance they are canceling.
func leaveCoachingSession(username string, event *database.Event) api.Response {
	participant := event.Participants[username]
	if participant == nil {
		err := errors.New(403, "Invalid request: user is not a participant in this meeting", "")
		return api.Failure(funcName, err)
	}

	now := time.Now()
	eventStart, err := time.Parse(time.RFC3339, event.StartTime)
	if err != nil {
		err = errors.Wrap(400, "Invalid request: event does not have a valid start time", "time.Parse failure", err)
		return api.Failure(funcName, err)
	}
	cancelationTime := eventStart.Add(-23 * time.Hour).Add(-55 * time.Minute)

	var newEvent *database.Event

	if !participant.HasPaid || now.After(cancelationTime) {
		newEvent, err = repository.LeaveEvent(event, participant)
	} else {
		_, err = payment.CreateEventRefund(event, participant, 100)
		if err != nil {
			return api.Failure(funcName, err)
		}
		newEvent, err = repository.LeaveEvent(event, participant)
	}

	if err != nil {
		return api.Failure(funcName, err)
	}

	sendNotification(event, newEvent)
	return api.Success(funcName, newEvent)
}

func sendNotification(event, newEvent *database.Event) {
	var msg string

	if newEvent.Owner != event.Owner {
		msg = newOwnerPrefix
	} else {
		msg = sameOwnerPrefix
	}

	if len(newEvent.Participants) == 0 {
		url := fmt.Sprintf("%s/calendar", frontendHost)
		msg += fmt.Sprintf(noParticipantsSuffix, url)
	} else {
		url := fmt.Sprintf("%s/meeting/%s", frontendHost, newEvent.Id)
		msg += fmt.Sprintf(withParticipantsSuffix, len(newEvent.Participants), url)
	}

	if err := discord.SendCancellationNotification(newEvent.Owner, msg); err != nil {
		log.Error("Failed SendCancellationNotification: ", err)
	}
}
