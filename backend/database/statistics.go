package database

import (
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type AvailabilityStatistics struct {
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

	// The number of group availabilities created by owner cohort.
	GroupCohorts map[string]int `dynamodbav:"groupCohorts" json:"groupCohorts"`

	// The number of availabilities created that offer the given type
	Types map[AvailabilityType]int `dynamodbav:"types" json:"types"`
}

type MeetingStatistics struct {
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

	// The number of people that have joined a group created by joiner cohort.
	GroupCohorts map[string]int `dynamodbav:"groupCohorts" json:"groupCohorts"`

	// The number of meetings that have been created by type.
	Types map[AvailabilityType]int `dynamodbav:"types" json:"types"`
}

type AdminStatisticsGetter interface {
	UserGetter

	// GetAvailabilityStatistics gets the availability statistics from the database.
	GetAvailabilityStatistics() (*AvailabilityStatistics, error)

	// GetMeetingStatistics gets the meeting statistics from the database.
	GetMeetingStatistics() (*MeetingStatistics, error)
}

// RecordAvailabilityCreation saves statistics on the created availability.
func (repo *dynamoRepository) RecordAvailabilityCreation(availability *Availability) error {
	updateExpression := "SET created = created + :v, ownerCohorts.#oc = ownerCohorts.#oc + :v"
	expressionAttributeNames := map[string]*string{
		"#oc": aws.String(string(availability.OwnerCohort)),
	}

	if availability.MaxParticipants > 1 {
		updateExpression += ", groupCohorts.#oc = groupCohorts.#oc + :v"
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

	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update availabliity statistics record", err)
}

// RecordAvailabilityDeletion saves statistics on the deleted availability.
func (repo *dynamoRepository) RecordAvailabilityDeletion(availability *Availability) error {
	updateExpression := "SET deleted = deleted + :v, deleterCohorts.#dc = deleterCohorts.#dc + :v"
	expressionAttributeNames := map[string]*string{
		"#dc": aws.String(string(availability.OwnerCohort)),
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

	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update availabliity statistics record", err)
}

// GetAvailabilityStatistics gets the availability statistics from the database.
func (repo *dynamoRepository) GetAvailabilityStatistics() (*AvailabilityStatistics, error) {
	input := &dynamodb.GetItemInput{
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

	availabilityStats := AvailabilityStatistics{}
	if err := repo.getItem(input, &availabilityStats); err != nil {
		return nil, err
	}
	return &availabilityStats, nil
}

// RecordMeetingCreation saves statistics on the created meeting.
func (repo *dynamoRepository) RecordMeetingCreation(meeting *Meeting, ownerCohort, participantCohort DojoCohort) error {
	updateExpression := "SET booked = booked + :v"
	input := &dynamodb.UpdateItemInput{
		UpdateExpression: aws.String(updateExpression),
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
	if _, err := repo.svc.UpdateItem(input); err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to update availabliity statistics record", err)
	}

	updateExpression = "SET created = created + :v, #oc.#ockey = #oc.#ockey + :v, #pc.#pckey = #pc.#pckey + :v"
	updateExpression += fmt.Sprintf(", types.%s = types.%s + :v", meeting.Type, meeting.Type)
	input = &dynamodb.UpdateItemInput{
		UpdateExpression: aws.String(updateExpression),
		ExpressionAttributeNames: map[string]*string{
			"#oc":    aws.String("ownerCohorts"),
			"#ockey": aws.String(string(ownerCohort)),
			"#pc":    aws.String("participantCohorts"),
			"#pckey": aws.String(string(participantCohort)),
		},
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
		TableName: aws.String(meetingTable),
	}

	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update meeting statistics record", err)
}

// RecordMeetingCancelation saves statistics on the canceled meeting.
func (repo *dynamoRepository) RecordMeetingCancelation(cancelerCohort DojoCohort) error {
	updateExpression := "SET canceled = canceled + :v, cancelerCohorts.#cc = cancelerCohorts.#cc + :v"
	input := &dynamodb.UpdateItemInput{
		UpdateExpression: aws.String(updateExpression),
		ExpressionAttributeNames: map[string]*string{
			"#cc": aws.String(string(cancelerCohort)),
		},
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
		TableName: aws.String(meetingTable),
	}
	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update meeting statistics record", err)
}

// RecordGroupJoin saves statistics on a group meeting join.
func (repo *dynamoRepository) RecordGroupJoin(cohort DojoCohort) error {
	updateExpression := "SET groupCohorts.#c = groupCohorts.#c + :v"

	input := &dynamodb.UpdateItemInput{
		UpdateExpression: aws.String(updateExpression),
		ExpressionAttributeNames: map[string]*string{
			"#c": aws.String(string(cohort)),
		},
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
		TableName: aws.String(meetingTable),
	}

	_, err := repo.svc.UpdateItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed to update meeting statistics record", err)
}

// GetMeetingStatistics gets the meeting statistics from the database.
func (repo *dynamoRepository) GetMeetingStatistics() (*MeetingStatistics, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(meetingTable),
	}

	meetingStats := MeetingStatistics{}
	if err := repo.getItem(input, &meetingStats); err != nil {
		return nil, err
	}
	return &meetingStats, nil
}
