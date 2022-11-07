package database

import (
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
)

type AvailabilityStats struct {
	// The total number of availabilities that have been created.
	Created int `dynamodbav:"created" json:"created"`

	// The total number of availabilities that have been deleted.
	Deleted int `dynamodbav:"deleted" json:"deleted"`

	// The total number of availabilities that have been booked.
	Booked int `dynamodbav:"booked" json:"booked"`

	// The number of availabilities that have been created by owner cohort.
	OwnerCohorts map[string]int `dynamodbav:"ownerCohorts" json:"ownerCohorts"`

	// The number of availabilities that have been deleted by deleter cohort.
	DeleterCohorts map[string]int `dynamodbav:"deleterCohorts" json:"deleterCohorts"`

	// The number of availabilities that are bookable by the given cohort.
	BookableCohorts map[string]int `dynamodbav:"bookableCohorts" json:"bookableCohorts"`

	// The number of availabilities created that offer the given type
	Types map[AvailabilityType]int `dynamodbav:"types" json:"types"`
}

type MeetingStats struct {
	// The total number of meetings that have been created.
	Created int `dynamodbav:"created" json:"created"`

	// The total number of meetings that have been canceled.
	Canceled int `dynamodbav:"canceled" json:"canceled"`

	// The number of meetings that have been created by owner cohort.
	OwnerCohorts map[string]int `dynamodbav:"ownerCohorts" json:"ownerCohorts"`

	// The number of meetings that have been created by participant cohort.
	ParticipantCohorts map[string]int `dynamodbav:"participantCohorts" json:"participantCohorts"`

	// The number of meetings that have been canceled by canceler cohort.
	CancelerCohorts map[string]int `dynamodbav:"cancelerCohorts" json:"cancelerCohorts"`

	// The number of meetings that have been created by type.
	Types map[AvailabilityType]int `dynamodbav:"types" json:"types"`
}

// RecordAvailabilityCreation saves statistics on the created availability.
func (repo *dynamoRepository) RecordAvailabilityCreation(availability *Availability) error {
	updateExpression := "SET created = created + :v, ownerCohorts.#oc = ownerCohorts.#oc + :v"
	expressionAttributeNames := map[string]*string{
		"#oc": aws.String(string(availability.OwnerCohort)),
	}

	for i, c := range availability.Cohorts {
		name := fmt.Sprintf("#bc%d", i)
		updateExpression += fmt.Sprintf(", bookableCohorts.%s = bookableCohorts.%s + :v", name, name)
		expressionAttributeNames[name] = aws.String(string(c))
	}

	for _, t := range availability.Types {
		updateExpression += fmt.Sprintf(", types.%s = types.%s + :v", t, t)
	}

	input := &dynamodb.UpdateItemInput{
		UpdateExpression:         aws.String(updateExpression),
		ExpressionAttributeNames: expressionAttributeNames,
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":v": {
				N: aws.String("1"),
			},
		},
		Key: map[string]*dynamodb.AttributeValue{
			"owner": {
				S: aws.String("STATISTICS"),
			},
			"id": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(availabilityTable),
	}
	log.Debug("RecordAvailabilityCreation: ", input)

	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update availabliity statistics record", err)
}
