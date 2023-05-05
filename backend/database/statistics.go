package database

import (
	"fmt"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
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

type UserStatistics struct {
	// The number of participants per cohort
	Participants map[DojoCohort]int `dynamodbav:"participants" json:"participants"`

	// The number of active participants per cohort
	ActiveParticipants map[DojoCohort]int `dynamodbav:"activeParticipants" json:"activeParticipants"`

	// The sum of dojo scores per cohort. Not currently used.
	DojoScores map[DojoCohort]float32 `dynamodbav:"dojoScores" json:"dojoScores"`

	// The sum of active dojo scores per cohort. Not currently used.
	ActiveDojoScores map[DojoCohort]float32 `dynamodbav:"activeDojoScores" json:"activeDojoScores"`

	// The sum of rating changes per cohort
	RatingChanges map[DojoCohort]int `dynamodbav:"ratingChanges" json:"ratingChanges"`

	// The sum of active rating changes per cohort
	ActiveRatingChanges map[DojoCohort]int `dynamodbav:"activeRatingChanges" json:"activeRatingChanges"`

	// The number of users using a specific rating system per cohort
	RatingSystems map[DojoCohort]map[RatingSystem]int `dynamodbav:"ratingSystems" json:"ratingSystems"`

	// The number of active users using a specific rating system per cohort
	ActiveRatingSystems map[DojoCohort]map[RatingSystem]int `dynamodbav:"activeRatingSystems" json:"activeRatingSystems"`

	// The sum of minutes spent per cohort
	MinutesSpent map[DojoCohort]int `dynamodbav:"minutesSpent" json:"minutesSpent"`

	// The sum of active minutes spent per cohort
	ActiveMinutesSpent map[DojoCohort]int `dynamodbav:"activeMinutesSpent" json:"activeMinutesSpent"`
}

type AdminStatisticsGetter interface {
	UserGetter

	// GetEventStatistics gets the event statistics from the database.
	GetEventStatistics() (*EventStatistics, error)
}

type UserStatisticsGetter interface {
	// GetUserStatistics returns the user statistics from the database.
	GetUserStatistics() (*UserStatistics, error)
}

// NewUserStatistics returns a blank UserStatistics object with all values
// set to zero.
func NewUserStatistics() *UserStatistics {
	stats := &UserStatistics{
		Participants:        make(map[DojoCohort]int),
		ActiveParticipants:  make(map[DojoCohort]int),
		DojoScores:          make(map[DojoCohort]float32),
		ActiveDojoScores:    make(map[DojoCohort]float32),
		RatingChanges:       make(map[DojoCohort]int),
		ActiveRatingChanges: make(map[DojoCohort]int),
		RatingSystems:       make(map[DojoCohort]map[RatingSystem]int),
		ActiveRatingSystems: make(map[DojoCohort]map[RatingSystem]int),
		MinutesSpent:        make(map[DojoCohort]int),
		ActiveMinutesSpent:  make(map[DojoCohort]int),
	}

	statsCohorts := []DojoCohort{AllCohorts, NoCohort}
	statsCohorts = append(statsCohorts, cohorts...)

	for _, c := range statsCohorts {
		stats.Participants[c] = 0
		stats.ActiveParticipants[c] = 0
		stats.DojoScores[c] = 0
		stats.ActiveDojoScores[c] = 0
		stats.RatingChanges[c] = 0
		stats.ActiveRatingChanges[c] = 0
		stats.RatingSystems[c] = make(map[RatingSystem]int)
		stats.ActiveRatingSystems[c] = make(map[RatingSystem]int)
		stats.MinutesSpent[c] = 0
		stats.ActiveMinutesSpent[c] = 0

		for _, rs := range ratingSystems {
			stats.RatingSystems[c][rs] = 0
			stats.ActiveRatingSystems[c][rs] = 0
		}
	}

	return stats
}

// GetUserStatistics returns the user statistics from the database.
func (repo *dynamoRepository) GetUserStatistics() (*UserStatistics, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String("STATISTICS"),
			},
		},
		TableName: aws.String(userTable),
	}

	userStats := UserStatistics{}
	if err := repo.getItem(input, &userStats); err != nil {
		return nil, err
	}
	return &userStats, nil
}

// SetUserStatistics inserts the provided user statistics into the database.
func (repo *dynamoRepository) SetUserStatistics(stats *UserStatistics) error {
	log.Debugf("Saving stats: %#v", stats)
	item, err := dynamodbattribute.MarshalMap(stats)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal users stats", err)
	}
	item["username"] = &dynamodb.AttributeValue{S: aws.String("STATISTICS")}
	item["dojoCohort"] = &dynamodb.AttributeValue{S: aws.String("STATISTICS")}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(userTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// GetEventStatistics gets the event statistics from the
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
