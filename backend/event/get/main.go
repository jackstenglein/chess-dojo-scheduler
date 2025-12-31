package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Infof("Request: %#v", request)

	info := api.GetUserInfo(request)
	if info.Username == "" {
		err := errors.New(403, "Invalid request: not authenticated", "Username from Cognito token was empty")
		return api.Failure(err), nil
	}

	id, ok := request.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err), nil
	}

	event, err := repository.GetEvent(id)
	if err != nil {
		return api.Failure(err), nil
	}

	if event.Type == database.EventType_Dojo {
		return api.Success(&event), nil
	}

	if event.Type == database.EventType_GameReviewTier && event.GameReviewCohortId != "" {
		return getGameReviewEvent(info, event), nil
	}

	if event.Owner == info.Username {
		return api.Success(&event), nil
	}

	p := event.Participants[info.Username]
	if p == nil {
		err = errors.New(403, "Invalid request: user is not a member of this meeting", "")
		return api.Failure(err), nil
	}

	if event.Type == database.EventType_Coaching && !p.HasPaid {
		event.Location = "Location is hidden until payment is complete"
		event.Messages = nil
	}

	return api.Success(&event), nil
}

func getGameReviewEvent(userInfo *api.UserInfo, event *database.Event) api.Response {
	gameReviewCohort, err := repository.GetGameReviewCohort(event.GameReviewCohortId)
	if err != nil {
		return api.Failure(err)
	}

	if gameReviewCohort.PeerReviewEventId == event.Id {
		gameReviewCohort.PeerReviewEvent = *event
		senseiEvent, err := repository.GetEvent(gameReviewCohort.SenseiReviewEventId)
		if err != nil {
			return api.Failure(err)
		}
		gameReviewCohort.SenseiReviewEvent = *senseiEvent
	} else {
		gameReviewCohort.SenseiReviewEvent = *event
		peerEvent, err := repository.GetEvent(gameReviewCohort.PeerReviewEventId)
		if err != nil {
			return api.Failure(err)
		}
		gameReviewCohort.PeerReviewEvent = *peerEvent
	}

	event.GameReviewCohort = gameReviewCohort
	_, ok := event.GameReviewCohort.Members[userInfo.Username]
	isParticipant := ok || event.Owner == userInfo.Username
	if isParticipant {
		return api.Success(&event)
	}

	user, err := repository.GetUser(userInfo.Username)
	if err != nil {
		return api.Failure(err)
	}
	if user.IsAdmin {
		return api.Success(&event)
	}

	err = errors.New(403, "Invalid request: user is not a member of this meeting", "")
	return api.Failure(err)
}
