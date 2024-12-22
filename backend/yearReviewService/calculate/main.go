package main

import (
	"os"
	"strings"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const PERIOD = "2024"
const START_DATE = PERIOD + "-01-01"
const END_DATE = PERIOD + "-12-31"
const PREFERRED = "preferred"

var repository = database.DynamoDB

type percentileTrackers struct {
	ratings    map[string]map[database.DojoCohort][]float32
	dojoPoints map[database.DojoCohort][]float32
	timeSpent  map[database.DojoCohort][]float32
	games      map[database.DojoCohort][]float32
	win        map[database.DojoCohort][]float32
	loss       map[database.DojoCohort][]float32
	draw       map[database.DojoCohort][]float32
	analysis   map[database.DojoCohort][]float32
}

var percentiles = percentileTrackers{
	ratings: map[string]map[database.DojoCohort][]float32{
		PREFERRED: make(map[database.DojoCohort][]float32),
	},
	dojoPoints: map[database.DojoCohort][]float32{},
	timeSpent:  map[database.DojoCohort][]float32{},
	games:      map[database.DojoCohort][]float32{},
	win:        map[database.DojoCohort][]float32{},
	loss:       map[database.DojoCohort][]float32{},
	draw:       map[database.DojoCohort][]float32{},
	analysis:   map[database.DojoCohort][]float32{},
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
			review, err := processUser(u, dojoRequirements)
			if err != nil {
				log.Errorf("Failed to process user %s: %v", u.Username, err)
			} else if review != nil {
				reviews = append(reviews, review)
			}
		}
	}

	log.Debugf("Calculating percentiles for %d reviews", len(reviews))
	for _, review := range reviews {
		setPercentiles(review)
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

func processUser(user *database.User, dojoRequirements map[string]*database.Requirement) (*database.YearReview, error) {
	if !user.HasCreatedProfile || user.Ratings == nil || !user.DojoCohort.IsValid() {
		log.Debugf("Skipping user %s because they have not created profile", user.Username)
		return nil, nil
	}
	log.Debugf("Processing user %s", user.Username)

	yearReview := database.YearReview{
		Username:      user.Username,
		DisplayName:   user.DisplayName,
		UserJoinedAt:  user.CreatedAt,
		Period:        PERIOD,
		CurrentCohort: user.DojoCohort,
		Ratings:       map[database.RatingSystem]*database.YearReviewRatingData{},
		Total:         *initializeYearReviewData(),
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

func initializeYearReviewData() *database.YearReviewData {
	return &database.YearReviewData{
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
			Win:      database.YearReviewIntData{},
			Draw:     database.YearReviewIntData{},
			Loss:     database.YearReviewIntData{},
			Analysis: database.YearReviewIntData{},
			ByPeriod: map[string]int{},
		},
	}
}

func processRatings(user *database.User, review *database.YearReview) {
	for rs, history := range user.RatingHistories {
		if user.Ratings[rs] == nil {
			continue
		}

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

		isPreferred := user.RatingSystem == rs
		review.Ratings[rs] = &database.YearReviewRatingData{
			Username:    username,
			IsPreferred: isPreferred,
			StartRating: startRating,
			CurrentRating: database.YearReviewIntData{
				Value: currentRating,
			},
			RatingChange: currentRating - startRating,
			History:      history[startIdx:],
		}

		if rs == database.Custom {
			continue
		}

		if percentiles.ratings[string(rs)] == nil {
			percentiles.ratings[string(rs)] = make(map[database.DojoCohort][]float32)
		}
		percentiles.ratings[string(rs)][database.AllCohorts] = append(percentiles.ratings[string(rs)][database.AllCohorts], float32(currentRating))
		percentiles.ratings[string(rs)][user.DojoCohort] = append(percentiles.ratings[string(rs)][user.DojoCohort], float32(currentRating))

		if isPreferred {
			percentiles.ratings[PREFERRED][database.AllCohorts] = append(percentiles.ratings[PREFERRED][database.AllCohorts], normalizeToFide(currentRating, rs))
			percentiles.ratings[PREFERRED][user.DojoCohort] = append(percentiles.ratings[PREFERRED][user.DojoCohort], normalizeToFide(currentRating, rs))
		}
	}
}

func processGraduations(user *database.User, review *database.YearReview) error {
	var graduations []database.Graduation
	var startKey = ""
	var err error

	for ok := true; ok; ok = startKey != "" {
		graduations, startKey, err = repository.ListGraduationsByOwner(user.Username, startKey)
		if err != nil {
			return err
		}

		for _, grad := range graduations {
			if grad.CreatedAt >= START_DATE {
				review.Graduations = append(review.Graduations, grad.PreviousCohort)
			}
		}
	}
	return nil
}

func processGames(user *database.User, review *database.YearReview) error {
	var games []*database.Game
	var startKey = ""
	var err error

	for ok := true; ok; ok = startKey != "" {
		games, startKey, err = repository.ListGamesByOwner(true, user.Username, START_DATE, END_DATE, startKey)
		if err != nil {
			return err
		}

		for _, g := range games {
			month := strings.Split(strings.Split(g.Id, "_")[0], ".")[1]
			review.Total.Games.Total.Value += 1
			review.Total.Games.ByPeriod[month] += 1

			result := g.Headers["Result"]
			if result == "1/2-1/2" {
				review.Total.Games.Draw.Value += 1
			} else if result == "1-0" {
				if g.Orientation == "black" {
					review.Total.Games.Loss.Value += 1
				} else {
					review.Total.Games.Win.Value += 1
				}
			} else if result == "0-1" {
				if g.Orientation == "black" {
					review.Total.Games.Win.Value += 1
				} else {
					review.Total.Games.Loss.Value += 1
				}
			} else {
				review.Total.Games.Analysis.Value += 1
			}
		}
	}

	percentiles.games[database.AllCohorts] = append(percentiles.games[database.AllCohorts], float32(review.Total.Games.Total.Value))
	percentiles.games[user.DojoCohort] = append(percentiles.games[user.DojoCohort], float32(review.Total.Games.Total.Value))

	percentiles.win[database.AllCohorts] = append(percentiles.win[database.AllCohorts], float32(review.Total.Games.Win.Value))
	percentiles.win[user.DojoCohort] = append(percentiles.win[user.DojoCohort], float32(review.Total.Games.Win.Value))

	percentiles.draw[database.AllCohorts] = append(percentiles.draw[database.AllCohorts], float32(review.Total.Games.Draw.Value))
	percentiles.draw[user.DojoCohort] = append(percentiles.draw[user.DojoCohort], float32(review.Total.Games.Draw.Value))

	percentiles.loss[database.AllCohorts] = append(percentiles.loss[database.AllCohorts], float32(review.Total.Games.Loss.Value))
	percentiles.loss[user.DojoCohort] = append(percentiles.loss[user.DojoCohort], float32(review.Total.Games.Loss.Value))

	percentiles.analysis[database.AllCohorts] = append(percentiles.analysis[database.AllCohorts], float32(review.Total.Games.Analysis.Value))
	percentiles.analysis[user.DojoCohort] = append(percentiles.analysis[user.DojoCohort], float32(review.Total.Games.Analysis.Value))

	return nil
}

func processTimeline(user *database.User, review *database.YearReview, requirements map[string]*database.Requirement) error {
	var timeline []*database.TimelineEntry
	var usedTimeline []*database.TimelineEntry
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

			usedTimeline = append(usedTimeline, t)
		}
	}

	review.Timeline = usedTimeline

	percentiles.timeSpent[database.AllCohorts] = append(percentiles.timeSpent[database.AllCohorts], float32(review.Total.MinutesSpent.Total.Value))
	percentiles.timeSpent[user.DojoCohort] = append(percentiles.timeSpent[user.DojoCohort], float32(review.Total.MinutesSpent.Total.Value))

	percentiles.dojoPoints[database.AllCohorts] = append(percentiles.dojoPoints[database.AllCohorts], review.Total.DojoPoints.Total.Value)
	percentiles.dojoPoints[user.DojoCohort] = append(percentiles.dojoPoints[user.DojoCohort], review.Total.DojoPoints.Total.Value)

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

func setPercentiles(review *database.YearReview) {
	for rs, data := range review.Ratings {
		if rs == database.Custom {
			continue
		}

		allRatings := percentiles.ratings[string(rs)][database.AllCohorts]
		cohortRatings := percentiles.ratings[string(rs)][review.CurrentCohort]

		if data.IsPreferred {
			allRatings = percentiles.ratings[PREFERRED][database.AllCohorts]
			cohortRatings = percentiles.ratings[PREFERRED][review.CurrentCohort]
		}

		currentRating := float32(data.CurrentRating.Value)
		review.Ratings[rs].CurrentRating.Percentile = calculatePercentile(allRatings, currentRating)
		review.Ratings[rs].CurrentRating.CohortPercentile = calculatePercentile(cohortRatings, currentRating)
	}

	review.Total.MinutesSpent.Total.Percentile = calculatePercentile(percentiles.timeSpent[database.AllCohorts], float32(review.Total.MinutesSpent.Total.Value))
	review.Total.MinutesSpent.Total.CohortPercentile = calculatePercentile(percentiles.timeSpent[review.CurrentCohort], float32(review.Total.MinutesSpent.Total.Value))

	review.Total.DojoPoints.Total.Percentile = calculatePercentile(percentiles.dojoPoints[database.AllCohorts], review.Total.DojoPoints.Total.Value)
	review.Total.DojoPoints.Total.CohortPercentile = calculatePercentile(percentiles.dojoPoints[review.CurrentCohort], review.Total.DojoPoints.Total.Value)

	review.Total.Games.Total.Percentile = calculatePercentile(percentiles.games[database.AllCohorts], float32(review.Total.Games.Total.Value))
	review.Total.Games.Total.CohortPercentile = calculatePercentile(percentiles.games[review.CurrentCohort], float32(review.Total.Games.Total.Value))
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

func normalizeToFide(rating int, ratingSystem database.RatingSystem) float32 {
	if ratingSystem == database.Fide {
		return float32(rating)
	}
	if ratingSystem == database.Custom {
		return -1
	}

	for _, cohort := range database.Cohorts {
		x2 := getRatingBoundary(cohort, ratingSystem)
		if x2 <= 0 {
			continue
		}

		if x2 >= rating {
			x1 := getMinRatingBoundary(cohort, ratingSystem)

			y2 := getRatingBoundary(cohort, database.Fide)
			y1 := getMinRatingBoundary(cohort, database.Fide)

			result := (float32(y2-y1)/float32(x2-x1))*float32(rating-x1) + float32(y1)
			return result
		}
	}

	// We are in the 2400+ cohort if we make it here, so we just extrapolate from the 2300-2400 line
	x1 := getMinRatingBoundary("2300-2400", ratingSystem)
	x2 := getRatingBoundary("2300-2400", ratingSystem)
	y1 := 2300
	y2 := 2400
	result := (float32(y2-y1)/float32(x2-x1))*float32(rating-x1) + float32(y1)
	return result
}

func getRatingBoundary(cohort database.DojoCohort, ratingSystem database.RatingSystem) int {
	cohortBoundaries := ratingBoundaries[cohort]
	if cohortBoundaries == nil {
		return -1
	}

	boundary := cohortBoundaries[ratingSystem]
	if boundary <= 0 {
		return -1
	}
	return boundary
}

func getMinRatingBoundary(cohort database.DojoCohort, ratingSystem database.RatingSystem) int {
	cohortIdx := 0
	for i, c := range database.Cohorts {
		if c == cohort {
			cohortIdx = i
			break
		}
	}

	if cohortIdx <= 0 {
		return 0
	}
	return getRatingBoundary(database.Cohorts[cohortIdx-1], ratingSystem)
}

var ratingBoundaries = map[database.DojoCohort]map[database.RatingSystem]int{
	"0-300": {
		database.Chesscom: 550,
		database.Lichess:  1035,
		database.Fide:     300,
		database.Uscf:     350,
		database.Ecf:      300,
		database.Cfc:      425,
		database.Dwz:      300,
		database.Acf:      0,
		database.Custom:   -1,
	},
	"300-400": {
		database.Chesscom: 650,
		database.Lichess:  1100,
		database.Fide:     400,
		database.Uscf:     450,
		database.Ecf:      400,
		database.Cfc:      525,
		database.Dwz:      400,
		database.Acf:      0,
		database.Custom:   -1,
	},
	"400-500": {
		database.Chesscom: 750,
		database.Lichess:  1165,
		database.Fide:     500,
		database.Uscf:     550,
		database.Ecf:      500,
		database.Cfc:      625,
		database.Dwz:      500,
		database.Acf:      105,
		database.Custom:   -1,
	},
	"500-600": {
		database.Chesscom: 850,
		database.Lichess:  1225,
		database.Fide:     600,
		database.Uscf:     650,
		database.Ecf:      600,
		database.Cfc:      725,
		database.Dwz:      600,
		database.Acf:      240,
		database.Custom:   -1,
	},
	"600-700": {
		database.Chesscom: 950,
		database.Lichess:  1290,
		database.Fide:     700,
		database.Uscf:     750,
		database.Ecf:      700,
		database.Cfc:      825,
		database.Dwz:      700,
		database.Acf:      370,
		database.Custom:   -1,
	},
	"700-800": {
		database.Chesscom: 1050,
		database.Lichess:  1350,
		database.Fide:     800,
		database.Uscf:     850,
		database.Ecf:      800,
		database.Cfc:      925,
		database.Dwz:      800,
		database.Acf:      500,
		database.Custom:   -1,
	},
	"800-900": {
		database.Chesscom: 1150,
		database.Lichess:  1415,
		database.Fide:     900,
		database.Uscf:     950,
		database.Ecf:      900,
		database.Cfc:      1025,
		database.Dwz:      900,
		database.Acf:      630,
		database.Custom:   -1,
	},
	"900-1000": {
		database.Fide:     1000,
		database.Uscf:     1050,
		database.Chesscom: 1250,
		database.Lichess:  1475,
		database.Ecf:      1000,
		database.Cfc:      1125,
		database.Dwz:      1000,
		database.Acf:      760,
		database.Custom:   -1,
	},
	"1000-1100": {
		database.Fide:     1100,
		database.Uscf:     1150,
		database.Chesscom: 1350,
		database.Lichess:  1575,
		database.Ecf:      1100,
		database.Cfc:      1225,
		database.Dwz:      1100,
		database.Acf:      890,
		database.Custom:   -1,
	},
	"1100-1200": {
		database.Fide:     1200,
		database.Uscf:     1250,
		database.Chesscom: 1450,
		database.Lichess:  1675,
		database.Ecf:      1200,
		database.Cfc:      1325,
		database.Dwz:      1200,
		database.Acf:      1015,
		database.Custom:   -1,
	},
	"1200-1300": {
		database.Fide:     1300,
		database.Uscf:     1350,
		database.Chesscom: 1550,
		database.Lichess:  1750,
		database.Ecf:      1300,
		database.Cfc:      1425,
		database.Dwz:      1300,
		database.Acf:      1145,
		database.Custom:   -1,
	},
	"1300-1400": {
		database.Fide:     1400,
		database.Uscf:     1450,
		database.Chesscom: 1650,
		database.Lichess:  1825,
		database.Ecf:      1400,
		database.Cfc:      1525,
		database.Dwz:      1400,
		database.Acf:      1270,
		database.Custom:   -1,
	},
	"1400-1500": {
		database.Fide:     1500,
		database.Uscf:     1550,
		database.Chesscom: 1750,
		database.Lichess:  1900,
		database.Ecf:      1500,
		database.Cfc:      1625,
		database.Dwz:      1500,
		database.Acf:      1400,
		database.Custom:   -1,
	},
	"1500-1600": {
		database.Fide:     1600,
		database.Uscf:     1650,
		database.Chesscom: 1850,
		database.Lichess:  2000,
		database.Ecf:      1600,
		database.Cfc:      1725,
		database.Dwz:      1600,
		database.Acf:      1525,
		database.Custom:   -1,
	},
	"1600-1700": {
		database.Fide:     1700,
		database.Uscf:     1775,
		database.Chesscom: 1950,
		database.Lichess:  2075,
		database.Ecf:      1700,
		database.Cfc:      1825,
		database.Dwz:      1700,
		database.Acf:      1650,
		database.Custom:   -1,
	},
	"1700-1800": {
		database.Fide:     1800,
		database.Uscf:     1875,
		database.Chesscom: 2050,
		database.Lichess:  2150,
		database.Ecf:      1800,
		database.Cfc:      1925,
		database.Dwz:      1800,
		database.Acf:      1775,
		database.Custom:   -1,
	},
	"1800-1900": {
		database.Fide:     1900,
		database.Uscf:     1975,
		database.Chesscom: 2150,
		database.Lichess:  2225,
		database.Ecf:      1900,
		database.Cfc:      2025,
		database.Dwz:      1900,
		database.Acf:      1900,
		database.Custom:   -1,
	},
	"1900-2000": {
		database.Fide:     2000,
		database.Uscf:     2100,
		database.Chesscom: 2250,
		database.Lichess:  2300,
		database.Ecf:      2000,
		database.Cfc:      2125,
		database.Dwz:      2000,
		database.Acf:      2020,
		database.Custom:   -1,
	},
	"2000-2100": {
		database.Fide:     2100,
		database.Uscf:     2200,
		database.Chesscom: 2350,
		database.Lichess:  2375,
		database.Ecf:      2100,
		database.Cfc:      2225,
		database.Dwz:      2100,
		database.Acf:      2145,
		database.Custom:   -1,
	},
	"2100-2200": {
		database.Fide:     2200,
		database.Uscf:     2300,
		database.Chesscom: 2425,
		database.Lichess:  2450,
		database.Ecf:      2200,
		database.Cfc:      2325,
		database.Dwz:      2200,
		database.Acf:      2265,
		database.Custom:   -1,
	},
	"2200-2300": {
		database.Fide:     2300,
		database.Uscf:     2400,
		database.Chesscom: 2525,
		database.Lichess:  2525,
		database.Ecf:      2300,
		database.Cfc:      2425,
		database.Dwz:      2300,
		database.Acf:      2390,
		database.Custom:   -1,
	},
	"2300-2400": {
		database.Fide:     2400,
		database.Uscf:     2500,
		database.Chesscom: 2600,
		database.Lichess:  2600,
		database.Ecf:      2400,
		database.Cfc:      2525,
		database.Dwz:      2400,
		database.Acf:      2510,
		database.Custom:   -1,
	},
}
