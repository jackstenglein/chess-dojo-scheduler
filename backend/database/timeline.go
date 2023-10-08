package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type TimelineEntryKey struct {
	// The username of the user that created this timeline entry. Hash key
	// of the Timeline table.
	Owner string `dynamodbav:"owner" json:"owner"`

	// Range key of the Timeline table. Formatted as date_uuid. The date
	// is the date the entry was originally created, but cannot be changed
	// since it is part of the table's key. If the user wants to change the
	// date, the createdAt field should be changed instead.
	Id string `dynamodbav:"id" json:"id"`
}

type TimelineEntry struct {
	TimelineEntryKey

	// The display name of the user that created this timeline entry.
	OwnerDisplayName string `dynamodbav:"ownerDisplayName" json:"ownerDisplayName"`

	// The id of the requirement that the timeline entry applies to
	RequirementId string `dynamodbav:"requirementId" json:"requirementId"`

	// The name of the requirement that the timeline entry applies to
	RequirementName string `dynamodbav:"requirementName" json:"requirementName"`

	// The category of the requirement that the timeline entry applies to
	RequirementCategory string `dynamodbav:"requirementCategory" json:"requirementCategory"`

	// How the requirement should be displayed on the scoreboard.
	ScoreboardDisplay ScoreboardDisplay `dynamodbav:"scoreboardDisplay" json:"scoreboardDisplay"`

	// The requirement's progress bar suffix
	ProgressBarSuffix string `dynamodbav:"progressBarSuffix" json:"progressBarSuffix"`

	// The cohort the timeline entry applies to
	Cohort DojoCohort `dynamodbav:"cohort" json:"cohort"`

	// The total value of the requirement
	TotalCount int `dynamodbav:"totalCount" json:"totalCount"`

	// The value of the user's progress prior to the timeline entry
	PreviousCount int `dynamodbav:"previousCount" json:"previousCount"`

	// The value of the user's progress after the timeline entry
	NewCount int `dynamodbav:"newCount" json:"newCount"`

	// The number of minutes spent on the timeline entry
	MinutesSpent int `dynamodbav:"minutesSpent" json:"minutesSpent"`

	// The time the timeline entry was created
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
}

type TimelineEditor interface {
	// PutTimelineEntry saves the provided TimelineEntry into the database.
	PutTimelineEntry(entry *TimelineEntry) error

	// PutTimelineEntries inserts the provided TimelineEntries into the database. The number of
	// successfully inserted entries is returned.
	PutTimelineEntries(entries []*TimelineEntry) (int, error)

	// DeleteTimelineEntries deleted the provided TimelineEntries from the database. The number of
	// successfully deleted entries is returned.
	DeleteTimelineEntries(entries []*TimelineEntry) (int, error)
}

type TimelineLister interface {
	// ListTimelineEntries returns a list of TimelineEntries with the provided owner,
	// up to 1MB of data. startKey can be passed to perform pagination.
	ListTimelineEntries(owner string, startKey string) ([]*TimelineEntry, string, error)
}

// PutTimelineEntry saves the provided TimelineEntry into the database.
func (repo *dynamoRepository) PutTimelineEntry(entry *TimelineEntry) error {
	item, err := dynamodbattribute.MarshalMap(entry)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal timeline entry", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(timelineTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// PutTimelineEntries inserts the provided TimelineEntries into the database. The number of
// successfully inserted entries is returned.
func (repo *dynamoRepository) PutTimelineEntries(entries []*TimelineEntry) (int, error) {
	return batchWriteObjects(repo, entries, timelineTable)
}

// ListTimelineEntries returns a list of TimelineEntries with the provided owner,
// up to 1MB of data. startKey can be passed to perform pagination.
func (repo *dynamoRepository) ListTimelineEntries(owner string, startKey string) ([]*TimelineEntry, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#owner = :owner"),
		ExpressionAttributeNames: map[string]*string{
			"#owner": aws.String("owner"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":owner": {S: aws.String(owner)},
		},
		TableName:        aws.String(timelineTable),
		ScanIndexForward: aws.Bool(false),
	}

	var entries []*TimelineEntry
	lastKey, err := repo.query(input, startKey, &entries)
	if err != nil {
		return nil, "", err
	}
	return entries, lastKey, nil
}

// DeleteTimelineEntries deleted the provided TimelineEntries from the database. The number of
// successfully deleted entries is returned.
func (repo *dynamoRepository) DeleteTimelineEntries(entries []*TimelineEntry) (int, error) {
	var deleteRequests []*dynamodb.WriteRequest
	deleted := 0

	for _, e := range entries {
		req := &dynamodb.WriteRequest{
			DeleteRequest: &dynamodb.DeleteRequest{
				Key: map[string]*dynamodb.AttributeValue{
					"owner": {S: aws.String(e.Owner)},
					"id":    {S: aws.String(e.Id)},
				},
			},
		}
		deleteRequests = append(deleteRequests, req)

		if len(deleteRequests) == 25 {
			if err := repo.batchWrite(deleteRequests, timelineTable); err != nil {
				return deleted, err
			}
			deleted += 25
			deleteRequests = nil
		}
	}

	if len(deleteRequests) > 0 {
		if err := repo.batchWrite(deleteRequests, timelineTable); err != nil {
			return deleted, err
		}
		deleted += len(deleteRequests)
	}

	return deleted, nil
}
