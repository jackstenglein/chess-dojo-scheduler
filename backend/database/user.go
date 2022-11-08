package database

import (
	"encoding/json"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
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

const allCohorts = "ALL_COHORTS"

// IsValidCohort returns true if the provided cohort is valid.
func IsValidCohort(c DojoCohort) bool {
	if c == allCohorts {
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
	// Cognito attributes
	Username string `dynamodbav:"username" json:"username"`
	Email    string `dynamodbav:"email" json:"-"`
	Name     string `dynamodbav:"name" json:"-"`

	// Public attributes
	DiscordUsername             string     `dynamodbav:"discordUsername" json:"discordUsername"`
	ChesscomUsername            string     `dynamodbav:"chesscomUsername" json:"chesscomUsername"`
	LichessUsername             string     `dynamodbav:"lichessUsername" json:"lichessUsername"`
	DojoCohort                  DojoCohort `dynamodbav:"dojoCohort" json:"dojoCohort"`
	DisableDiscordNotifications bool       `dynamodbav:"disableDiscordNotifications" json:"disableDiscordNotifications"`

	IsAdmin bool `dynamodbav:"isAdmin" json:"isAdmin"`
}

type UserCreator interface {
	// CreateUser creates a new User object with the provided information.
	CreateUser(username, email, name string) (*User, error)
}

type UserGetter interface {
	// GetUser returns the User object with the provided username.
	GetUser(username string) (*User, error)
}

type UserSetter interface {
	UserGetter

	// SetUser saves the provided User object into the database.
	SetUser(user *User) error
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
		Username: username,
		Email:    email,
		Name:     name,
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

	input := &dynamodb.PutItemInput{
		ConditionExpression: condition,
		Item:                item,
		TableName:           aws.String(userTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
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
	var exclusiveStartKey map[string]*dynamodb.AttributeValue
	if startKey != "" {
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
		}
	}

	input := &dynamodb.ScanInput{
		ExclusiveStartKey: exclusiveStartKey,
		TableName:         aws.String(userTable),
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
