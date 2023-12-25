package main

import (
	"os"
	"strings"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const START_DATE = "2023-01-01"
const END_DATE = "2023-12-31"

var repository = database.DynamoDB

type percentileTrackers struct {
	ratings map[string]map[database.DojoCohort][]float32
}

var percentiles = percentileTrackers{
	ratings: make(map[string]map[database.DojoCohort][]float32),
}

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
	log.Debug("Scanning users")

	var users []*database.User
	var startKey = ""
	for ok := true; ok; ok = startKey != "" {
		users, startKey, err = repository.ScanUsers(startKey)
		if err != nil {
			log.Errorf("Failed to scan users: %v", err)
			os.Exit(1)
		}

		log.Infof("Processing %d users", len(users))
		for _, u := range users {
			review, err := processUser(u, requirements, dojoRequirements)
			if err != nil {
				log.Errorf("Failed to process user %s: %v", u.Username, err)
			} else if review != nil {
				reviews = append(reviews, review)
			}
		}
	}

	log.Debugf("Calculating percentiles for %d reviews", len(reviews))
	for _, review := range reviews {
		calculateRatingPercentiles(review)
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
		log.Debugf("Skipping user %s because they have not created profile", user.Username)
		return nil, nil
	}

	yearReview := database.YearReview{
		Username:      user.Username,
		DisplayName:   user.DisplayName,
		UserJoinedAt:  user.CreatedAt,
		Period:        "2023",
		CurrentCohort: user.DojoCohort,
		Ratings:       map[database.RatingSystem]*database.YearReviewRatingData{},
		Total:         *initializeYearReviewData(START_DATE, END_DATE),
	}

	processRatings(user, &yearReview)

	if err := processGraduations(user, &yearReview); err != nil {
		return nil, err
	}

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

		if currentRating <= 0 {
			continue
		}

		startIdx := 0
		for idx, item := range history {
			if item.Date >= START_DATE {
				if idx == 0 {
					startRating = item.Rating
				} else {
					startRating = history[idx-1].Rating
					startIdx = idx - 1
				}
				break
			}
		}

		if startRating == 0 && len(history) > 0 {
			startRating = history[len(history)-1].Rating
			startIdx = len(history) - 1
		}

		username := user.Ratings[rs].Username
		if user.Ratings[rs].HideUsername {
			username = ""
		}

		review.Ratings[rs] = &database.YearReviewRatingData{
			Username:    username,
			IsPreferred: user.RatingSystem == rs,
			StartRating: startRating,
			CurrentRating: database.YearReviewIntData{
				Value: currentRating,
			},
			RatingChange: currentRating - startRating,
			History:      history[startIdx:],
		}

		if percentiles.ratings[string(rs)] == nil {
			percentiles.ratings[string(rs)] = make(map[database.DojoCohort][]float32)
		}
		percentiles.ratings[string(rs)][database.AllCohorts] = append(percentiles.ratings[string(rs)][database.AllCohorts], float32(currentRating))
		percentiles.ratings[string(rs)][user.DojoCohort] = append(percentiles.ratings[string(rs)][user.DojoCohort], float32(currentRating))
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

func calculateRatingPercentiles(review *database.YearReview) {
	for rs, data := range review.Ratings {
		if rs == database.Custom {
			continue
		}

		allRatings := percentiles.ratings[string(rs)][database.AllCohorts]
		cohortRatings := percentiles.ratings[string(rs)][review.CurrentCohort]

		currentRating := float32(data.CurrentRating.Value)
		review.Ratings[rs].CurrentRating.Percentile = calculatePercentile(allRatings, currentRating)
		review.Ratings[rs].CurrentRating.CohortPercentile = calculatePercentile(cohortRatings, currentRating)

		log.Debugf("All ratings: %v", allRatings)
		log.Debugf("Cohort ratings: %v", cohortRatings)
		log.Debugf("Current Rating: %v", currentRating)
		log.Debugf("Set user %s rating system %s percentile to %f and cohortPercentile to %f", review.Username, rs, data.CurrentRating.Percentile, data.CurrentRating.CohortPercentile)
	}
}

func calculatePercentile(dataset []float32, value float32) float32 {
	if len(dataset) == 0 {
		return 100
	}

	lower := 0
	for _, datum := range dataset {
		if datum <= value {
			lower += 1
		}
	}
	return float32(lower) / float32(len(dataset)) * 100
}
