package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

// NewsfeedEntry represents an entry in a user's news feed.
type NewsfeedEntry struct {
	// The id of the news feed this entry is part of. Usually this will be a user's username, but
	// it could also be a cohort or the special value `ALL_USERS`. This is the partition key
	// of the table.
	NewsfeedId string `dynamodbav:"newsfeedId" json:"newsfeedId"`

	// The sort key of the table, formatted as datetime_id, where datetime is the value of the
	// CreatedAt field and id is the value of the TimelineId field.
	SortKey string `dynamodbav:"sortKey" json:"sortKey"`

	// The date time the newsfeed entry was generated, formatted by time.RFC3339. This is the same
	// time as contained in the sort key.
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`

	// The user whose activity generated this news feed entry. This is the partition key of the
	// associated TimelineEntry.
	Poster string `dynamodbav:"poster" json:"poster"`

	// The id of the associated TimelineEntry.
	TimelineId string `dynamodbav:"timelineId" json:"timelineId"`
}

// PutNewsfeedEntries inserts the provided NewsfeedEntries into the database. The number of
// successfully inserted entries is returned.
func (repo *dynamoRepository) PutNewsfeedEntries(entries []NewsfeedEntry) (int, error) {
	return batchWriteObjects(repo, entries, newsfeedTable)
}

// ListNewsfeedEntries returns a list of NewsfeedEntries for the provided news feed ID. Usually
// the ID will be a user's username, but it could also be a cohort or the special value `ALL_USERS`.
func (repo *dynamoRepository) ListNewsfeedEntries(newsfeedId, startKey string, limit int) ([]NewsfeedEntry, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#newsfeedId = :newsfeedId"),
		ExpressionAttributeNames: map[string]*string{
			"#newsfeedId": aws.String("newsfeedId"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":newsfeedId": {
				S: &newsfeedId,
			},
		},
		ScanIndexForward: aws.Bool(false),
		TableName:        &newsfeedTable,
	}

	var entries []NewsfeedEntry
	lastKey, err := repo.query(input, startKey, &entries)
	if err != nil {
		return nil, "", err
	}
	return entries, lastKey, nil
}

type newsfeedQueryFunc func(startKey string) ([]NewsfeedEntry, string, error)

// DeleteNewsfeedEntries deletes the NewsfeedEntries with the provided poster and timelineId.
// The number of successfully deleted entries is returned.
func (repo *dynamoRepository) DeleteNewsfeedEntries(poster, timelineId string) (int, error) {
	return repo.deleteNewsfeedEntriesByQuery(func(startKey string) ([]NewsfeedEntry, string, error) {
		return repo.listNewsfeedEntriesByTimelineId(poster, timelineId, startKey)
	})
}

// deleteNewsfeedEntriesByQuery deletes all NewsfeedEntries returned by the given query function.
func (repo *dynamoRepository) deleteNewsfeedEntriesByQuery(queryFunc newsfeedQueryFunc) (int, error) {
	var deleteRequests []*dynamodb.WriteRequest
	deleted := 0

	var entries []NewsfeedEntry
	var startKey string
	var err error

	for ok := true; ok; ok = startKey != "" {
		entries, startKey, err = queryFunc(startKey)
		if err != nil {
			return deleted, errors.Wrap(500, "Temporary server error", "Failed to list newsfeed entries", err)
		}

		for _, e := range entries {
			req := &dynamodb.WriteRequest{
				DeleteRequest: &dynamodb.DeleteRequest{
					Key: map[string]*dynamodb.AttributeValue{
						"newsfeedId": {S: aws.String(e.NewsfeedId)},
						"sortKey":    {S: aws.String(e.SortKey)},
					},
				},
			}
			deleteRequests = append(deleteRequests, req)

			if len(deleteRequests) == 25 {
				if err := repo.batchWrite(deleteRequests, newsfeedTable); err != nil {
					return deleted, err
				}
				deleted += 25
				deleteRequests = nil
			}
		}
	}

	if len(deleteRequests) > 0 {
		if err := repo.batchWrite(deleteRequests, newsfeedTable); err != nil {
			return deleted, err
		}
		deleted += len(deleteRequests)
	}

	return deleted, nil
}

func (repo *dynamoRepository) listNewsfeedEntriesByTimelineId(poster, timelineId, startKey string) ([]NewsfeedEntry, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#poster = :poster AND #timelineId = :timelineId"),
		ExpressionAttributeNames: map[string]*string{
			"#poster":     aws.String("poster"),
			"#timelineId": aws.String("timelineId"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":poster": {
				S: aws.String(poster),
			},
			":timelineId": {
				S: aws.String(timelineId),
			},
		},
		IndexName: aws.String("PosterIndex"),
		TableName: &newsfeedTable,
	}

	var entries []NewsfeedEntry
	lastKey, err := repo.query(input, startKey, &entries)
	if err != nil {
		return nil, "", err
	}
	return entries, lastKey, nil
}

// RemovePosterFromNewsfeed deletes any entries from the provided newsfeed that were posted by the given poster.
func (repo *dynamoRepository) RemovePosterFromNewsfeed(newsfeedId, poster string) (int, error) {
	return repo.deleteNewsfeedEntriesByQuery(func(startKey string) ([]NewsfeedEntry, string, error) {
		return repo.listPosterInNewsfeed(newsfeedId, poster, startKey)
	})
}

func (repo *dynamoRepository) listPosterInNewsfeed(newsfeedId, poster, startKey string) ([]NewsfeedEntry, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#newsfeedId = :newsfeedId"),
		FilterExpression:       aws.String("#poster = :poster"),
		ExpressionAttributeNames: map[string]*string{
			"#newsfeedId": aws.String("newsfeedId"),
			"#poster":     aws.String("poster"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":poster": {
				S: aws.String(poster),
			},
			":newsfeedId": {
				S: aws.String(newsfeedId),
			},
		},
		TableName: &newsfeedTable,
	}

	var entries []NewsfeedEntry
	lastKey, err := repo.query(input, startKey, &entries)
	if err != nil {
		return nil, "", err
	}
	return entries, lastKey, nil
}
