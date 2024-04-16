package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

type TacticsTableKey struct {
	// The owner of the item in the tactics table. Used as the hash key for the table.
	// Can be a known enum value or the username of a user who has taken a tactics test.
	Type TacticsTableOwner `dynamodbav:"type" json:"type"`

	// The id of the item in the tactics table. Used as the range key for the table.
	// Usually the v4 UUID of the tactics test.
	Id string `dynamodbav:"id" json:"id"`
}

type TacticsTableOwner string

const (
	// Indicates the item is the tactics test itself.
	TacticsTableOwner_Test TacticsTableOwner = "TEST"

	// Indicates the item is the recorded scores for a tactics test.
	TacticsTableOwner_Scores TacticsTableOwner = "SCORES"
)

// A single problem in a tactics test.
type TacticsProblem struct {
	// The side to move first in the problem.
	Orientation string `dynamodbav:"orientation" json:"orientation"`

	// The FEN of the starting position.
	Fen string `dynamodbav:"fen" json:"fen"`

	// The PGN of the solution to the problem.
	Solution string `dynamodbav:"solution" json:"solution"`
}

// A tactics test consisting of multiple problems.
type TacticsTest struct {
	// The database table key of the test.
	TacticsTableKey

	// The user-facing name of the test.
	Name string `dynamodbav:"name" json:"name"`

	// The problems included in the test.
	Problems []TacticsProblem `dynamodbav:"problems" json:"problems"`

	// The max amount of time allowed to take the test, in seconds.
	TimeLimitSeconds int `dynamodbav:"timeLimitSeconds" json:"timeLimitSeconds"`

	// The cohort range the test applies to.
	CohortRange string `dynamodbav:"cohortRange" json:"cohortRange"`
}

// ListTacticsTests returns a paginated list of all tactics tests.
func (repo *dynamoRepository) ListTacticsTests(startKey string) ([]TacticsTest, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#type = :type"),
		ExpressionAttributeNames: map[string]*string{
			"#type": aws.String("type"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":type": {S: aws.String(string(TacticsTableOwner_Test))},
		},
		TableName: aws.String(tacticsTable),
	}

	var tests []TacticsTest
	lastKey, err := repo.query(input, startKey, &tests)
	if err != nil {
		return nil, "", err
	}
	return tests, lastKey, nil
}
