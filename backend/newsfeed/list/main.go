package main

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "newsfeed-list-handler"

var repository = database.DynamoDB

type listNewsfeedStartKey struct {
	UserKey     string `json:"userKey"`
	CohortKey   string `json:"cohortKey"`
	AllUsersKey string `json:"allUsersKey"`
}

type ListNewsfeedResponse struct {
	Entries          []database.TimelineEntry `json:"entries"`
	LastEvaluatedKey string                   `json:"lastEvaluatedKey,omitempty"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		err := errors.New(400, "Invalid request: username is required", "")
		return api.Failure(funcName, err), nil
	}

	timelineEntries := make(map[string]database.TimelineEntryKey)

	cohort := event.QueryStringParameters["cohort"]
	startKey := event.QueryStringParameters["startKey"]
	startKeys := listNewsfeedStartKey{}
	if startKey != "" {
		if err := json.Unmarshal([]byte(startKey), &startKeys); err != nil {
			err = errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled", err)
			return api.Failure(funcName, err), nil
		}
	}
	lastKeys := listNewsfeedStartKey{}

	if startKey == "" || startKeys.UserKey != "" {
		if err := fetchEntries(info.Username, startKeys.UserKey, timelineEntries, &lastKeys.UserKey); err != nil {
			return api.Failure(funcName, err), nil
		}
	}

	if (cohort != "") && (startKey == "" || startKeys.CohortKey != "") {
		if err := fetchEntries(cohort, startKeys.CohortKey, timelineEntries, &lastKeys.CohortKey); err != nil {
			return api.Failure(funcName, err), nil
		}
	}

	log.Debugf("Fetching timeline entries: %#v", timelineEntries)

	resultEntries, err := repository.BatchGetTimelineEntries(timelineEntries)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	var lastKey string
	if lastKeys.UserKey != "" || lastKeys.CohortKey != "" {
		b, err := json.Marshal(&lastKeys)
		if err != nil {
			err = errors.Wrap(500, "Temporary server error", "Failed to marshal last key", err)
			return api.Failure(funcName, err), nil
		}
		lastKey = string(b)
	}

	return api.Success(funcName, &ListNewsfeedResponse{
		Entries:          resultEntries,
		LastEvaluatedKey: lastKey,
	}), nil
}

func fetchEntries(newsfeedId, startKey string, entryMap map[string]database.TimelineEntryKey, lastKey *string) error {
	newsfeedEntries, last, err := repository.ListNewsfeedEntries(newsfeedId, startKey, 50)
	if err != nil {
		return err
	}
	log.Debugf("Got %d entries for id %q: %v", len(newsfeedEntries), newsfeedId, newsfeedEntries)

	*lastKey = last
	for _, entry := range newsfeedEntries {
		entryMap[fmt.Sprintf("%s#%s", entry.Poster, entry.TimelineId)] = database.TimelineEntryKey{
			Owner: entry.Poster,
			Id:    entry.TimelineId,
		}
	}
	return nil
}
