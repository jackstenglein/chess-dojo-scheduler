package database

import (
	"os"

	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

// dynamoRepository implements a database using AWS DynamoDB.
type dynamoRepository struct {
	svc *dynamodb.DynamoDB
}

// DynamoDB implements a database using AWS DynamoDB.
var DynamoDB = &dynamoRepository{
	svc: dynamodb.New(session.New()),
}

var userTable = os.Getenv("stage") + "-users"
var availabilityTable = os.Getenv("stage") + "-availabilities"
var meetingTable = os.Getenv("stage") + "-meetings"
var gameTable = os.Getenv("stage") + "-games"
var requirementTable = os.Getenv("stage") + "-requirements"

// getItem handles sending a DynamoDB GetItem request and unmarshals the result into the provided output
// value, which must be a non-nil pointer. If the result of the GetItem request is nil, then
// a 404 error is returned. All other errors result in a 500 error.
func (repo *dynamoRepository) getItem(input *dynamodb.GetItemInput, out interface{}) error {
	result, err := repo.svc.GetItem(input)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}

	if result.Item == nil {
		return errors.New(404, "Invalid request: resource not found", "DynamoDB GetItem result.Item is nil")
	}

	err = dynamodbattribute.UnmarshalMap(result.Item, out)
	return errors.Wrap(500, "Temporary server error", "Failed to unmarshal DynamoDB GetItem result", err)
}
