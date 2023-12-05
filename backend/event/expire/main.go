package main

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
)

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event events.DynamoDBEvent) error {
	log.Debugf("Event: %#v", event)

	for _, record := range event.Records {
		if record.EventName != "REMOVE" {
			continue
		}

		discordMsgId := record.Change.OldImage["discordMessageId"].String()
		if err := discord.DeleteMessage(discordMsgId); err != nil {
			log.Error("Failed discord.DeleteMessage: ", err)
		}
	}

	return nil
}
