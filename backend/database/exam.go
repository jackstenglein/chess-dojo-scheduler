package database

import (
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
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

// A single user's attempt on an exam. Users can retake an exam,
// but only the first attempt is scored.
type ExamAttempt struct {
	// The user's answers to the problems included in the exam.
	Answers []ExamProblemAnswer `dynamodbav:"answers" json:"answers"`

	// The user's cohort, at the time of the attempt.
	Cohort string `dynamodbav:"cohort" json:"cohort"`

	// The user's normalized rating, at the time of the attempt.
	Rating float32 `dynamodbav:"rating" json:"rating"`

	// The amount of time used during the attempt.
	TimeUsedSeconds int `dynamodbav:"timeUsedSeconds" json:"timeUsedSeconds"`

	// The date the user took the exam, in time.RFC3339 format.
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
}

// A single user's answer to a full exam.
type ExamAnswer struct {
	// The database table key of the exam. Type will be the user's username
	// and Id will be the UUID of the exam.
	ExamTableKey

	// The type of the exam this answer refers to.
	ExamType ExamType `dynamodbav:"examType" json:"examType"`

	// The user's attempts on the exam.
	Attempts []ExamAttempt `dynamodbav:"attempts" json:"attempts"`

	// The user's answers to the problems included in the exam.
	// Deprecated
	Answers []ExamProblemAnswer `dynamodbav:"answers" json:"answers"`

	// The user's cohort, at the time they took the exam.
	// Deprecated
	Cohort string `dynamodbav:"cohort" json:"cohort"`

	// The user's normalized rating, at the time they took the exam.
	// Deprecated
	Rating float32 `dynamodbav:"rating" json:"rating"`

	// The amount of time used while taking the exam.
	// Deprecated
	TimeUsedSeconds int `dynamodbav:"timeUsedSeconds" json:"timeUsedSeconds"`

	// The date the user took the exam, in time.RFC3339 format
	// Deprecated
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
// The updated Exam is returned. If the ExamAnswer does not require updating the Exam, then nil is returned.
func (repo *dynamoRepository) PutExamAnswerSummary(answer *ExamAnswer) (*Exam, error) {
	if len(answer.Attempts) > 1 {
		// We've already saved the first attempt on the Exam, and don't need to do anything with this update.
		return nil, nil
	}

	score := 0
	for _, a := range answer.Attempts[0].Answers {
		score += a.Score
	}

	summary := ExamAnswerSummary{
		Cohort:    answer.Attempts[0].Cohort,
		Rating:    answer.Attempts[0].Rating,
		Score:     score,
		CreatedAt: answer.Attempts[0].CreatedAt,
	}
	item, err := dynamodbattribute.MarshalMap(summary)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal answer summary", err)
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
		ReturnValues: aws.String("ALL_NEW"),
		TableName:    aws.String(examsTable),
	}

	exam := &Exam{}
	if err := repo.updateItem(input, exam); err != nil {
		if _, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(400, "Invalid request: exam not found or you have already taken it", "DynamoDB conditional check failed", err)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}
	return exam, nil
}

// PutExamAttempt inserts the provided exam attempt into the database. It is appended to the
// existing list of attempts. The updated ExamAnswer is returned.
func (repo *dynamoRepository) PutExamAttempt(username string, examId string, examType ExamType, attempt *ExamAttempt) (*ExamAnswer, error) {
	item, err := dynamodbattribute.MarshalMap(attempt)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal attempt", err)
	}

	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {S: aws.String(username)},
			"id":   {S: aws.String(examId)},
		},
		UpdateExpression: aws.String("SET #et = :et, #a = list_append(if_not_exists(#a, :empty_list), :a)"),
		ExpressionAttributeNames: map[string]*string{
			"#et": aws.String("examType"),
			"#a":  aws.String("attempts"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":et":         {S: aws.String(string(examType))},
			":empty_list": {L: []*dynamodb.AttributeValue{}},
			":a":          {L: []*dynamodb.AttributeValue{{M: item}}},
		},
		TableName:    aws.String(examsTable),
		ReturnValues: aws.String("ALL_NEW"),
	}

	answer := &ExamAnswer{}
	if err := repo.updateItem(input, answer); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed updateItem call", err)
	}
	return answer, nil
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

// Represents an update to a single UserExamSummary.
type UserExamSummaryUpdate struct {
	// The username to update
	Username string

	// The new summary to set
	Summary UserExamSummary
}

// UpdateUserExamRatings uses DynamoDB PartiQL to batch update the given users' exam summaries for the given exam.
func (repo *dynamoRepository) UpdateUserExamRatings(examId string, updates []UserExamSummaryUpdate) error {
	for i := 0; i < len(updates); i += 25 {
		statements := make([]*dynamodb.BatchStatementRequest, 0, 25)

		for j := i; j < len(updates) && j < i+25; j++ {
			update := updates[j]
			params, err := dynamodbattribute.MarshalList([]interface{}{update.Summary, update.Username})
			if err != nil {
				return errors.Wrap(500, "Temporary server error", "Failed to marshal exam update", err)
			}

			statements = append(statements, &dynamodb.BatchStatementRequest{
				Statement:  aws.String(fmt.Sprintf("UPDATE \"%s\" SET exams.\"%s\"=? WHERE username=?", userTable, examId)),
				Parameters: params,
			})
		}

		input := &dynamodb.BatchExecuteStatementInput{Statements: statements}
		log.Debugf("Batch execute statement input: %v", input)
		output, err := repo.svc.BatchExecuteStatement(input)
		log.Debugf("Batch execute statement output: %v", output)
		if err != nil {
			return errors.Wrap(500, "Temporary server error", "Failed BatchExecuteStatement", err)
		}
	}
	return nil
}
