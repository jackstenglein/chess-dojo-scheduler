package main

import (
	"context"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
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
			if err := snapshotLeaderboard("MONTHLY", month, name, timeControl); err != nil {
				log.Errorf("Failed to snapshot monthly leaderboard: %v", err)
				return event, err
			}

			if now.YearDay() == 1 {
				log.Debugf("Snapshotting yearly leaderboard (year, name, tc): (%s, %s, %s)", year, name, timeControl)
				if err := snapshotLeaderboard("YEARLY", year, name, timeControl); err != nil {
					log.Errorf("Failed to snapshot yearly leaderboard: %v", err)
					return event, err
				}
			}
		}
	}

	if err := resetMongo(ctx); err != nil {
		log.Errorf("Failed to reset Mongo scores: %v", err)
		return event, err
	}

	return event, nil
}

// snapshotLeaderboard saves a snapshot of the leaderboard with the provided parameters and then resets
// the current leaderboard players.
func snapshotLeaderboard(timeframe, startsAt string, name database.LeaderboardType, timeControl string) error {
	leaderboard, err := repository.GetLeaderboard(timeframe, string(name), timeControl, database.CurrentLeaderboard)
	if err != nil {
		return err
	}

	snapshot := database.Leaderboard{
		Type:        leaderboard.Type,
		StartsAt:    startsAt,
		TimeControl: leaderboard.TimeControl,
		Players:     leaderboard.Players,
	}
	if err := repository.SetLeaderboard(snapshot); err != nil {
		return err
	}

	leaderboard.Players = nil
	if err := repository.SetLeaderboard(*leaderboard); err != nil {
		return err
	}
	return nil
}

// resetMongo resets all the scores in the Dojo Discord's MongoDB to 0.
func resetMongo(ctx context.Context) error {
	mongoConnectionString := os.Getenv("mongoConnectionString")
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoConnectionString))
	if err != nil {
		return err
	}
	defer client.Disconnect(ctx)

	collection := client.Database("Lisebot-database").Collection("players")
	filter := bson.D{}
	update := bson.D{
		bson.E{Key: "$set", Value: []bson.E{
			{Key: "blitz_score", Value: 0},
			{Key: "rapid_score", Value: 0},
			{Key: "classical_score", Value: 0},
			{Key: "blitz_score_gp", Value: 0},
			{Key: "rapid_score_gp", Value: 0},
			{Key: "classical_score_gp", Value: 0},
			{Key: "blitz_score_swiss", Value: 0},
			{Key: "rapid_score_swiss", Value: 0},
			{Key: "classical_score_swiss", Value: 0},
			{Key: "blitz_score_swiss_gp", Value: 0},
			{Key: "rapid_score_swiss_gp", Value: 0},
			{Key: "classical_score_swiss_gp", Value: 0},
			{Key: "blitz_comb_total", Value: 0},
			{Key: "rapid_comb_total", Value: 0},
			{Key: "classical_comb_total", Value: 0},
			{Key: "blitz_comb_total_gp", Value: 0},
			{Key: "rapid_comb_total_gp", Value: 0},
			{Key: "classical_comb_total_gp", Value: 0},
			{Key: "sp_score", Value: 0},
			{Key: "eg_score", Value: 0},
		}},
	}

	result, err := collection.UpdateMany(ctx, filter, update)
	if err != nil {
		return err
	}
	log.Debugf("Successfully updated collection: %#v", result)
	return nil
}
