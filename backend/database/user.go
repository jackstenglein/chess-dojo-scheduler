package database

import (
	"fmt"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
)

type DojoCohort string

var Cohorts = []DojoCohort{
	"0-300",
	"300-400",
	"400-500",
	"500-600",
	"600-700",
	"700-800",
	"800-900",
	"900-1000",
	"1000-1100",
	"1100-1200",
	"1200-1300",
	"1300-1400",
	"1400-1500",
	"1500-1600",
	"1600-1700",
	"1700-1800",
	"1800-1900",
	"1900-2000",
	"2000-2100",
	"2100-2200",
	"2200-2300",
	"2300-2400",
	"2400+",
}

const AllCohorts DojoCohort = "ALL_COHORTS"

const NoCohort DojoCohort = "NO_COHORT"

// IsValidCohort returns true if the provided cohort is valid.
func IsValidCohort(c DojoCohort) bool {
	if c == AllCohorts {
		return true
	}
	for _, c2 := range Cohorts {
		if c == c2 {
			return true
		}
	}
	return false
}

func (c DojoCohort) IsValid() bool {
	if c == AllCohorts {
		return true
	}
	for _, c2 := range Cohorts {
		if c == c2 {
			return true
		}
	}
	return false
}

// GetNextCohort returns the cohort after the provided one or
// NoCohort if none exist.
func (c DojoCohort) GetNextCohort() DojoCohort {
	for i, c2 := range Cohorts[:len(Cohorts)-1] {
		if c == c2 {
			return Cohorts[i+1]
		}
	}
	return NoCohort
}

type RatingSystem string

const (
	Chesscom RatingSystem = "CHESSCOM"
	Lichess  RatingSystem = "LICHESS"
	Fide     RatingSystem = "FIDE"
	Uscf     RatingSystem = "USCF"
	Ecf      RatingSystem = "ECF"
	Cfc      RatingSystem = "CFC"
	Dwz      RatingSystem = "DWZ"
	Custom   RatingSystem = "CUSTOM"
)

var ratingSystems = []RatingSystem{
	Chesscom,
	Lichess,
	Fide,
	Uscf,
	Ecf,
	Cfc,
	Dwz,
	Custom,
}

type Rating struct {
	// The username/id of the user in this rating system
	Username string `dynamodbav:"username" json:"username"`

	// Whether to hide the username/id from other users
	HideUsername bool `dynamodbav:"hideUsername" json:"hideUsername"`

	// The user's rating at the time they joined the Dojo
	StartRating int `dynamodbav:"startRating" json:"startRating"`

	// The user's current rating
	CurrentRating int `dynamodbav:"currentRating" json:"currentRating"`
}

type RatingHistory struct {
	// The date of the rating in ISO format.
	Date string `dynamodbav:"date" json:"date"`

	// The rating the user had at the given date.
	Rating int `dynamodbav:"rating" json:"rating"`
}

type User struct {
	// The user's Cognito username. Uniquely identifies a user
	Username string `dynamodbav:"username" json:"username"`

	// The user's email address used to log into the scoreboard
	Email string `dynamodbav:"email" json:"-"`

	// The user's email address used to log into the wix site
	WixEmail string `dynamodbav:"wixEmail" json:"wixEmail"`

	// Whether the user is forbidden from accessing the site due to
	// missing Wix subscription
	IsForbidden bool `dynamodbav:"isForbidden" json:"isForbidden"`

	// The name of the user
	Name string `dynamodbav:"name" json:"-"`

	// The user's preferred display name on the site
	DisplayName string `dynamodbav:"displayName" json:"displayName"`

	// The user's Discord username
	DiscordUsername string `dynamodbav:"discordUsername" json:"discordUsername"`

	// A search field of the form display:DisplayName_discord:DiscordUsername_[ratingSystem:RatingSystem.Username]
	// Stored in all lowercase. Each rating's username is only included if its HideUsername field is false.
	// Ex: display:jackst_discord:jackstenglein_chesscom:jackstenglein_uscf:12345
	SearchKey string `dynamodbav:"searchKey" json:"searchKey"`

	// The user's bio
	Bio string `dynamodbav:"bio" json:"bio"`

	// The user's preferred rating system
	RatingSystem RatingSystem `dynamodbav:"ratingSystem" json:"ratingSystem"`

	// The user's ratings in each rating system
	Ratings map[RatingSystem]*Rating `dynamodbav:"ratings" json:"ratings"`

	// A map from a rating system to a slice of RatingHistory objects for that rating system.
	RatingHistories map[RatingSystem][]RatingHistory `dynamodbav:"ratingHistories" json:"ratingHistories"`

	// The user's Dojo cohort
	DojoCohort DojoCohort `dynamodbav:"dojoCohort" json:"dojoCohort"`

	// Maps requirement ids to RequirementProgress objects
	Progress map[string]*RequirementProgress `dynamodbav:"progress" json:"progress"`

	// Whether to disable notifications when a user's meeting is booked
	DisableBookingNotifications bool `dynamodbav:"disableBookingNotifications" json:"disableBookingNotifications"`

	// Whether to disable notifications when a user's meeting is cancelled
	DisableCancellationNotifications bool `dynamodbav:"disableCancellationNotifications" json:"disableCancellationNotifications"`

	// The number of games the user has created
	GamesCreated map[DojoCohort]int `dynamodbav:"gamesCreated" json:"gamesCreated"`

	// Whether the user is an admin or not
	IsAdmin bool `dynamodbav:"isAdmin" json:"isAdmin"`

	// Whether the user has admin privileges for the calendar
	IsCalendarAdmin bool `dynamodbav:"isCalendarAdmin" json:"isCalendarAdmin"`

	// Whether the user is a beta tester or not
	IsBetaTester bool `dynamodbav:"isBetaTester" json:"isBetaTester"`

	// When the user first created their account
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`

	// The number of times the user has graduated
	NumberOfGraduations int `dynamodbav:"numberOfGraduations" json:"numberOfGraduations"`

	// The cohort the user most recently graduated from
	PreviousCohort DojoCohort `dynamodbav:"previousCohort" json:"previousCohort"`

	// The cohorts the user has graduated from
	GraduationCohorts []DojoCohort `dynamodbav:"graduationCohorts" json:"graduationCohorts"`

	// When the user most recently graduated
	LastGraduatedAt string `dynamodbav:"lastGraduatedAt" json:"lastGraduatedAt"`

	// When the user was most recently updated (not including nightly rating updates)
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`

	// Whether to enable dark mode on the site
	EnableDarkMode bool `dynamodbav:"enableDarkMode" json:"enableDarkMode"`

	// The user's preferred timezone on the calendar
	TimezoneOverride string `dynamodbav:"timezoneOverride" json:"timezoneOverride"`

	// The user's list of custom tasks
	CustomTasks []*CustomTask `dynamodbav:"customTasks" json:"customTasks"`

	// Whether the user has finished creating their profile
	HasCreatedProfile bool `dynamodbav:"hasCreatedProfile" json:"hasCreatedProfile"`

	// A map from an opening module id to the user's progress on that opening module
	OpeningProgress map[string]*UserOpeningModule `dynamodbav:"openingProgress" json:"openingProgress"`

	// A map from a tutorial name to a boolean indicating whether the user has completed that tutorial
	Tutorials map[string]bool `dynamodbav:"tutorials" json:"tutorials"`

	// A map from a time period to the number of minutes the user has spent on tasks in that time period.
	// Non-Dojo tasks are not included.
	MinutesSpent map[string]int `dynamodbav:"minutesSpent" json:"minutesSpent"`
}

// UserOpeningModule represents a user's progress on a specific opening module
type UserOpeningModule struct {
	// A list of booleans indicating whether the current exercise is complete
	Exercises []bool `dynamodbav:"exercises,omitempty" json:"exercises,omitempty"`
}

// GetRatings returns the start and current ratings in the user's preferred rating system.
func (u *User) GetRatings() (int, int) {
	if u == nil {
		return 0, 0
	}

	r := u.Ratings[u.RatingSystem]
	return r.StartRating, r.CurrentRating
}

// CalculateScore returns the user's score for the given list of requirements. The
// user's current cohort is used when calculating the score.
func (u *User) CalculateScore(requirements []*Requirement) float32 {
	if u == nil {
		return 0
	}
	var score float32 = 0
	for _, requirement := range requirements {
		p, _ := u.Progress[requirement.Id]
		score += requirement.CalculateScore(u.DojoCohort, p)
	}
	return score
}

func (u *User) GetRatingChange() int {
	start, current := u.GetRatings()
	if start == 0 {
		return 0
	}
	return current - start
}

func (u *User) getDisplayName() string {
	if u == nil {
		return ""
	}
	return u.DisplayName
}

func (u *User) getDiscordName() string {
	if u == nil {
		return ""
	}
	return u.DiscordUsername
}

func (u *User) getRating(rs RatingSystem) (string, bool) {
	if u == nil || u.Ratings == nil || u.Ratings[rs] == nil {
		return "", false
	}
	rating := u.Ratings[rs]
	return rating.Username, rating.HideUsername
}

// UserUpdate contains pointers to fields included in the update of a user record. If a field
// should not be updated in a particular request, then it is set to nil.
// Some fields from the User type are removed as they cannot be updated. Other fields
// are ignored by the json encoder because they cannot be manually updated by the user.
type UserUpdate struct {
	// The user's email address used to log into the wix site
	WixEmail *string `dynamodbav:"wixEmail,omitempty" json:"wixEmail,omitempty"`

	// Whether the user is forbidden from accessing the site due to
	// missing Wix subscription. Cannot be passed by the user.
	IsForbidden *bool `dynamodbav:"isForbidden,omitempty" json:"-"`

	// The user's preferred display name on the site
	DisplayName *string `dynamodbav:"displayName,omitempty" json:"displayName,omitempty"`

	// The user's Discord username
	DiscordUsername *string `dynamodbav:"discordUsername,omitempty" json:"discordUsername,omitempty"`

	// A search field of the form display:DisplayName_discord:DiscordUsername_[ratingSystem:RatingSystem.Username]
	// Stored in all lowercase. Each rating's username is only included if its HideUsername field is false.
	// Ex: display:jackst_discord:jackstenglein_chesscom:jackstenglein_uscf:12345
	// Cannot be manually passed by the user and is automatically set when any of the inner fields are updated.
	SearchKey *string `dynamodbav:"searchKey,omitempty" json:"-"`

	// The user's bio
	Bio *string `dynamodbav:"bio,omitempty" json:"bio,omitempty"`

	// The user's preferred rating system
	RatingSystem *RatingSystem `dynamodbav:"ratingSystem,omitempty" json:"ratingSystem,omitempty"`

	// The user's ratings in each rating system
	Ratings *map[RatingSystem]*Rating `dynamodbav:"ratings,omitempty" json:"ratings,omitempty"`

	// The user's Dojo cohort
	DojoCohort *DojoCohort `dynamodbav:"dojoCohort,omitempty" json:"dojoCohort,omitempty"`

	// Whether to disable notifications when a user's meeting is booked
	DisableBookingNotifications *bool `dynamodbav:"disableBookingNotifications,omitempty" json:"disableBookingNotifications,omitempty"`

	// Whether to disable notifications when a user's meeting is cancelled
	DisableCancellationNotifications *bool `dynamodbav:"disableCancellationNotifications,omitempty" json:"disableCancellationNotifications,omitempty"`

	// The number of times the user has graduated.
	// Cannot be manually passed by the user. The user should instead call the user/graduate function
	NumberOfGraduations *int `dynamodbav:"numberOfGraduations,omitempty" json:"-"`

	// The cohort the user most recently graduated from.
	// Cannot be manually passed by the user. The user should instead call the user/graduate function
	PreviousCohort *DojoCohort `dynamodbav:"previousCohort,omitempty" json:"-"`

	// The cohorts the user has graduated from
	// Cannot be manually passed by the user. The user should instead call the user/graduate function
	GraduationCohorts *[]DojoCohort `dynamodbav:"graduationCohorts,omitempty" json:"-"`

	// When the user most recently graduated
	// Cannot be manually passed by the user. The user should instead call the user/graduate function
	LastGraduatedAt *string `dynamodbav:"lastGraduatedAt,omitempty" json:"-"`

	// When the user was most recently updated (not including nightly rating updates)
	// Cannot be manually passed by the user and is updated automatically by the server
	UpdatedAt *string `dynamodbav:"updatedAt,omitempty" json:"-"`

	// Maps requirement ids to RequirementProgress objects.
	// Cannot be manually passed by the user. The user should instead call the user/progress/timeline function
	Progress *map[string]*RequirementProgress `dynamodbav:"progress,omitempty" json:"-"`

	// Whether to enable dark mode on the site
	EnableDarkMode *bool `dynamodbav:"enableDarkMode,omitempty" json:"enableDarkMode,omitempty"`

	// The user's preferred timezone on the calendar
	TimezoneOverride *string `dynamodbav:"timezoneOverride,omitempty" json:"timezoneOverride,omitempty"`

	// The user's list of custom tasks
	CustomTasks *[]*CustomTask `dynamodbav:"customTasks,omitempty" json:"customTasks,omitempty"`

	// Whether the user has finished creating their profile
	HasCreatedProfile *bool `dynamodbav:"hasCreatedProfile,omitempty" json:"hasCreatedProfile,omitempty"`

	// A map from an opening id to the user's progress on that opening
	OpeningProgress *map[string]*UserOpeningModule `dynamodbav:"openingProgress,omitempty" json:"openingProgress,omitempty"`

	// A map from a tutorial name to a boolean indicating whether the user has completed that tutorial
	Tutorials *map[string]bool `dynamodbav:"tutorials,omitempty" json:"tutorials,omitempty"`

	// A map from a time period to the number of minutes the user has spent on tasks in that time period.
	// Non-Dojo tasks are not included.
	MinutesSpent *map[string]int `dynamodbav:"minutesSpent,omitempty" json:"minutesSpent,omitempty"`
}

// AutopickCohort sets the UserUpdate's dojoCohort field based on the values of the ratingSystem
// and current rating fields. The chosen cohort is returned.
func (u *UserUpdate) AutopickCohort() DojoCohort {
	if u == nil || u.RatingSystem == nil || u.Ratings == nil {
		return NoCohort
	}

	rating, ok := (*u.Ratings)[*u.RatingSystem]
	if !ok {
		return NoCohort
	}

	currentRating := rating.CurrentRating
	cohort := getCohort(*u.RatingSystem, currentRating)
	u.DojoCohort = &cohort
	return cohort
}

func (u *UserUpdate) getDisplayName() string {
	if u == nil {
		return ""
	}
	if u.DisplayName == nil {
		return ""
	}
	return *u.DisplayName
}

func (u *UserUpdate) getDiscordName() string {
	if u == nil {
		return ""
	}
	if u.DiscordUsername == nil {
		return ""
	}
	return *u.DiscordUsername
}

func (u *UserUpdate) getRating(rs RatingSystem) (string, bool) {
	if u == nil || u.Ratings == nil || (*u.Ratings)[rs] == nil {
		return "", false
	}
	rating := (*u.Ratings)[rs]
	return rating.Username, rating.HideUsername
}

func GetSearchKey(user *User, update *UserUpdate) string {
	if user == nil && update == nil {
		return ""
	}

	displayName, discordName := update.getDisplayName(), update.getDiscordName()
	if displayName == "" {
		displayName = user.getDisplayName()
	}
	if discordName == "" {
		discordName = user.getDiscordName()
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("display:%s_discord:%s", displayName, discordName))

	for _, rs := range ratingSystems {
		username, hideUsername := update.getRating(rs)
		if username == "" {
			username, hideUsername = user.getRating(rs)
		}

		if username != "" && !hideUsername {
			sb.WriteString(fmt.Sprintf("_%s:%s", rs, username))
		}
	}

	return strings.ToLower(sb.String())
}

type UserCreator interface {
	// CreateUser creates a new User object with the provided information.
	CreateUser(username, email, name string) (*User, error)
}

type UserGetter interface {
	// GetUser returns the User object with the provided username.
	GetUser(username string) (*User, error)
}

type UserLister interface {
	// ListUsersByCohort returns a list of Users in the provided cohort, up to 1MB of data.
	// startKey is an optional parameter that can be used to perform pagination.
	// The list of users and the next start key are returned.
	ListUsersByCohort(cohort DojoCohort, startKey string) ([]*User, string, error)

	// SearchUsers returns a list of users whose SearchKey field matches the provided query string and fields.
	// fields should be an array like ["display", "discord", "chesscom"] etc. The special value "all" can be
	// provided to indicate all fields are a match.
	SearchUsers(query string, fields []string, startKey string) ([]*User, string, error)
}

type UserUpdater interface {
	UserGetter

	// UpdateUser applies the specified update to the user with the provided username.
	UpdateUser(username string, update *UserUpdate) (*User, error)

	// FindUsersByWixEmail returns a list of users with the given wixEmail.
	FindUsersByWixEmail(wixEmail, startKey string) ([]*User, string, error)
}

type UserProgressUpdater interface {
	UserUpdater
	RequirementGetter
	TimelineEditor

	// UpdateUserProgress sets the given progress entry in the user's progress map.
	UpdateUserProgress(username string, progressEntry *RequirementProgress) (*User, error)
}

type AdminUserLister interface {
	UserGetter

	// ScanUsers returns a list of all Users in the database, up to 1MB of data.
	// startKey is an optional parameter that can be used to perform pagination.
	// The list of users and the next start key are returned.
	ScanUsers(startKey string) ([]*User, string, error)
}

// CreateUser creates a new User object with the provided information.
func (repo *dynamoRepository) CreateUser(username, email, name string) (*User, error) {
	user := &User{
		Username:   username,
		Email:      email,
		WixEmail:   email,
		Name:       name,
		CreatedAt:  time.Now().Format(time.RFC3339),
		DojoCohort: NoCohort,
	}

	err := repo.SetUserConditional(user, aws.String("attribute_not_exists(username)"))
	return user, err
}

// SetUserConditional saves the provided User object in the database using an optional condition statement.
func (repo *dynamoRepository) SetUserConditional(user *User, condition *string) error {
	if user.Username == "STATISTICS" {
		return errors.New(403, "Invalid request: cannot use username `STATISTICS`", "")
	}

	user.UpdatedAt = time.Now().Format(time.RFC3339)
	item, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal user", err)
	}

	// Hack to work around https://github.com/aws/aws-sdk-go/issues/682
	emptyMap := make(map[string]*dynamodb.AttributeValue)
	if len(user.Progress) == 0 {
		item["progress"] = &dynamodb.AttributeValue{M: emptyMap}
	}
	if len(user.Ratings) == 0 {
		item["ratings"] = &dynamodb.AttributeValue{M: emptyMap}
	}
	if len(user.RatingHistories) == 0 {
		item["ratingHistories"] = &dynamodb.AttributeValue{M: emptyMap}
	}

	input := &dynamodb.PutItemInput{
		ConditionExpression: condition,
		Item:                item,
		TableName:           aws.String(userTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// UpdateUser applies the specified update to the user with the provided username.
func (repo *dynamoRepository) UpdateUser(username string, update *UserUpdate) (*User, error) {
	if username == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: cannot update username `STATISTICS`", "")
	}

	update.UpdatedAt = aws.String(time.Now().Format(time.RFC3339))

	encoder := dynamodbattribute.NewEncoder()
	encoder.NullEmptyString = false
	av, err := encoder.Encode(update)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal user update", err)
	}

	builder := expression.UpdateBuilder{}
	for k, v := range av.M {
		builder = builder.Set(expression.Name(k), expression.Value(v))
	}

	expr, err := expression.NewBuilder().WithUpdate(builder).Build()
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB expression building error", err)
	}

	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		UpdateExpression:          expr.Update(),
		ConditionExpression:       aws.String("attribute_exists(username)"),
		TableName:                 aws.String(userTable),
		ReturnValues:              aws.String("ALL_NEW"),
	}
	result, err := repo.svc.UpdateItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB UpdateItem failure", err)
	}

	user := User{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &user); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal UpdateItem result", err)
	}
	return &user, nil
}

// UpdateUserProgress sets the given progress entry in the user's progress map.
func (repo *dynamoRepository) UpdateUserProgress(username string, progressEntry *RequirementProgress) (*User, error) {
	if username == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: cannot update username `STATISTICS`", "")
	}

	pav, err := dynamodbattribute.Marshal(progressEntry)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal progress entry", err)
	}

	updatedAt := time.Now().Format(time.RFC3339)
	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		UpdateExpression: aws.String("SET #p.#id = :p, #u = :u"),
		ExpressionAttributeNames: map[string]*string{
			"#p":  aws.String("progress"),
			"#id": aws.String(progressEntry.RequirementId),
			"#u":  aws.String("updatedAt"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":p": pav,
			":u": {S: aws.String(updatedAt)},
		},
		ConditionExpression: aws.String("attribute_exists(username)"),
		ReturnValues:        aws.String("ALL_NEW"),
		TableName:           aws.String(userTable),
	}
	result, err := repo.svc.UpdateItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(404, "Invalid request: user does not exist", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}

	user := User{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &user); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal UpdateItem result", err)
	}
	return &user, nil
}

// GetUser returns the User object with the provided username.
func (repo *dynamoRepository) GetUser(username string) (*User, error) {
	if username == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: cannot get username `STATISTICS`", "")
	}

	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		TableName: aws.String(userTable),
	}

	user := User{}
	if err := repo.getItem(input, &user); err != nil {
		return nil, err
	}
	return &user, nil
}

const ONE_MONTH_AGO = -time.Hour * 24 * 31

// ListUsersByCohort returns a list of Users in the provided cohort, up to 1MB of data.
// startKey is an optional parameter that can be used to perform pagination. Only active
// users are returned (updated within the past month).
// The list of users and the next start key are returned.
func (repo *dynamoRepository) ListUsersByCohort(cohort DojoCohort, startKey string) ([]*User, string, error) {
	if cohort == "STATISTICS" {
		return nil, "", errors.New(403, "Invalid request: cannot get cohort `STATISTICS`", "")
	}

	monthAgo := time.Now().Add(ONE_MONTH_AGO).Format(time.RFC3339)
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#cohort = :cohort"),
		ExpressionAttributeNames: map[string]*string{
			"#cohort": aws.String("dojoCohort"),
			"#u":      aws.String("updatedAt"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":cohort": {S: aws.String(string(cohort))},
			":u":      {S: aws.String(monthAgo)},
		},
		FilterExpression: aws.String("#u >= :u"),
		IndexName:        aws.String("CohortIdx"),
		TableName:        aws.String(userTable),
	}

	var users []*User
	lastKey, err := repo.query(input, startKey, &users)
	if err != nil {
		return nil, "", err
	}
	return users, lastKey, nil
}

// ScanUsers returns a list of all Users in the database, up to 1MB of data.
// startKey is an optional parameter that can be used to perform pagination.
// The list of users and the next start key are returned.
func (repo *dynamoRepository) ScanUsers(startKey string) ([]*User, string, error) {
	input := &dynamodb.ScanInput{
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":statistics": {
				S: aws.String("STATISTICS"),
			},
		},
		FilterExpression: aws.String("username <> :statistics"),
		TableName:        aws.String(userTable),
	}

	var users []*User
	lastKey, err := repo.scan(input, startKey, &users)
	if err != nil {
		return nil, "", err
	}
	return users, lastKey, nil
}

const ratingsProjection = "username, dojoCohort, updatedAt, progress, minutesSpent, ratingSystem, ratings, ratingHistories"

// ListUserRatings returns a list of Users matching the provided cohort, up to 1MB of data.
// Only the fields necessary for the rating/statistics update are returned.
// startkey is an optional parameter that can be used to perform pagination.
// The list of users and the next start key are returned.
func (repo *dynamoRepository) ListUserRatings(cohort DojoCohort, startKey string) ([]*User, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#cohort = :cohort"),
		ExpressionAttributeNames: map[string]*string{
			"#cohort": aws.String("dojoCohort"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":cohort": {S: aws.String(string(cohort))},
		},
		ProjectionExpression: aws.String(ratingsProjection),
		IndexName:            aws.String("CohortIdx"),
		TableName:            aws.String(userTable),
	}

	var users []*User
	lastKey, err := repo.query(input, startKey, &users)
	if err != nil {
		return nil, "", err
	}
	return users, lastKey, nil
}

func (repo *dynamoRepository) UpdateUserRatings(users []*User) error {
	if len(users) > 25 {
		return errors.New(500, "Temporary server error", "UpdateUserRatings has max limit of 25 users")
	}

	statements := make([]*dynamodb.BatchStatementRequest, 0, len(users))
	for _, user := range users {
		params, err := dynamodbattribute.MarshalList([]interface{}{user.Ratings, user.RatingHistories, user.Username})
		if err != nil {
			return errors.Wrap(500, "Temporary server error", "Failed to marshal user.Ratings", err)
		}

		statement := &dynamodb.BatchStatementRequest{
			Statement: aws.String(fmt.Sprintf(
				"UPDATE \"%s\" SET ratings=? SET ratingHistories=? WHERE username=?", userTable,
			)),
			Parameters: params,
		}
		statements = append(statements, statement)
	}

	input := &dynamodb.BatchExecuteStatementInput{
		Statements: statements,
	}
	log.Debugf("Batch execute statement input: %v", input)
	output, err := repo.svc.BatchExecuteStatement(input)
	log.Debugf("Batch execute statement output: %v", output)

	return errors.Wrap(500, "Temporary server error", "Failed BatchExecuteStatement", err)
}

const (
	Last7Days   = "LAST_7_DAYS"
	Last30Days  = "LAST_30_DAYS"
	Last90Days  = "LAST_90_DAYS"
	Last365Days = "LAST_365_DAYS"
)

// UpdateUserTimes uses DynamoDB PartiQL to update the minutesSpent field on the provided users
func (repo *dynamoRepository) UpdateUserTimes(users []*User) error {
	if len(users) > 25 {
		return errors.New(500, "Temporary server error", "UpdateUserTimes has max limit of 25 users")
	}

	var sb strings.Builder
	statements := make([]*dynamodb.BatchStatementRequest, 0, len(users))
	for _, user := range users {
		sb.WriteString(fmt.Sprintf("UPDATE \"%s\"", userTable))
		sb.WriteString(fmt.Sprintf(" SET minutesSpent={'%s': %d, '%s': %d, '%s': %d, '%s': %d}",
			Last7Days, user.MinutesSpent[Last7Days],
			Last30Days, user.MinutesSpent[Last30Days],
			Last90Days, user.MinutesSpent[Last90Days],
			Last365Days, user.MinutesSpent[Last365Days],
		))
		sb.WriteString(fmt.Sprintf(" WHERE username='%s'", user.Username))

		statement := &dynamodb.BatchStatementRequest{
			Statement: aws.String(sb.String()),
		}
		statements = append(statements, statement)

		sb.Reset()
	}

	input := &dynamodb.BatchExecuteStatementInput{
		Statements: statements,
	}
	log.Debugf("Batch execute statement input: %v", input)
	output, err := repo.svc.BatchExecuteStatement(input)
	log.Debugf("Batch execute statement output: %v", output)

	return errors.Wrap(500, "Temporary server error", "Failed BatchExecuteStatement", err)
}

// RecordGameCreation updates the given user to increase their game creation stats.
func (repo *dynamoRepository) RecordGameCreation(user *User, amount int) error {
	if user.GamesCreated == nil {
		user.GamesCreated = make(map[DojoCohort]int)
	}

	count, _ := user.GamesCreated[user.DojoCohort]
	user.GamesCreated[user.DojoCohort] = count + amount
	return repo.SetUserConditional(user, nil)
}

// DeleteUser deletes the user with the given username
func (repo *dynamoRepository) DeleteUser(username string) error {
	if username == "STATISTICS" {
		return errors.New(403, "Invalid request: cannot delete username `STATISTICS`", "")
	}

	input := &dynamodb.DeleteItemInput{
		ConditionExpression: aws.String("attribute_exists(username)"),
		Key: map[string]*dynamodb.AttributeValue{
			"username": {S: aws.String(username)},
		},
		TableName: aws.String(userTable),
	}
	_, err := repo.svc.DeleteItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed DynamoDB DeleteItem", err)
}

// FindUsersByWixEmail returns a list of users with the given wixEmail.
func (repo *dynamoRepository) FindUsersByWixEmail(wixEmail, startKey string) ([]*User, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#wixEmail = :wixEmail"),
		ExpressionAttributeNames: map[string]*string{
			"#wixEmail": aws.String("wixEmail"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":wixEmail": {S: aws.String(wixEmail)},
		},
		IndexName: aws.String("WixEmailIndex"),
		TableName: aws.String(userTable),
	}

	var users []*User
	lastKey, err := repo.query(input, startKey, &users)
	if err != nil {
		return nil, "", err
	}
	return users, lastKey, nil
}

// SearchUsers returns a list of users whose SearchKey field matches the provided query string and fields.
// fields should be an array like ["display", "discord", "chesscom"] etc. The special value "all" can be
// provided to indicate all fields are a match.
func (repo *dynamoRepository) SearchUsers(query string, fields []string, startKey string) ([]*User, string, error) {
	query = strings.ToLower(query)

	var filter strings.Builder
	expressionAttrNames := map[string]*string{
		"#search": aws.String("searchKey"),
	}
	expressionAttrValues := make(map[string]*dynamodb.AttributeValue)

	for i, field := range fields {
		var attrValue *dynamodb.AttributeValue

		field = strings.ToLower(field)
		if field == "all" {
			attrValue = &dynamodb.AttributeValue{S: aws.String(query)}
		} else {
			attrValue = &dynamodb.AttributeValue{S: aws.String(fmt.Sprintf("%s:%s", field, query))}
		}

		if i > 0 {
			filter.WriteString(" OR ")
		}
		filter.WriteString(fmt.Sprintf("contains (#search, :field%d)", i))
		expressionAttrValues[fmt.Sprintf(":field%d", i)] = attrValue
	}

	input := &dynamodb.ScanInput{
		FilterExpression:          aws.String(filter.String()),
		ExpressionAttributeNames:  expressionAttrNames,
		ExpressionAttributeValues: expressionAttrValues,
		IndexName:                 aws.String("SearchIdx"),
		TableName:                 aws.String(userTable),
	}

	var users []*User
	lastKey, err := repo.scan(input, startKey, &users)
	if err != nil {
		return nil, "", err
	}
	return users, lastKey, nil
}
