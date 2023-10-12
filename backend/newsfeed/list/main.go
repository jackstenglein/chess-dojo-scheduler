package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
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
	LastFetch        string                   `json:"lastFetch"`
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
	lastFetch := getLastFetched(info.Username, event)

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
		if err := fetchEntries(info.Username, startKeys.UserKey, lastFetch, timelineEntries, &lastKeys.UserKey); err != nil {
			return api.Failure(funcName, err), nil
		}
	}

	if (cohort != "") && (startKey == "" || startKeys.CohortKey != "") {
		if err := fetchEntries(cohort, startKeys.CohortKey, lastFetch, timelineEntries, &lastKeys.CohortKey); err != nil {
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

	if lastKey == "" && event.QueryStringParameters["skipLastFetched"] == "" {
		update := &database.UserUpdate{
			LastFetchedNewsfeed: aws.String(time.Now().Format(time.RFC3339)),
		}
		_, err := repository.UpdateUser(info.Username, update)
		if err != nil {
			log.Error("Failed to update last fetched newsfeed: ", err)
		}
	}

	return api.Success(funcName, &ListNewsfeedResponse{
		Entries:          resultEntries,
		LastFetch:        lastFetch,
		LastEvaluatedKey: lastKey,
	}), nil
}

// getLastFetched returns the time the user last fetched their newsfeed. If the user
// has never fetched their newsfeed or they last fetched it more than 1 week ago, then
// a time 1 week ago is returned. If the event contains the skipLastFetched query parameter,
// then an empty string is returned.
func getLastFetched(username string, event api.Request) string {
	if event.QueryStringParameters["skipLastFetched"] != "" {
		return ""
	}

	user, err := repository.GetUser(username)
	if err != nil {
		log.Error("Failed to fetch user: ", err)
		return ""
	}

	weekAgo := time.Now().Add(-7 * 24 * time.Hour)

	if user.LastFetchedNewsfeed == "" {
		return weekAgo.Format(time.RFC3339)
	}

	t, err := time.Parse(time.RFC3339, user.LastFetchedNewsfeed)
	if err != nil {
		log.Error("Failed to parse user's lastFetched time: ", err)
		return ""
	}
	t = t.Add(-24 * time.Hour)

	if t.Before(weekAgo) {
		return weekAgo.Format(time.RFC3339)
	}

	return t.Format(time.RFC3339)
}

func fetchEntries(newsfeedId, startKey, lastFetch string, entryMap map[string]database.TimelineEntryKey, lastKey *string) error {
	newsfeedEntries, last, err := repository.ListNewsfeedEntries(newsfeedId, startKey, lastFetch, 50)
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
