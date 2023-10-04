package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

type Event events.CloudWatchEvent

type UpdateRequest struct {
	Cohorts []database.DojoCohort `json:"cohorts"`
}

var repository = database.DynamoDB

var weekAgo = time.Now().Add(-time.Hour * 24 * 7).Format(time.RFC3339)
var thirtyDaysAgo = time.Now().Add(-time.Hour * 24 * 30).Format(time.RFC3339)
var sixtyDaysAgo = time.Now().Add(-time.Hour * 24 * 60).Format(time.RFC3339)
var ninetyDaysAgo = time.Now().Add(-time.Hour * 24 * 90).Format(time.RFC3339)
var yearAgo = time.Now().Add(-time.Hour * 24 * 365).Format(time.RFC3339)

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.SetRequestId(event.ID)
	log.Debugf("Event: %#v", event)

	var req UpdateRequest
	err := json.Unmarshal(event.Detail, &req)
	if err != nil {
		log.Errorf("Failed to unmarshal request: %v", err)
		return event, err
	}
	log.Debugf("Request: %+v", req)

	var queuedUpdates []*database.User

	for _, cohort := range req.Cohorts {
		log.Debugf("Processing cohort %s", cohort)

		var users []*database.User
		var startKey = ""
		for ok := true; ok; ok = startKey != "" {
			users, startKey, err = repository.ListUserRatings(cohort, startKey)
			if err != nil {
				log.Errorf("Failed to scan users: %v", err)
				return event, err
			}

			log.Infof("Processing %d users", len(users))
			for _, u := range users {
				shouldUpdate := updateUser(u)
				if shouldUpdate {
					queuedUpdates = append(queuedUpdates, u)
					if len(queuedUpdates) == 25 {
						if err := repository.UpdateUserTimes(queuedUpdates); err != nil {
							log.Error(err)
						} else {
							log.Infof("Updated %d users", len(queuedUpdates))
						}
						queuedUpdates = nil
					}
				}
			}
		}
	}

	if len(queuedUpdates) > 0 {
		if err := repository.UpdateUserTimes(queuedUpdates); err != nil {
			log.Error(err)
		} else {
			log.Infof("Updated %d users", len(queuedUpdates))
		}
	}

	return event, nil
}

func updateUser(user *database.User) bool {
	var timeline []*database.TimelineEntry
	var startKey = ""
	var err error

	if user.SubscriptionStatus == "FREE_TIER" || user.UpdatedAt < sixtyDaysAgo {
		// User won't appear on the scoreboard, so skip updating their data
		// to reduce runtime and DB pressure
		return false
	}

	weekAgoTime := 0
	thirtyDaysAgoTime := 0
	ninetyDaysAgoTime := 0
	yearAgoTime := 0

	for ok := true; ok; ok = startKey != "" {
		timeline, startKey, err = repository.ListTimelineEntries(user.Username, startKey)
		if err != nil {
			log.Errorf("Failed to get user's timeline: %s", user.Username)
			return false
		}

		for _, t := range timeline {
			if t.Cohort != user.DojoCohort || t.RequirementCategory == "Non-Dojo" {
				continue
			}

			date := t.Id[0:10] + "T00:00:00Z"
			if _, err := time.Parse(time.RFC3339, date); err != nil && date < yearAgo {
				goto done
			}

			if t.CreatedAt >= weekAgo {
				weekAgoTime += t.MinutesSpent
			} else if t.CreatedAt >= thirtyDaysAgo {
				thirtyDaysAgoTime += t.MinutesSpent
			} else if t.CreatedAt >= ninetyDaysAgo {
				ninetyDaysAgoTime += t.MinutesSpent
			} else if t.CreatedAt >= yearAgo {
				yearAgoTime += t.MinutesSpent
			}
		}
	}

done:

	thirtyDaysAgoTime += weekAgoTime
	ninetyDaysAgoTime += thirtyDaysAgoTime
	yearAgoTime += ninetyDaysAgoTime

	if len(user.MinutesSpent) == 0 ||
		user.MinutesSpent[database.Last7Days] != weekAgoTime ||
		user.MinutesSpent[database.Last30Days] != thirtyDaysAgoTime ||
		user.MinutesSpent[database.Last90Days] != ninetyDaysAgoTime ||
		user.MinutesSpent[database.Last365Days] != yearAgoTime {

		user.MinutesSpent = map[string]int{
			database.Last7Days:   weekAgoTime,
			database.Last30Days:  thirtyDaysAgoTime,
			database.Last90Days:  ninetyDaysAgoTime,
			database.Last365Days: yearAgoTime,
		}
		return true
	}

	return false
}
