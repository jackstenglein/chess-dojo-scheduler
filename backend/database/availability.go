package database

import (
	"encoding/json"
	"strconv"

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

func GetDisplayName(t AvailabilityType) string {
	switch t {
	case "CLASSICAL_GAME":
		return "Classical Game"
	case "OPENING_SPARRING":
		return "Opening Sparring"
	case "MIDDLEGAME_SPARRING":
		return "Middlegame Sparring"
	case "ENDGAME_SPARRING":
		return "Endgame Sparring"
	case "ROOK_ENDGAME_PROGRESSION":
		return "Rook Endgame Progression"
	case "CLASSIC_ANALYSIS":
		return "Analyze Classic Game"
	case "ANALYZE_OWN_GAME":
		return "Analyze Own Game"
	case "BOOK_STUDY":
		return "Book Study"
	default:
		return "Unknown"
	}
}

func GetDisplayNames(types []AvailabilityType) []string {
	result := make([]string, 0, len(types))
	for _, t := range types {
		result = append(result, GetDisplayName(t))
	}
	return result
}

// Represents the scheduling status for availabilities and meetings.
type SchedulingStatus string

const (
	Scheduled SchedulingStatus = "SCHEDULED"
	Booked    SchedulingStatus = "BOOKED"
	Canceled  SchedulingStatus = "CANCELED"
)

type Participant struct {
	// The Cognito username of the participant.
	Username string `dynamodbav:"username" json:"username"`

	// The Discord username of the participant.
	Discord string `dynamodbav:"discord" json:"discord"`

	// The Dojo cohort of the participant.
	Cohort DojoCohort `dynamodbav:"cohort" json:"cohort"`
}

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
	Status SchedulingStatus `dynamodbav:"status" json:"status"`

	// Contains either a zoom link, discord, discord classroom, etc.
	Location string `dynamodbav:"location" json:"location"`

	// An optional description for sparring positions, etc.
	Description string `dynamodbav:"description" json:"description"`

	// The maximum number of people that can join the meeting.
	MaxParticipants int `dynamodbav:"maxParticipants" json:"maxParticipants"`

	// A list containing the participants in the availability
	Participants []*Participant `dynamodbav:"participants" json:"participants"`

	// The ID of the Discord notification message for this availability
	DiscordMessageId string `dynamodbav:"discordMessageId" json:"discordMessageId"`
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

	// BookGroupAvailability adds the given user to the given group availability. The request only succeeds if the
	// Availability is not fully booked.
	BookGroupAvailability(availability *Availability, user *User) (*Availability, error)

	// RecordMeetingCreation saves statistics on the created meeting.
	RecordMeetingCreation(meeting *Meeting, ownerCohort, participantCohort DojoCohort) error

	// RecordGroupJoin saves statistics on a group meeting join.
	RecordGroupJoin(cohort DojoCohort) error
}

type AvailabilityDeleter interface {
	// DeleteAvailability deletes the given availability object. An error is returned if it does not exist.
	DeleteAvailability(owner, id string) (*Availability, error)

	// RecordAvailabilityDeletion saves statistics on the deleted availability.
	RecordAvailabilityDeletion(availability *Availability) error
}

type AvailabilitySearcher interface {
	UserGetter

	// ListAvailabilitiesByOwner returns a list of Availabilities matching the provided owner username.
	// username is required and startKey is optional. The list of availabilities and
	// the next start key are returned.
	ListAvailabilitiesByOwner(username, startKey string) ([]*Availability, string, error)

	// ListAvailabilitiesByTime returns a list of Availabilities where the Availability endTime >= the startTime
	// parameter. Availabilities owned by the calling username are filtered out of the result list. caller and
	// startTime are required parameters. startKey is optional. The list of availabilities and
	// the next start key are returned.
	ListAvailabilitiesByTime(caller *User, startTime, startKey string) ([]*Availability, string, error)
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

	// Hack to work around https://github.com/aws/aws-sdk-go/issues/682
	if len(availability.Participants) == 0 {
		emptyList := make([]*dynamodb.AttributeValue, 0)
		item["participants"] = &dynamodb.AttributeValue{L: emptyList}
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
	availability := Availability{}

	if err := repo.getItem(input, &availability); err != nil {
		return nil, err
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

// ListAvailabilitiesByOwner returns a list of Availabilities matching the provided owner username.
// username is required and startKey is optional. The list of availabilities and
// the next start key are returned.
func (repo *dynamoRepository) ListAvailabilitiesByOwner(username, startKey string) ([]*Availability, string, error) {
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
		TableName:              aws.String(availabilityTable),
	}

	return repo.fetchAvailabilities(input, startKey)
}

// ListAvailabilitiesByTime returns a list of Availabilities where the Availability endTime >= the startTime
// parameter. Availabilities owned by the calling username are filtered out of the result list. caller and
// startTime are required parameters. startKey is optional. The list of availabilities and
// the next start key are returned.
func (repo *dynamoRepository) ListAvailabilitiesByTime(user *User, startTime, startKey string) ([]*Availability, string, error) {
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
		IndexName:                 aws.String("EndSearchIndex"),
		TableName:                 aws.String(availabilityTable),
	}

	return repo.fetchAvailabilities(input, startKey)
}

// ListGroupAvailabilities returns a list of Availabilities where the participants list contains the user.
// user and startTime are required parameters. startKey is optional. The list of availabilities and the
// next start key are returned.
func (repo *dynamoRepository) ListGroupAvailabilities(user *User, startTime, startKey string) ([]*Availability, string, error) {
	participant := &Participant{
		Username: user.Username,
		Discord:  user.DiscordUsername,
		Cohort:   user.DojoCohort,
	}
	p, err := dynamodbattribute.MarshalMap(participant)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Unable to marshal participant", err)
	}

	input := &dynamodb.ScanInput{
		ExpressionAttributeNames: map[string]*string{
			"#p": aws.String("participants"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":statistics": {
				S: aws.String("STATISTICS"),
			},
			":p": {
				M: p,
			},
			":startTime": {
				S: aws.String(startTime),
			},
		},
		FilterExpression: aws.String("id <> :statistics AND attribute_exists(#p) AND contains(#p, :p) AND endTime >= :startTime"),
		TableName:        aws.String(availabilityTable),
	}

	if startKey != "" {
		var exclusiveStartKey map[string]*dynamodb.AttributeValue
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled from json", err)
		}
		input.SetExclusiveStartKey(exclusiveStartKey)
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

// DeleteAvailability deletes the given availability object. An error is returned if it does not exist.
func (repo *dynamoRepository) DeleteAvailability(owner, id string) (*Availability, error) {
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
		ReturnValues: aws.String("ALL_OLD"),
		TableName:    aws.String(availabilityTable),
	}

	result, err := repo.svc.DeleteItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(404, "Invalid request: availability does not exist or is already booked", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal DeleteItem result", err)
	}

	availability := Availability{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &availability); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetAvailability result", err)
	}
	return &availability, nil
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

	// Manually set discordMessageId to empty string because the message will be deleted after
	// the booking completes
	item["discordMessageId"] = &dynamodb.AttributeValue{S: aws.String("")}

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

// BookGroupAvailability adds the given user to the given group availability. The request only succeeds if the
// Availability is not fully booked.
func (repo *dynamoRepository) BookGroupAvailability(availability *Availability, user *User) (*Availability, error) {
	participant := &Participant{
		Username: user.Username,
		Discord:  user.DiscordUsername,
		Cohort:   user.DojoCohort,
	}
	p, err := dynamodbattribute.MarshalMap(participant)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal participant", err)
	}

	updateExpr := "SET #p = list_append(#p, :p)"
	exprAttrNames := map[string]*string{
		"#p": aws.String("participants"),
	}
	exprAttrValues := map[string]*dynamodb.AttributeValue{
		":p": {
			L: []*dynamodb.AttributeValue{
				{M: p},
			},
		},
		":s": {
			N: aws.String(strconv.Itoa(availability.MaxParticipants)),
		},
	}

	if len(availability.Participants) == availability.MaxParticipants-1 {
		updateExpr += ", #status = :booked, #discordMessageId = :empty"
		exprAttrNames["#status"] = aws.String("status")
		exprAttrValues[":booked"] = &dynamodb.AttributeValue{
			S: aws.String(string(Booked)),
		}
		exprAttrNames["#discordMessageId"] = aws.String("discordMessageId")
		exprAttrValues[":empty"] = &dynamodb.AttributeValue{S: aws.String("")}
	}

	input := &dynamodb.UpdateItemInput{
		ConditionExpression:       aws.String("attribute_exists(id) AND size(#p) < :s"),
		ExpressionAttributeNames:  exprAttrNames,
		ExpressionAttributeValues: exprAttrValues,
		Key: map[string]*dynamodb.AttributeValue{
			"owner": {
				S: aws.String(availability.Owner),
			},
			"id": {
				S: aws.String(availability.Id),
			},
		},
		UpdateExpression: aws.String(updateExpr),
		ReturnValues:     aws.String("ALL_NEW"),
		TableName:        aws.String(availabilityTable),
	}

	result, err := repo.svc.UpdateItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(400, "Invalid request: availability no longer exists or was already fully booked", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem call", err)
	}

	a := Availability{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &a); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal BookGroupAvailability result", err)
	}
	return &a, nil
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
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":statistics": {
				S: aws.String("STATISTICS"),
			},
		},
		FilterExpression: aws.String("id <> :statistics"),
		TableName:        aws.String(availabilityTable),
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
