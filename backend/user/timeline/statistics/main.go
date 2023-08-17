package main

import (
	"context"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

type Event events.CloudWatchEvent

var repository = database.DynamoDB

var weekAgo = time.Now().Add(-time.Hour * 24 * 7).Format(time.RFC3339)
var thirtyDaysAgo = time.Now().Add(-time.Hour * 24 * 30).Format(time.RFC3339)
var ninetyDaysAgo = time.Now().Add(-time.Hour * 24 * 90).Format(time.RFC3339)
var yearAgo = time.Now().Add(-time.Hour * 24 * 365).Format(time.RFC3339)

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.SetRequestId(event.ID)
	log.Debugf("Event: %#v", event)

	var err error
	var queuedUpdates []*database.User

	for _, cohort := range database.Cohorts {
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

			if t.CreatedAt >= weekAgo {
				weekAgoTime += t.MinutesSpent
			} else if t.CreatedAt >= thirtyDaysAgo {
				thirtyDaysAgoTime += t.MinutesSpent
			} else if t.CreatedAt >= ninetyDaysAgo {
				ninetyDaysAgoTime += t.MinutesSpent
			} else if t.CreatedAt >= yearAgo {
				yearAgoTime += t.MinutesSpent
			} else {
				goto done
			}
		}
	}

done:

	thirtyDaysAgoTime += weekAgoTime
	ninetyDaysAgoTime += thirtyDaysAgoTime
	yearAgoTime += ninetyDaysAgoTime

	if len(user.MinutesSpent) == 0 ||
		user.MinutesSpent["LAST_7_DAYS"] != weekAgoTime ||
		user.MinutesSpent["LAST_30_DAYS"] != thirtyDaysAgoTime ||
		user.MinutesSpent["LAST_90_DAYS"] != ninetyDaysAgoTime ||
		user.MinutesSpent["LAST_365_DAYS"] != yearAgoTime {

		user.MinutesSpent = map[string]int{
			"LAST_7_DAYS":   weekAgoTime,
			"LAST_30_DAYS":  thirtyDaysAgoTime,
			"LAST_90_DAYS":  ninetyDaysAgoTime,
			"LAST_365_DAYS": yearAgoTime,
		}
		return true
	}

	return false
}
