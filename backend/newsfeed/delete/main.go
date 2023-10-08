package main

import (
	"context"

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
	log.Debugf("Event: %#v", event)

	failures := make([]events.DynamoDBBatchItemFailure, 0, len(event.Records))

	for _, record := range event.Records {
		if record.EventName != "REMOVE" {
			continue
		}

		log.Debugf("Record: %#v", record)
		deleted, err := processRecord(record)
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

func processRecord(record events.DynamoDBEventRecord) (int, error) {
	poster := record.Change.Keys["owner"].String()
	id := record.Change.Keys["id"].String()
	return repository.DeleteNewsfeedEntries(poster, id)
}
