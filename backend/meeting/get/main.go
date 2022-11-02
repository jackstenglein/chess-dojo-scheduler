package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.MeetingGetter = database.DynamoDB

const funcName = "meeting-get-handler"

// GetMeetingResponse encodes the response from a GetMeeting request.
type GetMeetingResponse struct {
	// The requested Meeting.
	Meeting *database.Meeting `json:"meeting"`

	// The other user participating in this Meeting.
	Opponent *database.User `json:"opponent"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(funcName, err), nil
	}

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(funcName, err), nil
	}

	meeting, err := repository.GetMeeting(id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	var opponentUsername string
	if info.Username == meeting.Owner {
		opponentUsername = meeting.Participant
	} else if info.Username == meeting.Participant {
		opponentUsername = meeting.Owner
	} else {
		err := errors.New(403, "Invalid request: user is not a member of this meeting", "")
		return api.Failure(funcName, err), nil
	}

	opponent, err := repository.GetUser(opponentUsername)
	return api.Success(funcName, &GetMeetingResponse{
		Meeting:  meeting,
		Opponent: opponent,
	}), nil
}

func main() {
	lambda.Start(Handler)
}
