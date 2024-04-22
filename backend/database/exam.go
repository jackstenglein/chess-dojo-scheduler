package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

// The key of an item in the exams table.
type ExamTableKey struct {
	// The type of the item in the table. Used as the hash key for the table.
	// Can be a known enum value or the username of a user who has taken an exam.
	Type ExamType `dynamodbav:"type" json:"type"`

	// The id of the item in the table. Used as the range key for the table.
	// Usually the v4 UUID of the exam.
	Id string `dynamodbav:"id" json:"id"`
}

type ExamType string

const (
	// Indicates the item is a tactics exam.
	ExamType_Tactics ExamType = "TACTICS_EXAM"

	// Indicates the item is the recorded scores for a single exam.
	ExamType_Scores ExamType = "SCORES"
)

// A summary of a single user's answer to an exam. Stored on the exam
// to facilitate calculating the exam's linear regression.
type ExamAnswerSummary struct {
	// The user's cohort, at the time they took the exam.
	Cohort string `dynamodbav:"cohort" json:"cohort"`

	// The user's normalized rating, at the time they took the exam.
	Rating float32 `dynamodbav:"rating" json:"rating"`

	// The user's score for the full exam.
	Score int `dynamodbav:"score" json:"score"`

	// The date the user took the exam, in time.RFC3339 format
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
}

// An exam consisting of multiple problems.
type Exam struct {
	// The database table key of the exam.
	ExamTableKey

	// The user-facing name of the exam.
	Name string `dynamodbav:"name" json:"name"`

	// The list of problem PGNs in the exam.
	Pgns []string `dynamodbav:"pgns" json:"pgns"`

	// The max amount of time allowed to take the exam, in seconds.
	TimeLimitSeconds int `dynamodbav:"timeLimitSeconds" json:"timeLimitSeconds"`

	// The cohort range the exam applies to.
	CohortRange string `dynamodbav:"cohortRange" json:"cohortRange"`

	// A map from username to ExamAnswerSummary.
	Answers map[string]ExamAnswerSummary `dynamodbav:"answers" json:"answers"`
}

// A single user's answer to an exam problem.
type ExamProblemAnswer struct {
	// The user's final result PGN.
	Pgn string `dynamodbav:"pgn" json:"pgn"`

	// The user's score for the problem.
	Score int `dynamodbav:"score" json:"score"`

	// The total score available for the problem.
	Total int `dynamodbav:"total" json:"total"`
}

// A single user's answer to a full exam.
type ExamAnswer struct {
	// The database table key of the exam. Type will be the user's username
	// and Id will be the UUID of the exam.
	ExamTableKey

	// The type of the exam this answer refers to.
	ExamType ExamType `dynamodbav:"examType" json:"examType"`

	// The user's answers to the problems included in the exam.
	Answers []ExamProblemAnswer `dynamodbav:"answers" json:"answers"`

	// The user's cohort, at the time they took the exam.
	Cohort string `dynamodbav:"cohort" json:"cohort"`

	// The user's normalized rating, at the time they took the exam.
	Rating float32 `dynamodbav:"rating" json:"rating"`

	// The amount of time used while taking the exam.
	TimeUsedSeconds int `dynamodbav:"timeUsedSeconds" json:"timeUsedSeconds"`

	// The date the user took the exam, in time.RFC3339 format
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
}

// ListExams returns a paginated list of exams with the provided type.
func (repo *dynamoRepository) ListExams(examType ExamType, startKey string, out interface{}) (string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#type = :type"),
		ExpressionAttributeNames: map[string]*string{
			"#type": aws.String("type"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":type": {S: aws.String(string(examType))},
		},
		TableName: aws.String(examsTable),
	}

	lastKey, err := repo.query(input, startKey, out)
	if err != nil {
		return "", err
	}
	return lastKey, nil
}

// PutExamAnswerSummary creates and saves an ExamAnswerSummary using the provided ExamAnswer.
func (repo *dynamoRepository) PutExamAnswerSummary(answer *ExamAnswer) error {
	score := 0
	for _, a := range answer.Answers {
		score += a.Score
	}

	summary := ExamAnswerSummary{
		Cohort:    answer.Cohort,
		Rating:    answer.Rating,
		Score:     score,
		CreatedAt: answer.CreatedAt,
	}
	item, err := dynamodbattribute.MarshalMap(summary)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal answer summary", err)
	}

	input := &dynamodb.UpdateItemInput{
		UpdateExpression:    aws.String("SET #answers.#user = :a"),
		ConditionExpression: aws.String("attribute_exists(#answers) AND attribute_not_exists(#answers.#user)"),
		ExpressionAttributeNames: map[string]*string{
			"#answers": aws.String("answers"),
			"#user":    aws.String(string(answer.Type)),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":a": {M: item},
		},
		Key: map[string]*dynamodb.AttributeValue{
			"type": {S: aws.String(string(answer.ExamType))},
			"id":   {S: aws.String(answer.Id)},
		},
		ReturnValues: aws.String("NONE"),
		TableName:    aws.String(examsTable),
	}

	_, err = repo.svc.UpdateItem(input)
	if err != nil {
		if _, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return errors.Wrap(400, "Invalid request: exam not found or you have already taken it", "DynamoDB conditional check failed", err)
		}
		return errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}
	return nil
}

// PutExamAnswer inserts the provided answer into the database.
func (repo *dynamoRepository) PutExamAnswer(answer *ExamAnswer) error {
	item, err := dynamodbattribute.MarshalMap(answer)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal answer", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(examsTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// GetExamAnswer fetches the provided exam answer from the database.
func (repo *dynamoRepository) GetExamAnswer(username, id string) (*ExamAnswer, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {S: aws.String(username)},
			"id":   {S: aws.String(id)},
		},
		TableName: aws.String(examsTable),
	}

	answer := ExamAnswer{}
	err := repo.getItem(input, &answer)
	return &answer, err
}
