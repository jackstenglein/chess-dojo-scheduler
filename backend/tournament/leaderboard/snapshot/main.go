package main

import (
	"context"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(Handler)
}

func Handler(ctx context.Context, event events.CloudWatchEvent) (events.CloudWatchEvent, error) {
	log.SetRequestId(event.ID)
	log.Debugf("Event: %#v", event)

	now := time.Now()
	month := now.Add(-24 * time.Hour).Format("2006-01")
	year := now.Add(-24 * time.Hour).Format("2006")

	for _, name := range database.LeaderboardNames {
		for _, timeControl := range database.TimeControls {
			log.Debugf("Snapshotting monthly leaderboard (month, name, tc): (%s, %s, %s)", month, name, timeControl)
			snapshotLeaderboard("MONTHLY", month, name, timeControl)

			if now.YearDay() == 1 {
				log.Debugf("Snapshotting yearly leaderboard (year, name, tc): (%s, %s, %s)", year, name, timeControl)
				snapshotLeaderboard("YEARLY", year, name, timeControl)
			}
		}
	}

	return event, nil
}

func snapshotLeaderboard(timeframe, startsAt string, name database.LeaderboardType, timeControl string) {
	leaderboard, err := repository.GetLeaderboard(timeframe, string(name), timeControl, database.CurrentLeaderboard)
	if err != nil {
		log.Errorf("Failed to get current leaderboard: %v", err)
		return
	}

	snapshot := database.Leaderboard{
		Type:        leaderboard.Type,
		StartsAt:    startsAt,
		TimeControl: leaderboard.TimeControl,
		Players:     leaderboard.Players,
	}
	if err := repository.SetLeaderboard(snapshot); err != nil {
		log.Errorf("Failed to snapshot leaderboard: %v", err)
		return
	}

	leaderboard.Players = nil
	if err := repository.SetLeaderboard(*leaderboard); err != nil {
		log.Errorf("Failed to reset current leaderboard: %v", err)
		return
	}
}
