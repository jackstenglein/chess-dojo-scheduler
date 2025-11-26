package main

import (
	"context"
	"os"
	"slices"

	"github.com/aws/aws-lambda-go/lambda"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB
var stage = os.Getenv("stage")

type ListEventsResponse struct {
	Events           []*database.Event `json:"events"`
	LastEvaluatedKey string            `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	if stage == "prod" {
		log.SetLevel(log.InfoLevel)
	}
	lambda.Start(Handler)
}

func Handler(ctx context.Context, request api.Request) (api.Response, error) {
	log.SetRequestId(request.RequestContext.RequestID)
	log.Infof("Request: %#v", request)

	info := api.GetUserInfo(request)
	var user *database.User
	var err error
	if info.Username != "" {
		user, err = repository.GetUser(info.Username)
		if err != nil {
			log.Errorf("Failed to get user: %v", err)
		}
	}

	startKey := request.QueryStringParameters["startKey"]
	events, lastKey, err := repository.ScanEvents(info.Username == "", startKey)
	if err != nil {
		return api.Failure(err), nil
	}

	finalEvents := make([]*database.Event, 0, len(events))
	for _, e := range events {
		if shouldRemoveEvent(e, user) {
			continue
		}
		if shouldHideEventDetails(e, user) {
			e.Location = ""
			e.Messages = nil
		}
		finalEvents = append(finalEvents, e)
	}

	return api.Success(&ListEventsResponse{
		Events:           finalEvents,
		LastEvaluatedKey: lastKey,
	}), nil
}

// Returns true if the event should be removed from the list for the given user.
func shouldRemoveEvent(event *database.Event, user *database.User) bool {
	if user.GetIsCalendarAdmin() {
		return false
	}

	if event.Owner == user.GetUsername() {
		return false
	}

	switch event.Type {
	case database.EventType_Availability:
		return shouldRemoveAvailability(event, user)
	case database.EventType_Dojo:
		return shouldRemoveDojo(event, user)
	case database.EventType_Coaching:
		return shouldRemoveCoaching(event, user)
	}

	return false
}

// Returns true if the event of type Availability should be removed from the list
// for the given user.
func shouldRemoveAvailability(event *database.Event, user *database.User) bool {
	if _, ok := event.Participants[user.GetUsername()]; ok {
		return false
	}

	if event.Status != database.SchedulingStatus_Scheduled {
		return true
	}

	if slices.ContainsFunc(
		event.Invited,
		func(p database.Participant) bool {
			return p.Username == user.GetUsername()
		}) {
		return false
	} else if event.InviteOnly {
		return true
	}

	if len(event.Cohorts) > 0 && !slices.Contains(event.Cohorts, user.GetCohort()) {
		return true
	}

	return false
}

// Returns true if the event of type Dojo should be removed from the list for
// the given user.
func shouldRemoveDojo(event *database.Event, user *database.User) bool {
	if len(event.Cohorts) > 0 && !slices.Contains(event.Cohorts, user.GetCohort()) {
		return true
	}
	return false
}

// Returns true if the event of type Coaching should be removed from the list
// for the given user.
func shouldRemoveCoaching(event *database.Event, user *database.User) bool {
	if _, ok := event.Participants[user.GetUsername()]; ok {
		return false
	}

	if len(event.Cohorts) > 0 && !slices.Contains(event.Cohorts, user.GetCohort()) {
		return true
	}
	if !event.Coaching.BookableByFreeUsers && user.GetSubscriptionStatus() != database.SubscriptionStatus_Subscribed {
		return true
	}
	if event.Status != database.SchedulingStatus_Scheduled {
		return true
	}

	return false
}

// Returns true if the event details (location, messages, etc) should be hidden.
func shouldHideEventDetails(event *database.Event, user *database.User) bool {
	if user.GetIsCalendarAdmin() {
		return false
	}

	username := user.GetUsername()
	if event.Owner == username {
		return false
	}

	isGameReviewTier := user.GetSubscriptionTier() == database.SubscriptionTier_GameReview && user.GetSubscriptionStatus() == database.SubscriptionStatus_Subscribed
	isLectureTier := isGameReviewTier || (user.GetSubscriptionTier() == database.SubscriptionTier_Lecture && user.GetSubscriptionStatus() == database.SubscriptionStatus_Subscribed)

	p := event.Participants[username]
	switch event.Type {
	case database.EventType_Coaching:
		return p == nil || !p.HasPaid

	case database.EventType_GameReviewTier:
		return !isGameReviewTier && (p == nil || !p.HasPaid)

	case database.EventType_LectureTier:
		return !isLectureTier && (p == nil || !p.HasPaid)

	default:
		return false
	}
}
