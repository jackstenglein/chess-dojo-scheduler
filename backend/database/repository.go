package database

import (
	"os"

	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
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
