package database

import (
	"encoding/json"
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

var cohorts = []DojoCohort{
	"0-400",
	"400-600",
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

const AllCohorts = "ALL_COHORTS"

// IsValidCohort returns true if the provided cohort is valid.
func IsValidCohort(c DojoCohort) bool {
	if c == AllCohorts {
		return true
	}
	for _, c2 := range cohorts {
		if c == c2 {
			return true
		}
	}
	return false
}

type User struct {
	// The user's Cognito username. Uniquely identifies a user
	Username string `dynamodbav:"username" json:"username"`

	// The user's email address
	Email string `dynamodbav:"email" json:"-"`

	// The name of the user
	Name string `dynamodbav:"name" json:"-"`

	// The user's Discord username
	DiscordUsername string `dynamodbav:"discordUsername" json:"discordUsername"`

	// The user's bio
	Bio string `dynamodbav:"bio" json:"bio"`

	// The user's preferred rating system
	RatingSystem string `dynamodbav:"ratingSystem" json:"ratingSystem"`

	// The user's Chess.com username
	ChesscomUsername string `dynamodbav:"chesscomUsername" json:"chesscomUsername"`

	// The user's Lichess username
	LichessUsername string `dynamodbav:"lichessUsername" json:"lichessUsername"`

	// The user's FIDE Id
	FideId string `dynamodbav:"fideId" json:"fideId"`

	// The user's USCF Id
	UscfId string `dynamodbav:"uscfId" json:"uscfId"`

	// The user's starting Chess.com rating
	StartChesscomRating int `dynamodbav:"startChesscomRating" json:"startChesscomRating"`

	// The user's current Chess.com rating
	CurrentChesscomRating int `dynamodbav:"currentChesscomRating" json:"currentChesscomRating"`

	// The user's starting Lichess rating
	StartLichessRating int `dynamodbav:"startLichessRating" json:"startLichessRating"`

	// The user's current Lichess rating
	CurrentLichessRating int `dynamodbav:"currentLichessRating" json:"currentLichessRating"`

	// The user's starting FIDE rating
	StartFideRating int `dynamodbav:"startFideRating" json:"startFideRating"`

	// The user's current FIDE rating
	CurrentFideRating int `dynamodbav:"currentFideRating" json:"currentFideRating"`

	// The user's starting USCF rating
	StartUscfRating int `dynamodbav:"startUscfRating" json:"startUscfRating"`

	// The user's current Uscf rating
	CurrentUscfRating int `dynamodbav:"currentUscfRating" json:"currentUscfRating"`

	// The user's Dojo cohort
	DojoCohort DojoCohort `dynamodbav:"dojoCohort" json:"dojoCohort"`

	// Maps requirement ids to RequirementProgress objects
	Progress map[string]*RequirementProgress `dynamodbav:"progress" json:"progress"`

	// A list of RequirementProgress objects forming the user's activity
	Timeline []*TimelineEntry `dynamodbav:"timeline" json:"timeline"`

	// Whether to disable notifications when a user's meeting is booked
	DisableBookingNotifications bool `dynamodbav:"disableBookingNotifications" json:"disableBookingNotifications"`

	// Whether to disable notifications when a user's meeting is cancelled
	DisableCancellationNotifications bool `dynamodbav:"disableCancellationNotifications" json:"disableCancellationNotifications"`

	// The number of games the user has created
	GamesCreated map[DojoCohort]int `dynamodbav:"gamesCreated" json:"gamesCreated"`

	// Whether the user is an admin or not
	IsAdmin bool `dynamodbav:"isAdmin" json:"isAdmin"`

	// When the user first created their account
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
}

// UserUpdate contains pointers to fields included in the update of a user record. If a field
// should not be updated in a particular request, then it is set to nil.
// Some fields from the User type are removed as they cannot be manually updated by the user.
type UserUpdate struct {
	// The user's Discord username
	DiscordUsername *string `dynamodbav:"discordUsername,omitempty" json:"discordUsername,omitempty"`

	// The user's bio
	Bio *string `dynamodbav:"bio,omitempty" json:"bio,omitempty"`

	// The user's preferred rating system
	RatingSystem *string `dynamodbav:"ratingSystem,omitempty" json:"ratingSystem,omitempty"`

	// The user's Chess.com username
	ChesscomUsername *string `dynamodbav:"chesscomUsername,omitempty" json:"chesscomUsername,omitempty"`

	// The user's Lichess username
	LichessUsername *string `dynamodbav:"lichessUsername,omitempty" json:"lichessUsername,omitempty"`

	// The user's FIDE Id
	FideId *string `dynamodbav:"fideId,omitempty" json:"fideId,omitempty"`

	// The user's USCF Id
	UscfId *string `dynamodbav:"uscfId,omitempty" json:"uscfId,omitempty"`

	// The user's starting Chess.com rating
	StartChesscomRating *int `dynamodbav:"startChesscomRating,omitempty" json:"startChesscomRating,omitempty"`

	// The user's starting Lichess rating
	StartLichessRating *int `dynamodbav:"startLichessRating,omitempty" json:"startLichessRating,omitempty"`

	// The user's starting FIDE rating
	StartFideRating *int `dynamodbav:"startFideRating,omitempty" json:"startFideRating,omitempty"`

	// The user's starting USCF rating
	StartUscfRating *int `dynamodbav:"startUscfRating,omitempty" json:"startUscfRating,omitempty"`

	// The user's Dojo cohort
	DojoCohort *DojoCohort `dynamodbav:"dojoCohort,omitempty" json:"dojoCohort,omitempty"`

	// Whether to disable notifications when a user's meeting is booked
	// if omitempty is added it will stop false booleans from getting picked up during marshalmap
	DisableBookingNotifications *bool `dynamodbav:"disableBookingNotifications,omitempty" json:"disableBookingNotifications,omitempty"`

	// Whether to disable notifications when a user's meeting is cancelled
	// if omitempty is added it will stop false booleans from getting picked up during marshalmap
	DisableCancellationNotifications *bool `dynamodbav:"disableCancellationNotifications,omitempty" json:"disableCancellationNotifications,omitempty"`
}

type UserCreator interface {
	// CreateUser creates a new User object with the provided information.
	CreateUser(username, email, name string) (*User, error)
}

type UserGetter interface {
	// GetUser returns the User object with the provided username.
	GetUser(username string) (*User, error)
}

type UserUpdater interface {
	// UpdateUser applies the specified update to the user with the provided username.
	UpdateUser(username string, update *UserUpdate) error
}

type UserProgressUpdater interface {
	UserGetter
	RequirementGetter

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
		Username:  username,
		Email:     email,
		Name:      name,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	err := repo.setUserConditional(user, aws.String("attribute_not_exists(username)"))
	return user, err
}

// SetUser saves the provided User object in the database.
func (repo *dynamoRepository) SetUser(user *User) error {
	return repo.setUserConditional(user, nil)
}

// setUserConditional saves the provided User object in the database using an optional condition statement.
func (repo *dynamoRepository) setUserConditional(user *User, condition *string) error {
	item, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal user", err)
	}

	// Hack to work around https://github.com/aws/aws-sdk-go/issues/682
	if len(user.Progress) == 0 {
		emptyMap := make(map[string]*dynamodb.AttributeValue)
		item["progress"] = &dynamodb.AttributeValue{M: emptyMap}
	}
	if len(user.Timeline) == 0 {
		emptyList := make([]*dynamodb.AttributeValue, 0)
		item["timeline"] = &dynamodb.AttributeValue{L: emptyList}
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
func (repo *dynamoRepository) UpdateUser(username string, update *UserUpdate) error {
	av, err := dynamodbattribute.MarshalMap(update)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal user update", err)
	}

	builder := expression.UpdateBuilder{}
	for k, v := range av {
		builder = builder.Set(expression.Name(k), expression.Value(v))
	}

	expr, err := expression.NewBuilder().WithUpdate(builder).Build()
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "DynamoDB expression building error", err)
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
	}
	_, err = repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB UpdateItem failure", err)
}

// UpdateUserProgress sets the given progress entry in the user's progress map and appends
// the given timeline entry to the user's timeline.
func (repo *dynamoRepository) UpdateUserProgress(username string, progressEntry *RequirementProgress, timelineEntry *TimelineEntry) (*User, error) {
	pav, err := dynamodbattribute.Marshal(progressEntry)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal progress entry", err)
	}

	tav, err := dynamodbattribute.Marshal(timelineEntry)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal timeline entry", err)
	}

	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		UpdateExpression: aws.String("SET #p.#id = :p, #t = list_append(#t, :t)"),
		ExpressionAttributeNames: map[string]*string{
			"#p":  aws.String("progress"),
			"#id": aws.String(progressEntry.RequirementId),
			"#t":  aws.String("timeline"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":p": pav,
			":t": {L: []*dynamodb.AttributeValue{tav}},
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
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		TableName: aws.String(userTable),
	}

	result, err := repo.svc.GetItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}

	if result.Item == nil {
		return nil, errors.New(404, "Invalid request: user not found", "GetUser result.Item is nil")
	}

	user := User{}
	err = dynamodbattribute.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetUser result", err)
	}
	return &user, nil
}

// ScanUsers returns a list of all Users in the database, up to 1MB of data.
// startKey is an optional parameter that can be used to perform pagination.
// The list of users and the next start key are returned.
func (repo *dynamoRepository) ScanUsers(startKey string) ([]*User, string, error) {
	input := &dynamodb.ScanInput{
		TableName: aws.String(userTable),
	}
	return repo.scanUsersWithInput(input, startKey)
}

const ratingsProjection = "username, chesscomUsername, lichessUsername, fideId, uscfId, startChesscomRating, " +
	"currentChesscomRating, startLichessRating, currentLichessRating, startFideRating, currentFideRating, " +
	"startUscfRating, currentUscfRating"

// ScanUserRatings returns a list of all Users in the database, up to 1MB of data.
// Only the usernames and ratings are returned.
// startkey is an optional parameter that can be used to perform pagination.
// The list of users and the next start key are returned.
func (repo *dynamoRepository) ScanUserRatings(startKey string) ([]*User, string, error) {
	input := &dynamodb.ScanInput{
		ProjectionExpression: aws.String(ratingsProjection),
		TableName:            aws.String(userTable),
	}
	return repo.scanUsersWithInput(input, startKey)
}

// scanUsersWithInput returns a list of all Users in the database, with up to 1MB of data in each page.
// input is required and is the ScanInput to run.
// startKey is an optional parameter that can be used to perform pagination.
// The list of users and the next start key is returned.
func (repo *dynamoRepository) scanUsersWithInput(input *dynamodb.ScanInput, startKey string) ([]*User, string, error) {
	if startKey != "" {
		var exclusiveStartKey map[string]*dynamodb.AttributeValue
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
		}
		input.SetExclusiveStartKey(exclusiveStartKey)
	}

	result, err := repo.svc.Scan(input)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "DynamoDB Scan failure", err)
	}

	var users []*User
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &users)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Failed to unmarshal ScanUsers result", err)
	}

	var lastKey string
	if len(result.LastEvaluatedKey) > 0 {
		b, err := json.Marshal(result.LastEvaluatedKey)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal ScanUsers LastEvaluatedKey", err)
		}
		lastKey = string(b)
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
	output, err := repo.svc.BatchExecuteStatement(input)
	log.Debugf("Batch execute statement output: ", output)

	return errors.Wrap(500, "Temporary server error", "Failed BatchExecuteStatement", err)
}

// RecordGameCreation updates the given user to increase their game creation stats.
func (repo *dynamoRepository) RecordGameCreation(user *User) error {
	if user.GamesCreated == nil {
		user.GamesCreated = make(map[DojoCohort]int)
	}

	count, _ := user.GamesCreated[user.DojoCohort]
	user.GamesCreated[user.DojoCohort] = count + 1
	return repo.SetUser(user)
}
