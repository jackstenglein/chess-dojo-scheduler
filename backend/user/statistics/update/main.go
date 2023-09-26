package main

import (
	"context"
	"time"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
)

type Event events.CloudWatchEvent

var repository = database.DynamoDB
var monthAgo = time.Now().Add(database.ONE_MONTH_AGO).Format(time.RFC3339)

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event Event) (Event, error) {
	log.Debugf("Event: %#v", event)
	log.SetRequestId(event.ID)

	requirements, err := fetchRequirements()
	if err != nil {
		return event, err
	}

	currentStats, err := repository.GetUserStatistics()
	if err != nil {
		return event, err
	}

	stats := database.NewUserStatistics()
	for _, cohort := range database.Cohorts {
		stats.Cohorts[cohort].FreeTierConversions = currentStats.Cohorts[cohort].FreeTierConversions
		stats.Cohorts[cohort].SubscriptionCancelations = currentStats.Cohorts[cohort].SubscriptionCancelations
	}

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
				updateStats(stats, u, requirements)
			}
		}
	}

	log.Debugf("Processing graduations")
	var graduations []*database.Graduation
	var startKey = ""
	for ok := true; ok; ok = startKey != "" {
		graduations, startKey, err = repository.ScanGraduations(startKey)
		if err != nil {
			log.Errorf("Failed to scan graduations: %v", err)
			return event, err
		}

		log.Infof("Processing %d graduations", len(graduations))
		for _, g := range graduations {
			updateGradStats(stats, g, requirements)
		}
	}

	if err := repository.SetUserStatistics(stats); err != nil {
		log.Error(err)
		return event, err
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

func updateStats(stats *database.UserStatistics, user *database.User, requirements []*database.Requirement) {
	if !user.DojoCohort.IsValid() || user.RatingSystem == "" {
		return
	}
	if user.SubscriptionStatus == "FREE_TIER" {
		stats.Cohorts[user.DojoCohort].FreeParticipants += 1
		return
	}

	isActive := user.UpdatedAt >= monthAgo
	ratingChange := user.GetRatingChange()
	score := user.CalculateScore(requirements)

	requirementsMap := make(map[string]bool, len(requirements))
	for _, r := range requirements {
		requirementsMap[r.Id] = true
	}

	var minutes int
	for _, progress := range user.Progress {
		if isRequirement, _ := requirementsMap[progress.RequirementId]; isRequirement {
			m, _ := progress.MinutesSpent[user.DojoCohort]
			minutes += m
		}
	}

	cohortStats := stats.Cohorts[user.DojoCohort]
	if isActive {
		cohortStats.ActiveParticipants += 1
		cohortStats.ActiveDojoScores += score
		cohortStats.ActiveRatingChanges += ratingChange
		cohortStats.ActiveRatingSystems[user.RatingSystem] += 1
		cohortStats.ActiveMinutesSpent += minutes
		if minutes > 0 {
			cohortStats.ActiveRatingChangePerHour += 60 * (float32(ratingChange) / float32(minutes))
		}
	} else {
		cohortStats.InactiveParticipants += 1
		cohortStats.InactiveDojoScores += score
		cohortStats.InactiveRatingChanges += ratingChange
		cohortStats.InactiveRatingSystems[user.RatingSystem] += 1
		cohortStats.InactiveMinutesSpent += minutes
		if minutes > 0 {
			cohortStats.InactiveRatingChangePerHour += 60 * (float32(ratingChange) / float32(minutes))
		}
	}
}

func updateGradStats(stats *database.UserStatistics, graduation *database.Graduation, requirements []*database.Requirement) {
	if !graduation.PreviousCohort.IsValid() || graduation.Progress == nil {
		return
	}

	requirementsMap := make(map[string]bool, len(requirements))
	for _, r := range requirements {
		requirementsMap[r.Id] = true
	}

	var minutes int
	for _, progress := range graduation.Progress {
		if isRequirement, _ := requirementsMap[progress.RequirementId]; isRequirement {
			m, _ := progress.MinutesSpent[graduation.PreviousCohort]
			minutes += m
		}
	}
	if minutes == 0 {
		return
	}

	cohortStats := stats.Cohorts[graduation.PreviousCohort]
	cohortStats.NumGraduations += 1
	cohortStats.GraduationMinutes += minutes
}
