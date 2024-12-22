package main

import (
	"os"
	"strconv"
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

	printTotalDojoStats(reviews)
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
		Period:        PERIOD,
		CurrentCohort: user.DojoCohort,
		DisplayName:   user.DisplayName,
		UserJoinedAt:  user.CreatedAt,
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
			normalizedRating := getNormalizedRating(currentRating, rs)
			percentiles.ratings[PREFERRED][database.AllCohorts] = append(percentiles.ratings[PREFERRED][database.AllCohorts], normalizedRating)
			percentiles.ratings[PREFERRED][user.DojoCohort] = append(percentiles.ratings[PREFERRED][user.DojoCohort], normalizedRating)
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
		games, startKey, err = repository.ListGamesByOwner(true, user.Username, strings.ReplaceAll(START_DATE, "-", "."), strings.ReplaceAll(END_DATE, "-", "."), startKey)
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
	var usedTimeline = make([]*database.TimelineEntry, 0)
	var startKey = ""
	var err error

	for ok := true; ok; ok = startKey != "" {
		timeline, startKey, err = repository.ListTimelineEntries(user.Username, startKey)
		if err != nil {
			return err
		}

		for _, t := range timeline {
			if t.RequirementCategory == "" {
				continue
			}

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
				requirementName = "Annotate Games"
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

	review.Total.Games.Win.Percentile = calculatePercentile(percentiles.win[database.AllCohorts], float32(review.Total.Games.Win.Value))
	review.Total.Games.Win.CohortPercentile = calculatePercentile(percentiles.win[review.CurrentCohort], float32(review.Total.Games.Win.Value))

	review.Total.Games.Draw.Percentile = calculatePercentile(percentiles.draw[database.AllCohorts], float32(review.Total.Games.Draw.Value))
	review.Total.Games.Draw.CohortPercentile = calculatePercentile(percentiles.draw[review.CurrentCohort], float32(review.Total.Games.Draw.Value))

	review.Total.Games.Loss.Percentile = calculatePercentile(percentiles.loss[database.AllCohorts], float32(review.Total.Games.Loss.Value))
	review.Total.Games.Loss.CohortPercentile = calculatePercentile(percentiles.loss[review.CurrentCohort], float32(review.Total.Games.Loss.Value))

	review.Total.Games.Analysis.Percentile = calculatePercentile(percentiles.analysis[database.AllCohorts], float32(review.Total.Games.Analysis.Value))
	review.Total.Games.Analysis.CohortPercentile = calculatePercentile(percentiles.analysis[review.CurrentCohort], float32(review.Total.Games.Analysis.Value))
}

func printTotalDojoStats(reviews []*database.YearReview) {
	games := 0
	dojoPoints := float32(0)
	minutesSpent := 0
	graduations := 0

	for _, r := range reviews {
		games += r.Total.Games.Total.Value
		dojoPoints += r.Total.DojoPoints.Total.Value
		minutesSpent += r.Total.MinutesSpent.Total.Value
		graduations += len(r.Graduations)
	}

	log.Debugf("Total Games: %v", games)
	log.Debugf("Total Dojo Points: %v", dojoPoints)
	log.Debugf("Total Minutes Spent: %v", minutesSpent)
	log.Debugf("Total Graduations: %v", graduations)
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

func getNormalizedRating(rating int, ratingSystem database.RatingSystem) float32 {
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

			y1, y2 := getCohortRangeInt(cohort)

			if y1 == -1 {
				y1 = 0
			}
			if y2 == -1 {
				y2 = 0
			}

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

func getCohortRangeInt(cohort database.DojoCohort) (int, int) {
	strCohort := strings.ReplaceAll(string(cohort), "+", "")
	tokens := strings.Split(strCohort, "-")

	minCohort, err := strconv.Atoi(tokens[0])
	if err != nil {
		return -1, -1
	}

	if len(tokens) < 2 {
		return minCohort, 2500
	}

	maxCohort, err := strconv.Atoi((tokens[1]))
	if err != nil {
		return minCohort, 2500
	}

	return minCohort, maxCohort
}

var ratingBoundaries = map[database.DojoCohort]map[database.RatingSystem]int{
	"0-300": {
		database.Chesscom: 550,
		database.Lichess:  1250,
		database.Fide:     0,
		database.Uscf:     350,
		database.Ecf:      400,
		database.Cfc:      350,
		database.Dwz:      450,
		database.Acf:      300,
		database.Knsb:     400,
		database.Custom:   -1,
	},
	"300-400": {
		database.Chesscom: 650,
		database.Lichess:  1310,
		database.Fide:     0,
		database.Uscf:     460,
		database.Ecf:      625,
		database.Cfc:      460,
		database.Dwz:      540,
		database.Acf:      395,
		database.Knsb:     600,
		database.Custom:   -1,
	},
	"400-500": {
		database.Chesscom: 750,
		database.Lichess:  1370,
		database.Fide:     0,
		database.Uscf:     570,
		database.Ecf:      850,
		database.Cfc:      570,
		database.Dwz:      630,
		database.Acf:      490,
		database.Knsb:     800,
		database.Custom:   -1,
	},
	"500-600": {
		database.Chesscom: 850,
		database.Lichess:  1435,
		database.Fide:     0,
		database.Uscf:     680,
		database.Ecf:      1000,
		database.Cfc:      680,
		database.Dwz:      725,
		database.Acf:      585,
		database.Knsb:     1000,
		database.Custom:   -1,
	},
	"600-700": {
		database.Chesscom: 950,
		database.Lichess:  1500,
		database.Fide:     0,
		database.Uscf:     790,
		database.Ecf:      1130,
		database.Cfc:      780,
		database.Dwz:      815,
		database.Acf:      680,
		database.Knsb:     1140,
		database.Custom:   -1,
	},
	"700-800": {
		database.Chesscom: 1050,
		database.Lichess:  1550,
		database.Fide:     0,
		database.Uscf:     900,
		database.Ecf:      1210,
		database.Cfc:      880,
		database.Dwz:      920,
		database.Acf:      775,
		database.Knsb:     1280,
		database.Custom:   -1,
	},
	"800-900": {
		database.Chesscom: 1150,
		database.Lichess:  1600,
		database.Fide:     0,
		database.Uscf:     1010,
		database.Ecf:      1270,
		database.Cfc:      980,
		database.Dwz:      1025,
		database.Acf:      870,
		database.Knsb:     1400,
		database.Custom:   -1,
	},
	"900-1000": {
		database.Fide:     1450,
		database.Uscf:     1120,
		database.Chesscom: 1250,
		database.Lichess:  1665,
		database.Ecf:      1325,
		database.Cfc:      1090,
		database.Dwz:      1110,
		database.Acf:      990,
		database.Knsb:     1450,
		database.Custom:   -1,
	},
	"1000-1100": {
		database.Fide:     1500,
		database.Uscf:     1230,
		database.Chesscom: 1350,
		database.Lichess:  1730,
		database.Ecf:      1390,
		database.Cfc:      1200,
		database.Dwz:      1185,
		database.Acf:      1100,
		database.Knsb:     1500,
		database.Custom:   -1,
	},
	"1100-1200": {
		database.Fide:     1550,
		database.Uscf:     1330,
		database.Chesscom: 1450,
		database.Lichess:  1795,
		database.Ecf:      1455,
		database.Cfc:      1300,
		database.Dwz:      1260,
		database.Acf:      1210,
		database.Knsb:     1550,
		database.Custom:   -1,
	},
	"1200-1300": {
		database.Fide:     1600,
		database.Uscf:     1420,
		database.Chesscom: 1550,
		database.Lichess:  1850,
		database.Ecf:      1535,
		database.Cfc:      1390,
		database.Dwz:      1335,
		database.Acf:      1320,
		database.Knsb:     1600,
		database.Custom:   -1,
	},
	"1300-1400": {
		database.Fide:     1650,
		database.Uscf:     1510,
		database.Chesscom: 1650,
		database.Lichess:  1910,
		database.Ecf:      1595,
		database.Cfc:      1480,
		database.Dwz:      1410,
		database.Acf:      1415,
		database.Knsb:     1650,
		database.Custom:   -1,
	},
	"1400-1500": {
		database.Fide:     1700,
		database.Uscf:     1600,
		database.Chesscom: 1750,
		database.Lichess:  1970,
		database.Ecf:      1665,
		database.Cfc:      1570,
		database.Dwz:      1480,
		database.Acf:      1510,
		database.Knsb:     1700,
		database.Custom:   -1,
	},
	"1500-1600": {
		database.Fide:     1750,
		database.Uscf:     1675,
		database.Chesscom: 1850,
		database.Lichess:  2030,
		database.Ecf:      1735,
		database.Cfc:      1645,
		database.Dwz:      1560,
		database.Acf:      1605,
		database.Knsb:     1750,
		database.Custom:   -1,
	},
	"1600-1700": {
		database.Fide:     1800,
		database.Uscf:     1750,
		database.Chesscom: 1950,
		database.Lichess:  2090,
		database.Ecf:      1805,
		database.Cfc:      1730,
		database.Dwz:      1640,
		database.Acf:      1700,
		database.Knsb:     1800,
		database.Custom:   -1,
	},
	"1700-1800": {
		database.Fide:     1850,
		database.Uscf:     1825,
		database.Chesscom: 2050,
		database.Lichess:  2150,
		database.Ecf:      1875,
		database.Cfc:      1825,
		database.Dwz:      1720,
		database.Acf:      1790,
		database.Knsb:     1850,
		database.Custom:   -1,
	},
	"1800-1900": {
		database.Fide:     1910,
		database.Uscf:     1930,
		database.Chesscom: 2165,
		database.Lichess:  2225,
		database.Ecf:      1955,
		database.Cfc:      1925,
		database.Dwz:      1815,
		database.Acf:      1900,
		database.Knsb:     1910,
		database.Custom:   -1,
	},
	"1900-2000": {
		database.Fide:     2000,
		database.Uscf:     2055,
		database.Chesscom: 2275,
		database.Lichess:  2310,
		database.Ecf:      2065,
		database.Cfc:      2060,
		database.Dwz:      1940,
		database.Acf:      2000,
		database.Knsb:     2000,
		database.Custom:   -1,
	},
	"2000-2100": {
		database.Fide:     2100,
		database.Uscf:     2185,
		database.Chesscom: 2360,
		database.Lichess:  2370,
		database.Ecf:      2165,
		database.Cfc:      2185,
		database.Dwz:      2070,
		database.Acf:      2105,
		database.Knsb:     2100,
		database.Custom:   -1,
	},
	"2100-2200": {
		database.Fide:     2200,
		database.Uscf:     2290,
		database.Chesscom: 2425,
		database.Lichess:  2410,
		database.Ecf:      2260,
		database.Cfc:      2290,
		database.Dwz:      2185,
		database.Acf:      2215,
		database.Knsb:     2200,
		database.Custom:   -1,
	},
	"2200-2300": {
		database.Fide:     2300,
		database.Uscf:     2395,
		database.Chesscom: 2485,
		database.Lichess:  2440,
		database.Ecf:      2360,
		database.Cfc:      2395,
		database.Dwz:      2285,
		database.Acf:      2330,
		database.Knsb:     2300,
		database.Custom:   -1,
	},
	"2300-2400": {
		database.Fide:     2400,
		database.Uscf:     2500,
		database.Chesscom: 2550,
		database.Lichess:  2470,
		database.Ecf:      2460,
		database.Cfc:      2500,
		database.Dwz:      2385,
		database.Acf:      2450,
		database.Knsb:     2400,
		database.Custom:   -1,
	},
}
