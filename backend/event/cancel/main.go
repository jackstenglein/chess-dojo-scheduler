package main

import (
	"context"
	"fmt"
	"os"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
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

	if event.Type != database.EventTypeAvailability {
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
		url := fmt.Sprintf("%s/group/%s", frontendHost, newEvent.Id)
		msg += fmt.Sprintf(withParticipantsSuffix, len(newEvent.Participants), url)
	}

	if err := discord.SendCancellationNotification(newEvent.Owner, msg); err != nil {
		log.Error("Failed SendCancellationNotification: ", err)
	}
}
