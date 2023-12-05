package database

import (
	"strconv"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
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

// IsValid returns true if the provided availability type is valid.
func (t AvailabilityType) IsValid() bool {
	for _, t2 := range availabilityTypes {
		if t == t2 {
			return true
		}
	}
	return false
}

// GetDisplayName returns the display name for the provided availability type.
func (t AvailabilityType) GetDisplayName() string {
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

// GetDisplayNames returns a list of the availability type display names.
func GetDisplayNames(types []AvailabilityType) []string {
	result := make([]string, 0, len(types))
	for _, t := range types {
		result = append(result, t.GetDisplayName())
	}
	return result
}

type EventType string

const (
	EventTypeAvailability   EventType = "AVAILABILITY"
	EventTypeDojo           EventType = "DOJO"
	EventTypeLigaTournament EventType = "LIGA_TOURNAMENT"
)

// SchedulingStatus represents the status for events.
type SchedulingStatus string

const (
	Scheduled SchedulingStatus = "SCHEDULED"
	Booked    SchedulingStatus = "BOOKED"
	Canceled  SchedulingStatus = "CANCELED"
)

const EventTypeDojoOwner = "Sensei"

type Participant struct {
	// The Cognito username of the participant.
	Username string `dynamodbav:"username" json:"username"`

	// The display name of the participant.
	DisplayName string `dynamodbav:"displayName" json:"displayName"`

	// The Dojo cohort of the participant.
	Cohort DojoCohort `dynamodbav:"cohort" json:"cohort"`

	// The cohort the participant most recently graduated from
	PreviousCohort DojoCohort `dynamodbav:"previousCohort" json:"previousCohort"`
}

type Event struct {
	// A v4 UUID identifying this event or the Lichess id for LigaTournaments.
	Id string `dynamodbav:"id" json:"id"`

	// The type of the event.
	Type EventType `dynamodbav:"type" json:"type"`

	// The username of the creator of this event, or `Sensei` if the event
	// is an admin event.
	Owner string `dynamodbav:"owner" json:"owner"`

	// The display name of the owner, or `Sensei` if the event is an admin event.
	OwnerDisplayName string `dynamodbav:"ownerDisplayName" json:"ownerDisplayName"`

	// The cohort of the owner or an empty string if the event is an admin event.
	OwnerCohort DojoCohort `dynamodbav:"ownerCohort" json:"ownerCohort"`

	// The cohort the owner most recently graduated from, or an empty string
	// if the event is an admin event.
	OwnerPreviousCohort DojoCohort `dynamodbav:"ownerPreviousCohort" json:"ownerPreviousCohort"`

	// The title of the event. This field is only used if the event is an admin event.
	Title string `dynamodbav:"title" json:"title"`

	// The time the event starts, in full ISO-8601 format. For availabilities,
	// this is the earliest that the owner is willing to start their game/meeting.
	StartTime string `dynamodbav:"startTime" json:"startTime"`

	// The time the event ends, in full ISO-8601 format. For availabilities,
	// this is the latest that the owner is willing to start their game/meeting.
	EndTime string `dynamodbav:"endTime" json:"endTime"`

	// The booked time chosen for 1 on 1 events. This field is unused if the
	// event is an admin event
	BookedStartTime string `dynamodbav:"bookedStartTime" json:"bookedStartTime"`

	// The time that the event will be deleted from the database. This is set
	// to 48 hours after the end time for most events. For LigaTournaments,
	// this is set to 1 week after the end time.
	ExpirationTime int64 `dynamodbav:"expirationTime" json:"-"`

	// The game/meeting types that the owner is willing to play. This field is
	// unused if the event is an admin event.
	Types []AvailabilityType `dynamodbav:"types" json:"types"`

	// The booked type chosen for 1 on 1 events. This field is unused if the
	// event is an admin event.
	BookedType AvailabilityType `dynamodbav:"bookedType" json:"bookedType"`

	// The dojo cohorts for which the event is viewable/bookable.
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohorts"`

	// The status of the event.
	Status SchedulingStatus `dynamodbav:"status" json:"status"`

	// Contains either a zoom link, discord, discord classroom, Lichess url, etc.
	Location string `dynamodbav:"location" json:"location"`

	// An optional description for sparring positions, etc.
	Description string `dynamodbav:"description" json:"description"`

	// The maximum number of people that can join the meeting. This field is
	// unused if the event is an admin event.
	MaxParticipants int `dynamodbav:"maxParticipants" json:"maxParticipants"`

	// A map from a participant username to the participant data. This field is unused
	// if the event is an admin event.
	Participants map[string]*Participant `dynamodbav:"participants" json:"participants"`

	// The ID of the Discord notification message for this event. This field
	// is unused if the event is an admin event.
	DiscordMessageId string `dynamodbav:"discordMessageId" json:"discordMessageId"`

	// The ID of the private Discord guild event for this event. This field is unused if
	// type is EventTypeAvailability.
	PrivateDiscordEventId string `dynamodbav:"privateDiscordEventId" json:"privateDiscordEventId"`

	// The ID of the public Discord guild event for this event. This field is unused if
	// type is EventTypeAvailability.
	PublicDiscordEventId string `dynamodbav:"publicDiscordEventId" json:"publicDiscordEventId"`

	// The LigaTournament information for this event. Only present for LigaTournaments.
	LigaTournament *LigaTournament `dynamodbav:"ligaTournament,omitempty" json:"ligaTournament,omitempty"`
}

type TimeControlType string

const (
	TimeControlType_Blitz     TimeControlType = "BLITZ"
	TimeControlType_Rapid     TimeControlType = "RAPID"
	TimeControlType_Classical TimeControlType = "CLASSICAL"
)

type LigaTournament struct {
	// The type of the tournament (IE: Swiss or Arena)
	Type TournamentType `dynamodbav:"type" json:"type"`

	// The Lichess id of the tournament
	Id string `dynamodbav:"id" json:"id"`

	// Whether the tournament is rated or not
	Rated bool `dynamodbav:"rated" json:"rated"`

	// The time control type of the tournament (blitz, rapid, classical)
	TimeControlType TimeControlType `dynamodbav:"timeControlType" json:"timeControlType"`

	// The initial time limit in seconds
	LimitSeconds int `dynamodbav:"limitSeconds" json:"limitSeconds"`

	// The time increment in seconds
	IncrementSeconds int `dynamodbav:"incrementSeconds" json:"incrementSeconds"`

	// The FEN of the starting position, if the tournament uses a custom position
	Fen string `dynamodbav:"fen,omitempty" json:"fen,omitempty"`

	// The number of rounds in the tournament. Only present for Swiss tournaments.
	NumRounds int `dynamodbav:"numRounds,omitempty" json:"numRounds,omitempty"`

	// The current round this LigaTournament object refers to. Only present for monthly Swiss tournaments.
	CurrentRound int `dynamodbav:"currentRound,omitempty" json:"currentRound,omitempty"`
}

type EventSetter interface {
	UserGetter

	// SetEvent inserts the provided Event into the database.
	SetEvent(event *Event) error

	// RecordEventCreation saves statistics on the created event.
	RecordEventCreation(event *Event) error
}

type EventGetter interface {
	// GetEvent returns the event object with the provided id.
	GetEvent(id string) (*Event, error)
}

type EventCanceler interface {
	EventGetter

	// CancelEvent marks the provided event as canceled. The updated event is
	// returned.
	CancelEvent(event *Event) (*Event, error)

	// RecordEventCancelation saves statistics on the canceled event.
	RecordEventCancelation(event *Event) error
}

type EventDeleter interface {
	UserGetter
	EventGetter

	// DeleteEvent deletes the event with the given id. The deleted
	// event is returned. An error is returned if it does not exist or is booked.
	DeleteEvent(id string) (*Event, error)

	// RecordEventDeletion saves statistics on the deleted event.
	RecordEventDeletion(event *Event) error
}

type EventBooker interface {
	UserGetter
	EventGetter

	// BookEvent adds the given user as a participant to the given event.
	// The request only succeeds if the Event is not already fully booked.
	// startTime and aType are only used if the Event is of type EventTypeAvailability
	// and has MaxParticipants set to 1.
	BookEvent(event *Event, user *User, startTime string, aType AvailabilityType) (*Event, error)

	// RecordEventBooking saves statistics on an event booking.
	RecordEventBooking(event *Event) error
}

type EventLister interface {
	// ScanEvents returns a list of all Events in the database, up to 1MB of data.
	// If public is true, only public events will be included in the results.
	// startKey is an optional parameter that can be used to perform pagination.
	// The list of meetings and the next start key are returned.
	ScanEvents(public bool, startKey string) ([]*Event, string, error)
}

// SetEvent inserts the provided Event into the database.
func (repo *dynamoRepository) SetEvent(event *Event) error {
	if event.Id == "STATISTICS" {
		return errors.New(403, "Invalid request: user does not have permission to set event statistics", "")
	}

	item, err := dynamodbattribute.MarshalMap(event)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal event", err)
	}

	// Hack to work around https://github.com/aws/aws-sdk-go/issues/682
	if len(event.Participants) == 0 {
		emptyMap := make(map[string]*dynamodb.AttributeValue)
		item["participants"] = &dynamodb.AttributeValue{M: emptyMap}
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(eventTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed Dynamo PutItem request", err)
}

// GetEvent returns the event object with the provided id.
func (repo *dynamoRepository) GetEvent(id string) (*Event, error) {
	if id == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: user does not have permission to get event statistics", "")
	}

	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(eventTable),
	}

	event := Event{}
	if err := repo.getItem(input, &event); err != nil {
		return nil, err
	}
	return &event, nil
}

// DeleteEvent deletes the event with the given id. The deleted
// event is returned. An error is returned if it does not exist or is booked.
// TODO: throw an error if the event is booked.
func (repo *dynamoRepository) DeleteEvent(id string) (*Event, error) {
	if id == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: user does not have permission to delete event statistics", "")
	}

	input := &dynamodb.DeleteItemInput{
		ConditionExpression: aws.String("attribute_exists(id)"),
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(id),
			},
		},
		ReturnValues: aws.String("ALL_OLD"),
		TableName:    aws.String(eventTable),
	}

	result, err := repo.svc.DeleteItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(404, "Invalid request: event does not exist", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed Dynamo DeleteItem call", err)
	}

	event := Event{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &event); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal DeleteItem result", err)
	}
	return &event, nil
}

// BookEvent adds the given user as a participant to the given event.
// The request only succeeds if the Event is not already fully booked.
// startTime and aType are only used if the Event is of type EventTypeAvailability
// and has MaxParticipants set to 1.
func (repo *dynamoRepository) BookEvent(event *Event, user *User, startTime string, aType AvailabilityType) (*Event, error) {
	if event.Id == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: event statistics cannot be booked", "")
	}

	participant := &Participant{
		Username:       user.Username,
		DisplayName:    user.DisplayName,
		Cohort:         user.DojoCohort,
		PreviousCohort: user.PreviousCohort,
	}
	p, err := dynamodbattribute.MarshalMap(participant)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal participant", err)
	}

	updateExpr := "SET #p.#u = :p"
	exprAttrNames := map[string]*string{
		"#p":      aws.String("participants"),
		"#u":      aws.String(user.Username),
		"#status": aws.String("status"),
	}
	exprAttrValues := map[string]*dynamodb.AttributeValue{
		":p": {M: p},
		":maxP": {
			N: aws.String(strconv.Itoa(event.MaxParticipants)),
		},
		":scheduled": {
			S: aws.String(string(Scheduled)),
		},
	}

	if len(event.Participants) == event.MaxParticipants-1 {
		updateExpr += ", #status = :booked, #discordMessageId = :empty"
		exprAttrNames["#status"] = aws.String("status")
		exprAttrValues[":booked"] = &dynamodb.AttributeValue{
			S: aws.String(string(Booked)),
		}
		exprAttrNames["#discordMessageId"] = aws.String("discordMessageId")
		exprAttrValues[":empty"] = &dynamodb.AttributeValue{S: aws.String("")}
	}

	if event.Type == EventTypeAvailability && event.MaxParticipants == 1 {
		exprAttrNames["#time"] = aws.String("bookedStartTime")
		exprAttrValues[":time"] = &dynamodb.AttributeValue{
			S: aws.String(startTime),
		}
		exprAttrNames["#type"] = aws.String("bookedType")
		exprAttrValues[":type"] = &dynamodb.AttributeValue{
			S: aws.String(string(aType)),
		}
		updateExpr += ", #time = :time, #type = :type"
	}

	input := &dynamodb.UpdateItemInput{
		ConditionExpression:       aws.String("attribute_exists(id) AND #status = :scheduled AND size(#p) < :maxP"),
		ExpressionAttributeNames:  exprAttrNames,
		ExpressionAttributeValues: exprAttrValues,
		Key: map[string]*dynamodb.AttributeValue{
			"id": {
				S: aws.String(event.Id),
			},
		},
		UpdateExpression: aws.String(updateExpr),
		ReturnValues:     aws.String("ALL_NEW"),
		TableName:        aws.String(eventTable),
	}

	result, err := repo.svc.UpdateItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(400, "Invalid request: event no longer exists or is already fully booked", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem call", err)
	}

	e := Event{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &e); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal UpdateItem result", err)
	}
	return &e, nil
}

// CancelEvent marks the provided event as canceled. The updated event is
// returned.
func (repo *dynamoRepository) CancelEvent(event *Event) (*Event, error) {
	if event.Id == "STATISTICS" {
		return nil, errors.New(403, "Invalid request: event statistics cannot be canceled", "")
	}

	event.Status = Canceled
	if err := repo.SetEvent(event); err != nil {
		return nil, err
	}
	return event, nil
}

// ScanEvents returns a list of all Events in the database, up to 1MB of data.
// startKey is an optional parameter that can be used to perform pagination.
// The list of meetings and the next start key are returned.
func (repo *dynamoRepository) ScanEvents(public bool, startKey string) ([]*Event, string, error) {
	filterExpression := "id <> :statistics"
	if public {
		filterExpression += " AND #type <> :availability"
	}

	input := &dynamodb.ScanInput{
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":statistics": {
				S: aws.String("STATISTICS"),
			},
		},
		FilterExpression: aws.String(filterExpression),
		TableName:        aws.String(eventTable),
	}

	if public {
		input.ExpressionAttributeValues[":availability"] = &dynamodb.AttributeValue{
			S: aws.String(string(EventTypeAvailability)),
		}
		input.ExpressionAttributeNames = map[string]*string{
			"#type": aws.String("type"),
		}
	}

	var events []*Event
	lastKey, err := repo.scan(input, startKey, &events)
	if err != nil {
		return nil, "", err
	}
	return events, lastKey, nil
}
