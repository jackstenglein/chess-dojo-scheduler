package database

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
)

type UserCreator interface {
	// CreateUser creates a new User object with the provided information.
	CreateUser(username, email, name string) (*User, error)
}

type UserGetter interface {
	// GetUser returns the User object with the provided username.
	GetUser(username string) (*User, error)
}

type UserSetter interface {
	UserGetter

	// SetUser saves the provided User object into the database.
	SetUser(user *User) error
}

type AvailabilitySetter interface {
	// SetAvailablity inserts the provided availability into the database.
	SetAvailability(availability *Availability) error
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

	// GetAvailabilitiesByTime returns a list of Availabilities matching the provided start and end time.
	// Availabilities owned by the calling user are filtered out of the result list, as are availabilities
	// that are not bookable by the caller's cohort. user, startTime, endTime and limit are required parameters.
	// startKey is optional. The list of availabilities and the next start key are returned.
	GetAvailabilitiesByTime(caller *User, startTime, endTime string, limit int, startKey string) ([]*Availability, string, error)
}

type MeetingGetter interface {
	UserGetter

	// GetMeeting returns the meeting with the provided id.
	GetMeeting(id string) (*Meeting, error)
}

type MeetingLister interface {
	// ListMeetings returns a list of Meetings matching the provided username.
	// username and limit are required parameters. startKey is optional.
	// The list of meetings and the next start key are returned.
	ListMeetings(username string, limit int, startKey string) ([]*Meeting, string, error)
}

// dynamoRepository implements a database using AWS DynamoDB.
type dynamoRepository struct {
	svc *dynamodb.DynamoDB
}

// DynamoDB implements the UserRepository interface using AWS DynamoDB
// as the data store.
var DynamoDB = &dynamoRepository{
	svc: dynamodb.New(session.New()),
}

var userTable = os.Getenv("stage") + "-users"
var availabilityTable = os.Getenv("stage") + "-availabilities"
var meetingTable = os.Getenv("stage") + "-meetings"

// CreateUser creates a new User object with the provided information.
func (repo *dynamoRepository) CreateUser(username, email, name string) (*User, error) {
	user := &User{
		Username: username,
		Email:    email,
		Name:     name,
	}

	err := repo.setUserConditional(user, aws.String("attribute_not_exists(username)"))
	return user, err
}

// SetUser saves the provided User object in the database.
func (repo *dynamoRepository) SetUser(user *User) error {
	return repo.setUserConditional(user, nil)
}

// setUserConditional saves the provided User object in the database using an optional condition statement.
func (repo *dynamoRepository) setUserConditional(user *User, condition *string) error {
	item, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal user", err)
	}

	input := &dynamodb.PutItemInput{
		ConditionExpression: condition,
		Item:                item,
		TableName:           aws.String(userTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// GetUser returns the User object with the provided username.
func (repo *dynamoRepository) GetUser(username string) (*User, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"username": {
				S: aws.String(username),
			},
		},
		TableName: aws.String(userTable),
	}

	result, err := repo.svc.GetItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}

	if result.Item == nil {
		return nil, errors.New(404, "Invalid request: user not found", "GetUser result.Item is nil")
	}

	user := User{}
	err = dynamodbattribute.UnmarshalMap(result.Item, &user)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetUser result", err)
	}
	return &user, nil
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
		ExpressionAttributeNames: map[string]*string{"#owner": aws.String("owner")},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":username": {
				S: aws.String(username),
			},
		},
		KeyConditionExpression: aws.String("#owner = :username"),
		Limit:                  aws.Int64(int64(limit)),
		TableName:              aws.String(availabilityTable),
	}

	return repo.fetchAvailabilities(input, startKey)
}

// GetAvailabilitiesByTime returns a list of Availabilities matching the provided start and end time.
// Availabilities owned by the calling username are filtered out of the result list. username, startTime,
// endTime and limit are required parameters. startKey is optional. The list of availabilities and
// the next start key are returned.
func (repo *dynamoRepository) GetAvailabilitiesByTime(user *User, startTime, endTime string, limit int, startKey string) ([]*Availability, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#status = :scheduled AND startTime BETWEEN :startTime AND :endTime"),
		ExpressionAttributeNames: map[string]*string{
			"#status":  aws.String("status"),
			"#owner":   aws.String("owner"),
			"#cohorts": aws.String("cohorts"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":scheduled": {
				S: aws.String("SCHEDULED"),
			},
			":startTime": {
				S: aws.String(startTime),
			},
			":endTime": {
				S: aws.String(endTime),
			},
			":username": {
				S: aws.String(user.Username),
			},
			":callerCohort": {
				S: aws.String(string(user.DojoCohort)),
			},
		},
		FilterExpression: aws.String("#owner <> :username AND contains(#cohorts, :callerCohort)"),
		Limit:            aws.Int64(int64(limit)),
		IndexName:        aws.String("SearchIndex"),
		TableName:        aws.String(availabilityTable),
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
// object is deleted and the Meeting object is saved in its place.
func (repo *dynamoRepository) BookAvailability(availability *Availability, request *Meeting) error {
	// First delete the availability to make sure nobody else can book it
	if err := repo.DeleteAvailability(availability.Owner, availability.Id); err != nil {
		return err
	}

	// DynamoDB conditional expression should ensure only one person can make it here
	// for the same availability object, so it is now safe to save the meeting.
	err := repo.SetMeeting(request)
	return err
}

// SetMeeting inserts the provided Meeting into the database.
func (repo *dynamoRepository) SetMeeting(meeting *Meeting) error {
	item, err := dynamodbattribute.MarshalMap(meeting)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal meeting", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(meetingTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed Dynamo PutItem request", err)
}

// GetMeeting returns the meeting with the provided id.
func (repo *dynamoRepository) GetMeeting(id string) (*Meeting, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(meetingTable),
	}

	result, err := repo.svc.GetItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetMeeting failure", err)
	}

	if result.Item == nil {
		return nil, errors.New(404,
			fmt.Sprintf("Invalid request: meeting id `%s` not found", id),
			"GetMeeting result.Item is nil")
	}

	meeting := Meeting{}
	if err = dynamodbattribute.UnmarshalMap(result.Item, &meeting); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetMeeting result", err)
	}
	return &meeting, nil
}

func (repo *dynamoRepository) fetchMeetings(input *dynamodb.QueryInput, startKey string) ([]*Meeting, string, error) {
	if startKey != "" {
		var exclusiveStartKey map[string]*dynamodb.AttributeValue
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
		}
		input.SetExclusiveStartKey(exclusiveStartKey)
	}

	log.Debugf("Meeting Query input: %v", input)

	result, err := repo.svc.Query(input)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "DynamoDB Query failure", err)
	}
	log.Debugf("Meeting query result: %v", result)

	var meetings []*Meeting
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &meetings)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Failed to unmarshal DynamoDB Query result", err)
	}

	var lastKey string
	if len(result.LastEvaluatedKey) > 0 {
		b, err := json.Marshal(result.LastEvaluatedKey)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal DynamoDB Query LastEvaluatedKey", err)
		}
		lastKey = string(b)
	}

	return meetings, lastKey, nil
}

type listMeetingsStartKey struct {
	OwnerKey       string `json:"ownerKey"`
	ParticipantKey string `json:"participantKey"`
}

// ListMeetings returns a list of Meetings matching the provided username.
// username and limit are required parameters. startKey is optional.
// The list of meetings and the next start key are returned.
func (repo *dynamoRepository) ListMeetings(username string, limit int, startKey string) ([]*Meeting, string, error) {

	// We don't know if the calling user is the owner or participant in the meeting, so we have to query both indices
	// and combine the results

	startKeys := &listMeetingsStartKey{}
	if startKey != "" {
		err := json.Unmarshal([]byte(startKey), startKeys)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
		}
	}

	lastKeys := listMeetingsStartKey{}
	var meetings []*Meeting

	if startKey == "" || startKeys.OwnerKey != "" {
		ownerInput := &dynamodb.QueryInput{
			KeyConditionExpression: aws.String("#owner = :username"),
			ExpressionAttributeNames: map[string]*string{
				"#owner": aws.String("owner"),
			},
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":username": {
					S: aws.String(username),
				},
			},
			Limit:     aws.Int64(int64(limit)),
			IndexName: aws.String("OwnerIndex"),
			TableName: aws.String(meetingTable),
		}
		ownerMeetings, ownerLastKey, err := repo.fetchMeetings(ownerInput, startKeys.OwnerKey)
		if err != nil {
			return nil, "", err
		}

		meetings = append(meetings, ownerMeetings...)
		lastKeys.OwnerKey = ownerLastKey
	}

	if startKey == "" || startKeys.ParticipantKey != "" {
		participantInput := &dynamodb.QueryInput{
			KeyConditionExpression: aws.String("#participant = :username"),
			ExpressionAttributeNames: map[string]*string{
				"#participant": aws.String("participant"),
			},
			ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
				":username": {
					S: aws.String(username),
				},
			},
			Limit:     aws.Int64(int64(limit)),
			IndexName: aws.String("ParticipantIndex"),
			TableName: aws.String(meetingTable),
		}
		participantMeetings, participantLastKey, err := repo.fetchMeetings(participantInput, startKeys.OwnerKey)
		if err != nil {
			return nil, "", err
		}

		meetings = append(meetings, participantMeetings...)
		lastKeys.ParticipantKey = participantLastKey
	}

	var lastKey string
	if lastKeys.OwnerKey != "" || lastKeys.ParticipantKey != "" {
		b, err := json.Marshal(&lastKeys)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal listMeetingsStartKey", err)
		}
		lastKey = string(b)
	}

	return meetings, lastKey, nil
}
