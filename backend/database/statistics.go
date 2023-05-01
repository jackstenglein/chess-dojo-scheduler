package database

import (
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type EventStatistics struct {
	// The total number of Events created by EventType
	Created map[EventType]int `dynamodbav:"types" json:"types"`

	// The total number of requests to book an availability.
	AvailabilitiesBooked int `dynamodbav:"availabilitiesBooked" json:"availabilitiesBooked"`

	// The total number of availabilities that have been deleted.
	AvailabilitiesDeleted int `dynamodbav:"availabilitiesDeleted" json:"availabilitiesDeleted"`

	// The total number of cancelations that have happened on an availability.
	AvailabilitiesCanceled int `dynamodbav:"availabilitiesCanceled" json:"availabilitiesCanceled"`

	// The number of availabilities that have been created by owner cohort.
	OwnerCohorts map[string]int `dynamodbav:"ownerCohorts" json:"ownerCohorts"`

	// The number of availabilities that are bookable by the given cohort.
	BookableCohorts map[string]int `dynamodbav:"bookableCohorts" json:"bookableCohorts"`

	// The number of availabilities created that offer the given type
	AvailabilityTypes map[AvailabilityType]int `dynamodbav:"availabilityTypes" json:"availabilityTypes"`

	// The number of availabilities created with a given value for MaxParticipants
	AvailabilityMaxParticipants map[int]int `dynamodbav:"availabilityMaxParticipants" json:"availabilityMaxParticipants"`
}

type AdminStatisticsGetter interface {
	UserGetter

	// GetEventStatistics gets the event statistics from the database.
	GetEventStatistics() (*EventStatistics, error)
}

// GetEventStatistics gets the event statistics from the database.
func (repo *dynamoRepository) GetEventStatistics() (*EventStatistics, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(eventTable),
	}

	eventStats := EventStatistics{}
	if err := repo.getItem(input, &eventStats); err != nil {
		return nil, err
	}
	return &eventStats, nil
}

// RecordEventCreation saves statistics on the created event.
func (repo *dynamoRepository) RecordEventCreation(event *Event) error {
	builder := expression.UpdateBuilder{}

	if event.Type == EventTypeDojo {
		value := expression.Name("created.DOJO").Plus(expression.Value(1))
		builder = builder.Set(expression.Name("created.DOJO"), value)
	} else {
		value := expression.Name("created.AVAILABILITY").Plus(expression.Value(1))
		builder = builder.Set(expression.Name("created.AVAILABILITY"), value)

		ownerCohortName := fmt.Sprintf("ownerCohorts.%s", event.OwnerCohort)
		value = expression.Name(ownerCohortName).Plus(expression.Value(1))
		builder = builder.Set(expression.Name(ownerCohortName), value)

		for _, c := range event.Cohorts {
			bookableCohortName := fmt.Sprintf("bookableCohorts.%s", c)
			value = expression.Name(bookableCohortName).Plus(expression.Value(1))
			builder = builder.Set(expression.Name(bookableCohortName), value)
		}

		for _, t := range event.Types {
			typeName := fmt.Sprintf("availabilityTypes.%s", t)
			value = expression.Name(typeName).Plus(expression.Value(1))
			builder = builder.Set(expression.Name(typeName), value)
		}

		maxParticipantsName := fmt.Sprintf("availabilityMaxParticipants.%d", event.MaxParticipants)
		value = expression.Name(maxParticipantsName).Plus(expression.Value(1))
		builder = builder.Set(expression.Name(maxParticipantsName), value)
	}

	expr, err := expression.NewBuilder().WithUpdate(builder).Build()
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to build DynamoDB expression", err)
	}

	input := &dynamodb.UpdateItemInput{
		UpdateExpression:          expr.Update(),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(eventTable),
	}

	_, err = repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update event statistics record", err)
}

// RecordEventBooking saves statistics on an event booking.
func (repo *dynamoRepository) RecordEventBooking(event *Event) error {
	if event.Type == EventTypeDojo {
		return nil
	}

	updateExpression := "SET availabilitiesBooked = availabilitiesBooked + :v"

	input := &dynamodb.UpdateItemInput{
		UpdateExpression: aws.String(updateExpression),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":v": {
				N: aws.String("1"),
			},
		},
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(eventTable),
	}

	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update event statistics record", err)
}

// RecordEventDeletion saves statistics on the deleted event.
func (repo *dynamoRepository) RecordEventDeletion(event *Event) error {
	if event.Type == EventTypeDojo {
		return nil
	}

	input := &dynamodb.UpdateItemInput{
		UpdateExpression: aws.String("SET availabilitiesDeleted = availabilitiesDeleted + :v"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":v": {
				N: aws.String("1"),
			},
		},
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(eventTable),
	}

	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update event statistics record", err)
}

// RecordEventCancelation saves statistics on the canceled event.
func (repo *dynamoRepository) RecordEventCancelation(event *Event) error {
	if event.Type == EventTypeDojo {
		return nil
	}

	input := &dynamodb.UpdateItemInput{
		UpdateExpression: aws.String("SET availabilitiesCanceled = availabilitiesCanceled + :v"),
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":v": {
				N: aws.String("1"),
			},
		},
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(eventTable),
	}
	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update event statistics record", err)
}
