package database

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
