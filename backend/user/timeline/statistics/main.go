package main

import (
	"context"
	"encoding/json"
	"fmt"
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
	log.Infof("Event: %#v", event)

	requirements, err := fetchRequirements()
	if err != nil {
		return event, err
	}
	requirementsMap := make(map[string]bool)
	for _, r := range requirements {
		requirementsMap[r.Id] = r.Category != "Non-Dojo"
	}

	var req UpdateRequest
	err = json.Unmarshal(event.Detail, &req)
	if err != nil {
		log.Errorf("Failed to unmarshal request: %v", err)
		return event, err
	}
	log.Infof("Request: %+v", req)

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
				shouldUpdate := updateUser(u, requirements, requirementsMap)
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

func fetchRequirements() ([]*database.Requirement, error) {
	log.Debug("Fetching requirements")
	var requirements []*database.Requirement
	var rs []*database.Requirement
	var startKey string
	var err error
	for ok := true; ok; ok = startKey != "" {
		rs, startKey, err = repository.ScanRequirements("", startKey)
		if err != nil {
			log.Errorf("Failed to scan requirements: %v", err)
			return nil, err
		}
		requirements = append(requirements, rs...)
	}
	log.Debugf("Got %d requirements", len(requirements))
	return requirements, nil
}

func updateUser(user *database.User, requirements []*database.Requirement, requirementsMap map[string]bool) bool {
	var timeline []*database.TimelineEntry
	var startKey = ""
	var err error

	if user.SubscriptionStatus == database.SubscriptionStatus_FreeTier || user.UpdatedAt < sixtyDaysAgo {
		// User won't appear on the scoreboard, so skip updating their data
		// to reduce runtime and DB pressure
		return false
	}

	totalDojoScore := calculateTotalScore(user, requirements)

	minutesSpent := make(map[string]int)
	calculateTotalTime(user, minutesSpent, user.DojoCohort, requirementsMap)

	for ok := true; ok; ok = startKey != "" {
		timeline, startKey, err = repository.ListTimelineEntries(user.Username, startKey)
		if err != nil {
			log.Errorf("Failed to get user's timeline: %s", user.Username)
			return false
		}

		for _, t := range timeline {
			valid := updateMinutesSpent(minutesSpent, t, user.DojoCohort)
			if !valid {
				goto done
			}
		}
	}

done:

	minutesSpent[database.Last30Days] += minutesSpent[database.Last7Days]
	minutesSpent[database.Last90Days] += minutesSpent[database.Last30Days]
	minutesSpent[database.Last365Days] += minutesSpent[database.Last90Days]

	minutesSpent[database.AllCohortsLast30Days] += minutesSpent[database.AllCohortsLast7Days]
	minutesSpent[database.AllCohortsLast90Days] += minutesSpent[database.AllCohortsLast30Days]
	minutesSpent[database.AllCohortsLast365Days] += minutesSpent[database.AllCohortsLast90Days]

	if totalDojoScore != user.TotalDojoScore || !minutesSpentEqual(minutesSpent, user.MinutesSpent) {
		user.TotalDojoScore = totalDojoScore
		user.MinutesSpent = minutesSpent
		return true
	}

	return false
}

func calculateTotalScore(user *database.User, requirements []*database.Requirement) float32 {
	var score float32 = 0
	for _, requirement := range requirements {
		p, ok := user.Progress[requirement.Id]
		if !ok {
			continue
		}

		for cohort := range p.Counts {
			if cohort == database.AllCohorts {
				score += requirement.CalculateScore(user.DojoCohort, p)
			} else {
				score += requirement.CalculateScore(cohort, p)
			}
		}
	}
	return score
}

func calculateTotalTime(user *database.User, minutesSpent map[string]int, cohort database.DojoCohort, requirements map[string]bool) {
	for _, p := range user.Progress {
		cohortTime := p.MinutesSpent[cohort]
		allCohortsTime := 0
		for _, v := range p.MinutesSpent {
			allCohortsTime += v
		}

		if requirements[p.RequirementId] {
			minutesSpent[database.AllTime] += cohortTime
			minutesSpent[database.AllCohortsAllTime] += allCohortsTime
		} else {
			minutesSpent[string(database.NonDojo)] += cohortTime
			minutesSpent[database.AllCohortsNonDojo] += allCohortsTime
		}
	}
}

// updateMinutesSpent adds the given timeline entry to the provided minutesSpent map. This function returns true
// if the provided timeline entry is newer than 1 year ago.
func updateMinutesSpent(minutesSpent map[string]int, t *database.TimelineEntry, cohort database.DojoCohort) bool {
	date := t.Id[0:10] + "T00:00:00Z"
	if _, err := time.Parse(time.RFC3339, date); err != nil && date < yearAgo {
		// The date as recorded in the id is immutable and is >= t.Date and t.CreatedAt,
		// since it is invalid to create a timeline entry in the future. And since timeline
		// entries are sorted by id, all remaining entries are older than this one. Thus,
		// we have finished all entries within the past year and can return that this is invalid. QED.
		return false
	}

	if t.RequirementCategory == "Non-Dojo" {
		return true
	}

	date = t.Date
	if date == "" {
		date = t.CreatedAt
	}

	var key string

	if date >= weekAgo {
		key = database.Last7Days
	} else if date >= thirtyDaysAgo {
		key = database.Last30Days
	} else if date >= ninetyDaysAgo {
		key = database.Last90Days
	} else if date >= yearAgo {
		key = database.Last365Days
	} else {
		return true
	}

	if t.Cohort == cohort {
		minutesSpent[key] += t.MinutesSpent
	}

	key = fmt.Sprintf("%s%s", database.AllCohortsPrefix, key)
	minutesSpent[key] += t.MinutesSpent
	return true
}

// minutesSpentEqual takes two minutesSpent maps and returns whether they are equal.
// We could use reflect.DeepEqual for this, but this is more performant.
func minutesSpentEqual(lhs, rhs map[string]int) bool {
	if len(lhs) == 0 {
		return len(rhs) == 0
	}

	return lhs[database.AllTime] == rhs[database.AllTime] &&
		lhs[database.Last7Days] == rhs[database.Last7Days] &&
		lhs[database.Last30Days] == rhs[database.Last30Days] &&
		lhs[database.Last90Days] == rhs[database.Last90Days] &&
		lhs[database.Last365Days] == rhs[database.Last365Days] &&
		lhs[string(database.NonDojo)] == rhs[string(database.NonDojo)] &&
		lhs[database.AllCohortsAllTime] == rhs[database.AllCohortsAllTime] &&
		lhs[database.AllCohortsLast7Days] == rhs[database.AllCohortsLast7Days] &&
		lhs[database.AllCohortsLast30Days] == rhs[database.AllCohortsLast30Days] &&
		lhs[database.AllCohortsLast90Days] == rhs[database.AllCohortsLast90Days] &&
		lhs[database.AllCohortsLast365Days] == rhs[database.AllCohortsLast365Days] &&
		lhs[database.AllCohortsNonDojo] == rhs[database.AllCohortsNonDojo]
}
