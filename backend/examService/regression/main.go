// Implements a Lambda handler which re-runs the linear regression and updates users' ratings
// for an exam in response to DynamoDB stream updates.
package main

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/sajari/regression"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.DynamoDBEvent) error {
	log.Infof("Event: %#v", event)

	for _, record := range event.Records {
		if record.EventName != "MODIFY" {
			continue
		}

		if err := processExam(record); err != nil {
			log.Error("Failed to process exam: ", err)
		}
	}

	return nil
}

// processExam recalculates the linear regression for an exam using the new scores,
// calculates the new ratings for all the users who have taken the exam, and saves
// those ratings on each user object.
func processExam(record events.DynamoDBEventRecord) error {
	examType := record.Change.Keys["type"].String()
	if examType != string(database.ExamType_Tactics) {
		log.Info("Not an exam")
		return nil
	}

	exam := database.Exam{}
	if err := unmarshalStreamImage(record.Change.NewImage, &exam); err != nil {
		return err
	}

	r := new(regression.Regression)
	r.SetObserved("Normalized rating per score on exam")
	r.SetVar(0, "ExamScore")

	for _, answer := range exam.Answers {
		if answer.Rating > 0 {
			r.Train(regression.DataPoint(float64(answer.Rating), []float64{float64(answer.Score)}))
		}
	}
	err := r.Run()
	if err != nil {
		return err
	}
	log.Infof("Regression coefficients: %v", r.GetCoeffs())

	updates := make([]database.UserExamSummaryUpdate, 0, len(exam.Answers))
	for username, answer := range exam.Answers {
		rating, err := r.Predict([]float64{float64(answer.Score)})
		if err != nil {
			continue
		}

		updates = append(updates, database.UserExamSummaryUpdate{
			Username: username,
			Summary: database.UserExamSummary{
				ExamType:    exam.Type,
				CohortRange: exam.CohortRange,
				CreatedAt:   answer.CreatedAt,
				Rating:      float32(rating),
			},
		})
	}

	log.Infof("Updating %d users", len(updates))
	return repository.UpdateUserExamRatings(exam.Id, updates)
}

// unmarshalStreamImage converts events.DynamoDBAttributeValue to struct
// TODO: replace this with dynamodbstreams/attributevalue after updating to go aws sdk v2.
func unmarshalStreamImage(attribute map[string]events.DynamoDBAttributeValue, out interface{}) error {
	dbAttrMap := make(map[string]*dynamodb.AttributeValue)

	for k, v := range attribute {
		var dbAttr dynamodb.AttributeValue
		bytes, marshalErr := v.MarshalJSON()
		if marshalErr != nil {
			return marshalErr
		}

		json.Unmarshal(bytes, &dbAttr)
		dbAttrMap[k] = &dbAttr
	}

	return dynamodbattribute.UnmarshalMap(dbAttrMap, out)
}
