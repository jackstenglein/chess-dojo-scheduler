package database

import (
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type UserCreator interface {
	// CreateUser creates a new User object with the provided information.
	CreateUser(username, email, name string) (*User, error)
}

// dynamoRepository implements a database using AWS DynamoDB.
type dynamoRepository struct {
	svc *dynamodb.DynamoDB
}

// DynamoDB implements the UserRepository interface using AWS DynamoDB
// as the data store.
var DynamoDB = &dynamoRepository{
	svc: dynamodb.New(session.New()),
}

var userTable = os.Getenv("stage") + "-users"

// CreateUser creates a new User object with the provided information.
func (repo *dynamoRepository) CreateUser(username, email, name string) (*User, error) {
	input := &dynamodb.PutItemInput{
		ConditionExpression: aws.String("attribute_not_exists(username)"),
		Item: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
			"email": {
				S: aws.String(email),
			},
			"name": {
				S: aws.String(name),
			},
		},
		TableName: aws.String(userTable),
	}

	_, err := repo.svc.PutItem(input)
	if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
		return nil, errors.Wrap(400, "Invalid request: user already exists", "DynamoDB conditional check failed", aerr)
	}

	user := &User{
		Username: username,
		Email:    email,
		Name:     name,
	}
	return user, errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}
