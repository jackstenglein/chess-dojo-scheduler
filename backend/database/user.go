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

	// The user's bio
	Bio string `dynamodbav:"bio" json:"bio"`

	// The user's preferred rating system
	RatingSystem RatingSystem `dynamodbav:"ratingSystem" json:"ratingSystem"`

	// The user's Chess.com username
	ChesscomUsername string `dynamodbav:"chesscomUsername" json:"chesscomUsername"`

	// Whether to hide the user's Chess.com username from other users
	HideChesscomUsername bool `dynamodbav:"hideChesscomUsername" json:"hideChesscomUsername"`

	// The user's starting Chess.com rating
	StartChesscomRating int `dynamodbav:"startChesscomRating" json:"startChesscomRating"`

	// The user's current Chess.com rating
	CurrentChesscomRating int `dynamodbav:"currentChesscomRating" json:"currentChesscomRating"`

	// The user's Lichess username
	LichessUsername string `dynamodbav:"lichessUsername" json:"lichessUsername"`

	// Whether to hide the user's Lichess username from other users
	HideLichessUsername bool `dynamodbav:"hideLichessUsername" json:"hideLichessUsername"`

	// The user's starting Lichess rating
	StartLichessRating int `dynamodbav:"startLichessRating" json:"startLichessRating"`

	// The user's current Lichess rating
	CurrentLichessRating int `dynamodbav:"currentLichessRating" json:"currentLichessRating"`

	// The user's FIDE Id
	FideId string `dynamodbav:"fideId" json:"fideId"`

	// Whether to hide the user's FIDE ID from other users
	HideFideId bool `dynamodbav:"hideFideId" json:"hideFideId"`

	// The user's starting FIDE rating
	StartFideRating int `dynamodbav:"startFideRating" json:"startFideRating"`

	// The user's current FIDE rating
	CurrentFideRating int `dynamodbav:"currentFideRating" json:"currentFideRating"`

	// The user's USCF Id
	UscfId string `dynamodbav:"uscfId" json:"uscfId"`

	// Whether to hide the user's USCF ID from other users
	HideUscfId bool `dynamodbav:"hideUscfId" json:"hideUscfId"`

	// The user's starting USCF rating
	StartUscfRating int `dynamodbav:"startUscfRating" json:"startUscfRating"`

	// The user's current Uscf rating
	CurrentUscfRating int `dynamodbav:"currentUscfRating" json:"currentUscfRating"`

	// The user's ECF Id
	EcfId string `dynamodbav:"ecfId" json:"ecfId"`

	// Whether to hide the user's ECF ID from other users
	HideEcfId bool `dynamodbav:"hideEcfId" json:"hideEcfId"`

	// The user's starting ECF rating
	StartEcfRating int `dynamodbav:"startEcfRating" json:"startEcfRating"`

	// The user's current ECF rating
	CurrentEcfRating int `dynamodbav:"currentEcfRating" json:"currentEcfRating"`

	// The user's CFC id
	CfcId string `dynamodbav:"cfcId" json:"cfcId"`

	// Whether to hide the user's CFC ID from other users
	HideCfcId bool `dynamodbav:"hideCfcId" json:"hideCfcId"`

	// The user's starting CFC rating
	StartCfcRating int `dynamodbav:"startCfcRating" json:"startCfcRating"`

	// The user's current CFC rating
	CurrentCfcRating int `dynamodbav:"currentCfcRating" json:"currentCfcRating"`

	// The user's DWZ id
	DwzId string `dynamodbav:"dwzId" json:"dwzId"`

	// Whether to hide the user's DWZ ID from other users
	HideDwzId bool `dynamodbav:"hideDwzId" json:"hideDwzId"`

	// The user's starting DWZ rating
	StartDwzRating int `dynamodbav:"startDwzRating" json:"startDwzRating"`

	// The user's current DWZ rating
	CurrentDwzRating int `dynamodbav:"currentDwzRating" json:"currentDwzRating"`

	// The user's start custom rating
	StartCustomRating int `dynamodbav:"startCustomRating" json:"startCustomRating"`

	// The user's current custom rating
	CurrentCustomRating int `dynamodbav:"currentCustomRating" json:"currentCustomRating"`

	// The user's Dojo cohort
	DojoCohort DojoCohort `dynamodbav:"dojoCohort" json:"dojoCohort"`

	// Maps requirement ids to RequirementProgress objects
	Progress map[string]*RequirementProgress `dynamodbav:"progress" json:"progress"`

	// A list of RequirementProgress objects forming the user's activity
	// Timeline []*TimelineEntry `dynamodbav:"timeline" json:"timeline"`

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
}

// GetRatings returns the start and current ratings in the user's preferred rating system.
func (u *User) GetRatings() (int, int) {
	if u == nil {
		return 0, 0
	}

	switch u.RatingSystem {
	case Chesscom:
		return u.StartChesscomRating, u.CurrentChesscomRating
	case Lichess:
		return u.StartLichessRating, u.CurrentLichessRating
	case Fide:
		return u.StartFideRating, u.CurrentFideRating
	case Uscf:
		return u.StartUscfRating, u.CurrentUscfRating
	case Ecf:
		return u.StartEcfRating, u.CurrentEcfRating
	case Cfc:
		return u.StartCfcRating, u.CurrentCfcRating
	case Dwz:
		return u.StartDwzRating, u.CurrentDwzRating
	case Custom:
		return u.StartCustomRating, u.CurrentCustomRating
	default:
		return 0, 0
	}
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

	// The user's bio
	Bio *string `dynamodbav:"bio,omitempty" json:"bio,omitempty"`

	// The user's preferred rating system
	RatingSystem *RatingSystem `dynamodbav:"ratingSystem,omitempty" json:"ratingSystem,omitempty"`

	// The user's Chess.com username
	ChesscomUsername *string `dynamodbav:"chesscomUsername,omitempty" json:"chesscomUsername,omitempty"`

	// Whether to hide the user's Chess.com username from other users
	HideChesscomUsername *bool `dynamodbav:"hideChesscomUsername,omitempty" json:"hideChesscomUsername,omitempty"`

	// The user's starting Chess.com rating
	StartChesscomRating *int `dynamodbav:"startChesscomRating,omitempty" json:"startChesscomRating,omitempty"`

	// The user's current Chess.com rating
	// Cannot be manually passed by the user and is updated automatically by the server.
	CurrentChesscomRating *int `dynamodbav:"currentChesscomRating,omitempty" json:"-"`

	// The user's Lichess username
	LichessUsername *string `dynamodbav:"lichessUsername,omitempty" json:"lichessUsername,omitempty"`

	// Whether to hide the user's Lichess username from other users
	HideLichessUsername *bool `dynamodbav:"hideLichessUsername,omitempty" json:"hideLichessUsername,omitempty"`

	// The user's starting Lichess rating
	StartLichessRating *int `dynamodbav:"startLichessRating,omitempty" json:"startLichessRating,omitempty"`

	// The user's current Lichess rating
	// Cannot be manually passed by the user and is updated automatically by the server.
	CurrentLichessRating *int `dynamodbav:"currentLichessRating,omitempty" json:"-"`

	// The user's FIDE Id
	FideId *string `dynamodbav:"fideId,omitempty" json:"fideId,omitempty"`

	// Whether to hide the user's FIDE ID from other users
	HideFideId *bool `dynamodbav:"hideFideId,omitempty" json:"hideFideId,omitempty"`

	// The user's starting FIDE rating
	StartFideRating *int `dynamodbav:"startFideRating,omitempty" json:"startFideRating,omitempty"`

	// The user's current FIDE rating
	// Cannot be manually passed by the user and is updated automatically by the server.
	CurrentFideRating *int `dynamodbav:"currentFideRating,omitempty" json:"-"`

	// The user's USCF Id
	UscfId *string `dynamodbav:"uscfId,omitempty" json:"uscfId,omitempty"`

	// Whether to hide the user's USCF ID from other users
	HideUscfId *bool `dynamodbav:"hideUscfId,omitempty" json:"hideUscfId,omitempty"`

	// The user's starting USCF rating
	StartUscfRating *int `dynamodbav:"startUscfRating,omitempty" json:"startUscfRating,omitempty"`

	// The user's current USCF rating
	// Cannot be manually passed by the user and is updated automatically by the server.
	CurrentUscfRating *int `dynamodbav:"currentUscfRating,omitempty" json:"-"`

	// The user's ECF Id
	EcfId *string `dynamodbav:"ecfId,omitempty" json:"ecfId,omitempty"`

	// Whether to hide the user's ECF ID from other users
	HideEcfId *bool `dynamodbav:"hideEcfId,omitempty" json:"hideEcfId,omitempty"`

	// The user's starting ECF rating
	StartEcfRating *int `dynamodbav:"startEcfRating,omitempty" json:"startEcfRating,omitempty"`

	// The user's current Ecf rating
	// Cannot be manually passed by the user and is updated automatically by the server.
	CurrentEcfRating *int `dynamodbav:"currentEcfRating,omitempty" json:"-"`

	// The user's CFC id
	CfcId *string `dynamodbav:"cfcId,omitempty" json:"cfcId,omitempty"`

	// Whether to hide the user's CFC ID from other users
	HideCfcId *bool `dynamodbav:"hideCfcId,omitempty" json:"hideCfcId,omitempty"`

	// The user's starting CFC rating
	StartCfcRating *int `dynamodbav:"startCfcRating,omitempty" json:"startCfcRating,omitempty"`

	// The user's current CFC rating
	// Cannot be manually passed by the user and is updated automatically by the server.
	CurrentCfcRating *int `dynamodbav:"currentCfcRating,omitempty" json:"-"`

	// The user's DWZ id
	DwzId *string `dynamodbav:"dwzId,omitempty" json:"dwzId,omitempty"`

	// Whether to hide the user's DWZ ID from other users
	HideDwzId *bool `dynamodbav:"hideDwzId,omitempty" json:"hideDwzId,omitempty"`

	// The user's starting DWZ rating
	StartDwzRating *int `dynamodbav:"startDwzRating,omitempty" json:"startDwzRating,omitempty"`

	// The user's current DWZ rating
	// Cannot be manually passed by the user and is updated automatically by the server.
	CurrentDwzRating *int `dynamodbav:"currentDwzRating,omitempty" json:"-"`

	// The user's start custom rating
	StartCustomRating *int `dynamodbav:"startCustomRating,omitempty" json:"startCustomRating,omitempty"`

	// The user's current custom rating
	CurrentCustomRating *int `dynamodbav:"currentCustomRating,omitempty" json:"currentCustomRating,omitempty"`

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

	// A list of RequirementProgress objects forming the user's activity.
	// Cannot be manually passed by the user. The user should instead call the user/progress/timeline function
	// Timeline *[]*TimelineEntry `dynamodbav:"timeline,omitempty" json:"-"`

	// Whether to enable dark mode on the site
	EnableDarkMode *bool `dynamodbav:"enableDarkMode,omitempty" json:"enableDarkMode,omitempty"`

	// The user's preferred timezone on the calendar
	TimezoneOverride *string `dynamodbav:"timezoneOverride,omitempty" json:"timezoneOverride,omitempty"`

	// The user's list of custom tasks
	CustomTasks *[]*CustomTask `dynamodbav:"customTasks,omitempty" json:"customTasks,omitempty"`

	// Whether the user has finished creating their profile
	HasCreatedProfile *bool `dynamodbav:"hasCreatedProfile,omitempty" json:"hasCreatedProfile,omitempty"`
}

// AutopickCohort sets the UserUpdate's dojoCohort field based on the values of the ratingSystem
// and current rating fields. The chosen cohort is returned.
func (u *UserUpdate) AutopickCohort() DojoCohort {
	if u == nil || u.RatingSystem == nil {
		return NoCohort
	}

	var currentRating *int

	switch *u.RatingSystem {
	case Chesscom:
		currentRating = u.CurrentChesscomRating
	case Lichess:
		currentRating = u.CurrentLichessRating
	case Fide:
		currentRating = u.CurrentFideRating
	case Uscf:
		currentRating = u.CurrentUscfRating
	case Ecf:
		currentRating = u.CurrentEcfRating
	case Cfc:
		currentRating = u.CurrentCfcRating
	case Dwz:
		currentRating = u.CurrentDwzRating
	}

	if currentRating == nil {
		return NoCohort
	}

	cohort := getCohort(*u.RatingSystem, *currentRating)
	u.DojoCohort = &cohort
	return cohort
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

	// UpdateUserProgress sets the given progress entry in the user's progress map and appends
	// the given timeline entry to the user's timeline.
	UpdateUserProgress(username string, progressEntry *RequirementProgress, timelineEntry *TimelineEntry) (*User, error)
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
	if len(user.Progress) == 0 {
		emptyMap := make(map[string]*dynamodb.AttributeValue)
		item["progress"] = &dynamodb.AttributeValue{M: emptyMap}
	}
	// if len(user.Timeline) == 0 {
	// 	emptyList := make([]*dynamodb.AttributeValue, 0)
	// 	item["timeline"] = &dynamodb.AttributeValue{L: emptyList}
	// }

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

// UpdateUserProgress sets the given progress entry in the user's progress map and appends
// the given timeline entry to the user's timeline.
func (repo *dynamoRepository) UpdateUserProgress(username string, progressEntry *RequirementProgress, timelineEntry *TimelineEntry) (*User, error) {
	if username == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: cannot update username `STATISTICS`", "")
	}

	pav, err := dynamodbattribute.Marshal(progressEntry)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal progress entry", err)
	}

	tav, err := dynamodbattribute.Marshal(timelineEntry)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal timeline entry", err)
	}

	updatedAt := time.Now().Format(time.RFC3339)
	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		UpdateExpression: aws.String("SET #p.#id = :p, #t = list_append(#t, :t), #u = :u"),
		ExpressionAttributeNames: map[string]*string{
			"#p":  aws.String("progress"),
			"#id": aws.String(progressEntry.RequirementId),
			"#t":  aws.String("timeline"),
			"#u":  aws.String("updatedAt"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":p": pav,
			":t": {L: []*dynamodb.AttributeValue{tav}},
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

const ratingsProjection = "username, dojoCohort, updatedAt, progress, ratingSystem, chesscomUsername, lichessUsername, fideId, " +
	"uscfId, ecfId, cfcId, dwzId, startChesscomRating, currentChesscomRating, startLichessRating, currentLichessRating, startFideRating, " +
	"currentFideRating, startUscfRating, currentUscfRating, startEcfRating, currentEcfRating, startCfcRating, currentCfcRating, " +
	"startDwzRating, currentDwzRating"

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

	var sb strings.Builder
	statements := make([]*dynamodb.BatchStatementRequest, 0, len(users))
	for _, user := range users {
		sb.WriteString(fmt.Sprintf("UPDATE \"%s\"", userTable))
		sb.WriteString(fmt.Sprintf(" SET currentChesscomRating=%d SET currentLichessRating=%d", user.CurrentChesscomRating, user.CurrentLichessRating))
		sb.WriteString(fmt.Sprintf(" SET currentFideRating=%d SET currentUscfRating=%d", user.CurrentFideRating, user.CurrentUscfRating))
		sb.WriteString(fmt.Sprintf(" SET currentEcfRating=%d", user.CurrentEcfRating))
		sb.WriteString(fmt.Sprintf(" SET currentCfcRating=%d", user.CurrentCfcRating))
		sb.WriteString(fmt.Sprintf(" SET currentDwzRating=%d", user.CurrentDwzRating))

		if user.StartChesscomRating == 0 {
			sb.WriteString(fmt.Sprintf(" SET startChesscomRating=%d", user.CurrentChesscomRating))
		}
		if user.StartLichessRating == 0 {
			sb.WriteString(fmt.Sprintf(" SET startLichessRating=%d", user.CurrentLichessRating))
		}
		if user.StartFideRating == 0 {
			sb.WriteString(fmt.Sprintf(" SET startFideRating=%d", user.CurrentFideRating))
		}
		if user.StartUscfRating == 0 {
			sb.WriteString(fmt.Sprintf(" SET startUscfRating=%d", user.CurrentUscfRating))
		}
		if user.StartEcfRating == 0 {
			sb.WriteString(fmt.Sprintf(" SET startEcfRating=%d", user.CurrentEcfRating))
		}
		if user.StartCfcRating == 0 {
			sb.WriteString(fmt.Sprintf(" SET startCfcRating=%d", user.CurrentCfcRating))
		}
		if user.StartDwzRating == 0 {
			sb.WriteString(fmt.Sprintf(" SET startDwzRating=%d", user.CurrentDwzRating))
		}
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
