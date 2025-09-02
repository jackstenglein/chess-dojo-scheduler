package main

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.DynamoDBEvent) (events.DynamoDBEventResponse, error) {
	log.Infof("Event: %#v", event)
	var deleted int
	var err error

	failures := make([]events.DynamoDBBatchItemFailure, 0, len(event.Records))

	for _, record := range event.Records {
		if record.EventName != "REMOVE" {
			continue
		}
		log.Debugf("Record: %#v", record)

		if strings.Contains(record.EventSourceArn, "timeline") {
			deleted, err = processTimelineRecord(record)
		} else if strings.Contains(record.EventSourceArn, "followers") {
			deleted, err = processFollowersRecord(record)
		} else {
			continue
		}

		if err != nil {
			log.Errorf("Failed with %d deleted: %v", deleted, err)
			failures = append(failures, events.DynamoDBBatchItemFailure{
				ItemIdentifier: record.Change.SequenceNumber,
			})
		} else {
			log.Debugf("Deleted %d newsfeed entries", deleted)
		}
	}

	return events.DynamoDBEventResponse{
		BatchItemFailures: failures,
	}, nil
}

func processTimelineRecord(record events.DynamoDBEventRecord) (int, error) {
	poster := record.Change.Keys["owner"].String()
	id := record.Change.Keys["id"].String()
	return repository.DeleteNewsfeedEntries(poster, id)
}

func processFollowersRecord(record events.DynamoDBEventRecord) (int, error) {
	poster := record.Change.Keys["poster"].String()
	follower := record.Change.Keys["follower"].String()
	return repository.RemovePosterFromNewsfeed(follower, poster)
}
