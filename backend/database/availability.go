package database

import (
	"encoding/json"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
)

type AvailabilityType string

var availabilityTypes = []AvailabilityType{
	"CLASSICAL_GAME",
	"OPENING_SPARRING",
	"MIDDLEGAME_SPARRING",
	"ENDGAME_SPARRING",
	"ROOK_ENDGAME_PROGRESSION",
	"CLASSIC_ANALYSIS",
	"ANALYZE_OWN_GAME",
	"BOOK_STUDY",
}

// IsValidAvailabilityType returns true if the provided availability type
// is valid.
func IsValidAvailabilityType(t AvailabilityType) bool {
	for _, t2 := range availabilityTypes {
		if t == t2 {
			return true
		}
	}
	return false
}

// Represents the scheduling status for availabilities and meetings.
type SchedulingStatus string

const (
	Scheduled SchedulingStatus = "SCHEDULED"
	Booked    SchedulingStatus = "BOOKED"
	Canceled  SchedulingStatus = "CANCELED"
)

type Availability struct {
	// The username of the creator of this availability.
	Owner string `dynamodbav:"owner" json:"owner"`

	// The discord username of the owner.
	OwnerDiscord string `dynamodbav:"ownerDiscord" json:"ownerDiscord"`

	// The cohort of the owner.
	OwnerCohort DojoCohort `dynamodbav:"ownerCohort" json:"ownerCohort"`

	// A v4 UUID identifying this availability
	Id string `dynamodbav:"id" json:"id"`

	// The time the availability starts, in full ISO-8601 format. This is the earliest
	// that the owner is willing to start their game/meeting.
	StartTime string `dynamodbav:"startTime" json:"startTime"`

	// The time the availability ends, in full ISO-8601 format. This is the latest
	// that the owner is willing to start their game/meeting.
	EndTime string `dynamodbav:"endTime" json:"endTime"`

	// The time that the availability will be deleted from the database. This is set
	// to 48 hours after the end time.
	ExpirationTime int64 `dynamodbav:"expirationTime" json:"-"`

	// The game/meeting types that the owner is willing to play.
	Types []AvailabilityType `dynamodbav:"types" json:"types"`

	// The dojo cohorts that the owner is willing to play against/meet with.
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohorts"`

	// The status of the Availability.
	Status SchedulingStatus `dynamodbav:"status" json:"-"`

	// Contains either a zoom link, discord, discord classroom, etc.
	Location string `dynamodbav:"location" json:"location"`

	// An optional description for sparring positions, etc.
	Description string `dynamodbav:"description" json:"description"`
}

type AvailabilitySetter interface {
	// SetAvailablity inserts the provided availability into the database.
	SetAvailability(availability *Availability) error

	// RecordAvailabilityCreation saves statistics on the created availability.
	RecordAvailabilityCreation(availability *Availability) error
}

type AvailabilityBooker interface {
	UserGetter

	// GetAvailability returns the Availability object with the provided owner and id.
	GetAvailability(owner, id string) (*Availability, error)

	// BookAvailablity converts the provided Availability into the provided Meeting object. The Availability
	// object is deleted and the Meeting object is saved in its place.
	BookAvailability(availability *Availability, request *Meeting) error
}

type AvailabilityDeleter interface {
	// DeleteAvailability deletes the given availability object. An error is returned if it does not exist.
	DeleteAvailability(owner, id string) error
}

type AvailabilitySearcher interface {
	UserGetter

	// GetAvailabilitiesByOwner returns a list of Availabilities matching the provided owner username.
	// username and limit are required parameters. startKey is optional. The list of availabilities and
	// the next start key are returned.
	GetAvailabilitiesByOwner(username string, limit int, startKey string) ([]*Availability, string, error)

	// GetAvailabilitiesByTime returns a list of Availabilities where the Availability endTime >= the startTime
	// parameter. Availabilities owned by the calling username are filtered out of the result list. username,
	// startTime and limit are required parameters. startKey is optional. The list of availabilities and
	// the next start key are returned.
	GetAvailabilitiesByTime(caller *User, startTime string, limit int, startKey string) ([]*Availability, string, error)
}

type AdminAvailabilityLister interface {
	UserGetter

	// ScanAvailabilities returns a list of all Availabilities in the database, up to 1MB of data.
	// startKey is an optional parameter that can be used to perform pagination.
	// The list of availabilities and the next start key are returned.
	ScanAvailabilities(startKey string) ([]*Availability, string, error)
}

// SetAvailability inserts the provided Availability into the database.
func (repo *dynamoRepository) SetAvailability(availability *Availability) error {
	item, err := dynamodbattribute.MarshalMap(availability)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal availability", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(availabilityTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed Dynamo PutItem request", err)
}

// GetAvailability returns the availability object with the provided owner username and id.
func (repo *dynamoRepository) GetAvailability(owner, id string) (*Availability, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"owner": {
				S: aws.String(owner),
			},
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(availabilityTable),
	}

	result, err := repo.svc.GetItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}

	if result.Item == nil {
		return nil, errors.New(404, "Invalid request: availability not found or already booked", "GetAvailability result.Item is nil")
	}

	availability := Availability{}
	err = dynamodbattribute.UnmarshalMap(result.Item, &availability)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetAvailability result", err)
	}
	return &availability, nil
}

// fetchAvailabilities performs the provided DynamoDB query. The startKey is unmarshalled and set on the query.
func (repo *dynamoRepository) fetchAvailabilities(input *dynamodb.QueryInput, startKey string) ([]*Availability, string, error) {
	if startKey != "" {
		var exclusiveStartKey map[string]*dynamodb.AttributeValue
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
		}
		input.SetExclusiveStartKey(exclusiveStartKey)
	}

	log.Debugf("Availability Query input: %v", input)

	result, err := repo.svc.Query(input)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "DynamoDB Query failure", err)
	}
	log.Debugf("Availability query result: %v", result)

	var availabilities []*Availability
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &availabilities)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetAvailabilities result", err)
	}

	var lastKey string
	if len(result.LastEvaluatedKey) > 0 {
		b, err := json.Marshal(result.LastEvaluatedKey)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal GetAvailabilities LastEvaluatedKey", err)
		}
		lastKey = string(b)
	}

	return availabilities, lastKey, nil
}

// GetAvailabilitiesByOwner returns a list of Availabilities matching the provided owner username.
// username and limit are required parameters. startKey is optional. The list of availabilities and
// the next start key are returned.
func (repo *dynamoRepository) GetAvailabilitiesByOwner(username string, limit int, startKey string) ([]*Availability, string, error) {
	input := &dynamodb.QueryInput{
		ExpressionAttributeNames: map[string]*string{
			"#owner":  aws.String("owner"),
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":username": {
				S: aws.String(username),
			},
			":scheduled": {
				S: aws.String(string(Scheduled)),
			},
		},
		KeyConditionExpression: aws.String("#owner = :username"),
		FilterExpression:       aws.String("#status = :scheduled"),
		Limit:                  aws.Int64(int64(limit)),
		TableName:              aws.String(availabilityTable),
	}

	return repo.fetchAvailabilities(input, startKey)
}

// GetAvailabilitiesByTime returns a list of Availabilities where the Availability endTime >= the startTime
// parameter. Availabilities owned by the calling username are filtered out of the result list. username,
// startTime and limit are required parameters. startKey is optional. The list of availabilities and
// the next start key are returned.
func (repo *dynamoRepository) GetAvailabilitiesByTime(user *User, startTime string, limit int, startKey string) ([]*Availability, string, error) {
	keyConditionExpression := "#status = :scheduled AND endTime >= :startTime"
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":scheduled": {
			S: aws.String(string(Scheduled)),
		},
		":startTime": {
			S: aws.String(startTime),
		},
		":username": {
			S: aws.String(user.Username),
		},
		":callerCohort": {
			S: aws.String(string(user.DojoCohort)),
		},
	}

	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String(keyConditionExpression),
		ExpressionAttributeNames: map[string]*string{
			"#status":  aws.String("status"),
			"#owner":   aws.String("owner"),
			"#cohorts": aws.String("cohorts"),
		},
		ExpressionAttributeValues: expressionAttributeValues,
		FilterExpression:          aws.String("#owner <> :username AND contains(#cohorts, :callerCohort)"),
		Limit:                     aws.Int64(int64(limit)),
		IndexName:                 aws.String("EndSearchIndex"),
		TableName:                 aws.String(availabilityTable),
	}

	return repo.fetchAvailabilities(input, startKey)
}

// DeleteAvailability deletes the given availability object. An error is returned if it does not exist.
func (repo *dynamoRepository) DeleteAvailability(owner, id string) error {
	input := &dynamodb.DeleteItemInput{
		ConditionExpression: aws.String("attribute_exists(id)"),
		Key: map[string]*dynamodb.AttributeValue{
			"owner": {
				S: aws.String(owner),
			},
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(availabilityTable),
	}

	if _, err := repo.svc.DeleteItem(input); err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return errors.Wrap(404, "Invalid request: availability does not exist or is already booked", "DynamoDB conditional check failed", aerr)
		}
		return errors.Wrap(500, "Temporary server error", "Failed to unmarshal DeleteItem result", err)
	}
	return nil
}

// BookAvailablity converts the provided Availability into the provided Meeting object. The Availability
// object is marked as booked and the Meeting object is saved. The request only succeeds if the
// Availability is currently marked as scheduled in the database.
func (repo *dynamoRepository) BookAvailability(availability *Availability, request *Meeting) error {
	// First mark the availability as booked to make sure nobody else can book it
	availability.Status = Booked
	item, err := dynamodbattribute.MarshalMap(availability)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal availability", err)
	}

	input := &dynamodb.PutItemInput{
		ConditionExpression: aws.String("attribute_exists(id) AND #status = :scheduled"),
		ExpressionAttributeNames: map[string]*string{
			"#status": aws.String("status"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":scheduled": {
				S: aws.String(string(Scheduled)),
			},
		},
		Item:      item,
		TableName: aws.String(availabilityTable),
	}

	if _, err := repo.svc.PutItem(input); err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return errors.Wrap(400, "Invalid request: availability no longer exists or was already booked", "DynamoDB conditional check failed", aerr)
		}
		return errors.Wrap(500, "Temporary server error", "Failed to unmarshal DeleteItem result", err)
	}

	// DynamoDB conditional expression should ensure only one person can make it here
	// for the same availability object, so it is now safe to save the meeting.
	err = repo.SetMeeting(request)
	return err
}

// ScanAvailabilities returns a list of all Availabilities in the database, up to 1MB of data.
// startKey is an optional parameter that can be used to perform pagination.
// The list of availabilities and the next start key are returned.
func (repo *dynamoRepository) ScanAvailabilities(startKey string) ([]*Availability, string, error) {
	var exclusiveStartKey map[string]*dynamodb.AttributeValue
	if startKey != "" {
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
		}
	}

	input := &dynamodb.ScanInput{
		ExclusiveStartKey: exclusiveStartKey,
		TableName:         aws.String(availabilityTable),
	}
	result, err := repo.svc.Scan(input)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "DynamoDB Scan failure", err)
	}

	var availabilities []*Availability
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &availabilities)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Failed to unmarshal ScanAvailabilities result", err)
	}

	var lastKey string
	if len(result.LastEvaluatedKey) > 0 {
		b, err := json.Marshal(result.LastEvaluatedKey)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal ScanAvailabilities LastEvaluatedKey", err)
		}
		lastKey = string(b)
	}

	return availabilities, lastKey, nil
}
