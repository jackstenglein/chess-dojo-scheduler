package main

import (
	"os"
	"strings"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const START_DATE = "2023-01-01"
const END_DATE = "2023-12-20"

var repository = database.DynamoDB

func main() {
	requirements, err := fetchRequirements()
	if err != nil {
		log.Errorf("Failed to get requirements: %v", err)
		os.Exit(1)
	}
	dojoRequirements := make(map[string]*database.Requirement)
	for _, r := range requirements {
		dojoRequirements[r.Id] = r
	}

	var reviews []*database.YearReview
	for _, cohort := range database.Cohorts {
		log.Debugf("Processing cohort %s", cohort)

		var users []*database.User
		var startKey = ""
		for ok := true; ok; ok = startKey != "" {
			users, startKey, err = repository.ListUsersByCohort(cohort, startKey)
			if err != nil {
				log.Errorf("Failed to scan users: %v", err)
				os.Exit(1)
			}

			log.Infof("Processing %d users", len(users))
			for _, u := range users {
				review, err := processUser(u, requirements, dojoRequirements)
				if err != nil {
					log.Errorf("Failed to process user %s: %v", u.Username, err)
				} else {
					reviews = append(reviews, review)
				}
			}
		}
	}

	log.Debugf("Saving %d reviews", len(reviews))
	success, err := repository.PutYearReviews(reviews)
	if err != nil {
		log.Errorf("Error while saving. Only %d saved. %v", success, err)
	} else {
		log.Debugf("Saved %d reviews", success)
	}
}

func fetchRequirements() ([]*database.Requirement, error) {
	log.Debug("Fetching requirements\n")
	var requirements []*database.Requirement
	var rs []*database.Requirement
	var startKey string
	var err error
	for ok := true; ok; ok = startKey != "" {
		rs, startKey, err = repository.ScanRequirements("", startKey)
		if err != nil {
			log.Errorf("Failed to scan requirements: %v\n", err)
			return nil, err
		}
		requirements = append(requirements, rs...)
	}
	log.Debugf("Got %d requirements\n", len(requirements))
	return requirements, nil
}

func processUser(user *database.User, requirements []*database.Requirement, dojoRequirements map[string]*database.Requirement) (*database.YearReview, error) {
	log.Debugf("Processing user %s", user.Username)

	if !user.HasCreatedProfile {
		return nil, nil
	}

	yearReview := database.YearReview{
		Username:      user.Username,
		DisplayName:   user.DisplayName,
		UserJoinedAt:  user.CreatedAt,
		Period:        "2023",
		CurrentCohort: user.DojoCohort,
		Ratings:       map[database.RatingSystem]database.YearReviewRatingData{},
		Cohorts:       map[database.DojoCohort]*database.YearReviewData{},
		Total:         *initializeYearReviewData(START_DATE, END_DATE),
	}

	processRatings(user, &yearReview)

	if err := processGraduations(user, &yearReview); err != nil {
		return nil, err
	}

	startedAt := user.LastGraduatedAt
	if startedAt == "" {
		startedAt = user.CreatedAt
	}
	yearReview.Cohorts[user.DojoCohort] = initializeYearReviewData(startedAt, END_DATE)

	if err := processGames(user, &yearReview); err != nil {
		return nil, err
	}

	if err := processTimeline(user, &yearReview, dojoRequirements); err != nil {
		return nil, err
	}
	return &yearReview, nil
}

func initializeYearReviewData(startDate, endDate string) *database.YearReviewData {
	return &database.YearReviewData{
		StartDate: startDate,
		EndDate:   endDate,
		DojoPoints: database.YearReviewDojoPoints{
			ByPeriod:   map[string]float32{},
			ByCategory: map[string]float32{},
			ByTask:     map[string]float32{},
		},
		MinutesSpent: database.YearReviewMinutesSpent{
			ByPeriod:   map[string]int{},
			ByCategory: map[string]int{},
			ByTask:     map[string]int{},
		},
		Games: database.YearReviewGamesData{
			Total:    database.YearReviewIntData{},
			ByPeriod: map[string]int{},
		},
	}
}

func processRatings(user *database.User, review *database.YearReview) {
	log.Debug("Processing ratings")

	for rs, history := range user.RatingHistories {
		startRating := 0
		currentRating := user.Ratings[rs].CurrentRating

		startIdx := 0
		for idx, item := range history {
			if item.Date > START_DATE {
				if idx == 0 {
					startRating = user.Ratings[rs].StartRating
				} else {
					startRating = history[idx-1].Rating
					startIdx = idx - 1
				}
				break
			}
		}

		username := user.Ratings[rs].Username
		if user.Ratings[rs].HideUsername {
			username = ""
		}

		review.Ratings[rs] = database.YearReviewRatingData{
			Username:    username,
			IsPreferred: user.RatingSystem == rs,
			StartRating: database.YearReviewIntData{
				Value: startRating,
			},
			CurrentRating: database.YearReviewIntData{
				Value: currentRating,
			},
			RatingChange: database.YearReviewIntData{
				Value: currentRating - startRating,
			},
			History: history[startIdx:],
		}
	}
}

func processGraduations(user *database.User, review *database.YearReview) error {
	log.Debug("Processing graduations")

	var graduations []*database.Graduation
	var startKey = ""
	var err error

	for ok := true; ok; ok = startKey != "" {
		graduations, startKey, err = repository.ListGraduationsByOwner(user.Username, startKey)
		if err != nil {
			return err
		}

		for _, grad := range graduations {
			review.Cohorts[grad.PreviousCohort] = initializeYearReviewData(grad.StartedAt, grad.CreatedAt)
			review.Graduations = append(review.Graduations, grad.PreviousCohort)
		}
	}
	return nil
}

func processGames(user *database.User, review *database.YearReview) error {
	log.Debug("Processing games")

	var games []*database.Game
	var startKey = ""
	var err error

	for ok := true; ok; ok = startKey != "" {
		games, startKey, err = repository.ListGamesByOwner(user.Username, "", "", startKey)
		if err != nil {
			return err
		}

		for _, g := range games {
			month := strings.Split(strings.Split(g.Id, "_")[0], ".")[1]
			review.Total.Games.Total.Value += 1
			review.Total.Games.ByPeriod[month] += 1

			if _, ok := review.Cohorts[g.Cohort]; !ok {
				log.Debugf("Unknown cohort %s", g.Cohort)
				review.Cohorts[g.Cohort] = initializeYearReviewData("", "")
			}

			review.Cohorts[g.Cohort].Games.Total.Value += 1
			review.Cohorts[g.Cohort].Games.ByPeriod[month] += 1
		}
	}

	return nil
}

func processTimeline(user *database.User, review *database.YearReview, requirements map[string]*database.Requirement) error {
	log.Debug("Processing timeline")

	var timeline []*database.TimelineEntry
	var startKey = ""
	var err error

	for ok := true; ok; ok = startKey != "" {
		timeline, startKey, err = repository.ListTimelineEntries(user.Username, startKey)
		if err != nil {
			return err
		}

		for _, t := range timeline {
			date := t.Id[0:10]
			if date < START_DATE || date > END_DATE {
				continue
			}
			month := strings.Split(date, "-")[1]

			points := t.DojoPoints
			if points == 0 {
				points = calculatePoints(t, requirements)
			}

			requirementName := t.RequirementName
			if requirementName == "GameSubmission" {
				requirementName = "Annotated Games"
			}

			review.Total.MinutesSpent.Total.Value += t.MinutesSpent
			review.Total.MinutesSpent.ByPeriod[month] += t.MinutesSpent
			review.Total.MinutesSpent.ByCategory[t.RequirementCategory] += t.MinutesSpent
			review.Total.MinutesSpent.ByTask[requirementName] += t.MinutesSpent

			review.Total.DojoPoints.Total.Value += points
			review.Total.DojoPoints.ByPeriod[month] += points
			review.Total.DojoPoints.ByCategory[t.RequirementCategory] += points
			review.Total.DojoPoints.ByTask[requirementName] += points

			if _, ok := review.Cohorts[t.Cohort]; !ok {
				log.Debugf("Unknown cohort %s", t.Cohort)
				review.Cohorts[t.Cohort] = initializeYearReviewData("", "")
			}

			review.Cohorts[t.Cohort].MinutesSpent.Total.Value += t.MinutesSpent
			review.Cohorts[t.Cohort].MinutesSpent.ByPeriod[month] += t.MinutesSpent
			review.Cohorts[t.Cohort].MinutesSpent.ByCategory[t.RequirementCategory] += t.MinutesSpent
			review.Cohorts[t.Cohort].MinutesSpent.ByTask[requirementName] += t.MinutesSpent

			review.Cohorts[t.Cohort].DojoPoints.Total.Value += points
			review.Cohorts[t.Cohort].DojoPoints.ByPeriod[month] += points
			review.Cohorts[t.Cohort].DojoPoints.ByCategory[t.RequirementCategory] += points
			review.Cohorts[t.Cohort].DojoPoints.ByTask[requirementName] += points
		}
	}

	return nil
}

func calculatePoints(timeline *database.TimelineEntry, requirements map[string]*database.Requirement) float32 {

	requirement := requirements[timeline.RequirementId]
	if requirement == nil {
		return 0
	}

	progress := database.RequirementProgress{
		Counts:    make(map[database.DojoCohort]int),
		UpdatedAt: timeline.CreatedAt,
	}
	if requirement.NumberOfCohorts == 1 || requirement.NumberOfCohorts == 0 {
		progress.Counts[database.AllCohorts] = timeline.PreviousCount
	} else {
		progress.Counts[timeline.Cohort] = timeline.PreviousCount
	}
	originalScore := requirement.CalculateScore(timeline.Cohort, &progress)

	if requirement.NumberOfCohorts == 1 || requirement.NumberOfCohorts == 0 {
		progress.Counts[database.AllCohorts] = timeline.NewCount
	} else {
		progress.Counts[timeline.Cohort] = timeline.NewCount
	}
	newScore := requirement.CalculateScore(timeline.Cohort, &progress)

	return newScore - originalScore
}
