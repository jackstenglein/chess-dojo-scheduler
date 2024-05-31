// Implements a Lambda handler which posts a Discord message to the achievements
// channel announcing this week's graduations.
package main

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
)

type Event events.CloudWatchEvent

var repository = database.DynamoDB
var achievementsChannelId = os.Getenv("discordAchievementsChannelId")
var frontendHost = os.Getenv("frontendHost")

var wednesdayCohorts = []database.DojoCohort{
	"0-300",
	"300-400",
	"400-500",
	"500-600",
	"600-700",
	"700-800",
	"800-900",
}

var thursdayCohorts = []database.DojoCohort{
	"900-1000",
	"1000-1100",
	"1100-1200",
	"1200-1300",
	"1300-1400",
	"1400-1500",
	"1500-1600",
	"1600-1700",
	"1700-1800",
	"1800-1900",
	"1900-2000",
	"2000-2100",
	"2100-2200",
	"2200-2300",
	"2300-2400",
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event Event) (Event, error) {
	log.SetRequestId(event.ID)
	log.Infof("Event: %#v", event)

	cohorts, grads, err := getData(event.ID)
	if err != nil {
		log.Errorf("Failed to get graduations: %v", err)
		return event, err
	}

	twitchTime := time.Now()
	twitchTime = time.Date(twitchTime.Year(), twitchTime.Month(), twitchTime.Day(), 16, 0, 0, 0, twitchTime.Location())

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("## Congrats to this week's %s Grads!\n", event.ID))
	sb.WriteString(fmt.Sprintf("Join us on [Twitch](<https://twitch.tv/chessdojo>) at <t:%d:t> today when we go over your profiles and games!\n", twitchTime.Unix()))

	hasGrads := false
	for _, cohort := range cohorts {
		cohortGrads := grads[cohort]
		if len(cohortGrads) == 0 {
			continue
		}

		hasGrads = true
		sb.WriteString(fmt.Sprintf("\n<@&%s> %s\n", discord.RoleIds[cohort], discord.CohortEmojiIds[cohort]))
		for _, grad := range cohortGrads {
			discordId, err := discord.GetDiscordIdByCognitoUsername(nil, grad.Username)
			if err != nil {
				log.Errorf("Failed to get Discord ID: %v", err)
			}
			if discordId == "" {
				sb.WriteString(grad.DisplayName)
			} else {
				sb.WriteString(fmt.Sprintf("<@%s>", discordId))
			}

			sb.WriteString(fmt.Sprintf(" – [View Profile](<%s/profile/%s>)\n", frontendHost, grad.Username))
		}

		if sb.Len() >= 1000 {
			log.Infof("Sending message to ID %s: %s", achievementsChannelId, sb.String())
			_, err = discord.SendMessageInChannel(sb.String(), achievementsChannelId)
			if err != nil {
				log.Errorf("Failed to post message in Discord: %v", err)
				return event, err
			}
			sb.Reset()
			sb.WriteString("_ _\n")
		}
	}

	if !hasGrads {
		log.Info("No Grads")
		return event, nil
	}

	log.Infof("Sending message to ID %s: %s", achievementsChannelId, sb.String())
	_, err = discord.SendMessageInChannel(sb.String(), achievementsChannelId)
	if err != nil {
		log.Errorf("Failed to post message in Discord: %v", err)
		return event, err
	}
	return event, nil
}

func getData(eventId string) ([]database.DojoCohort, map[database.DojoCohort][]database.Graduation, error) {
	if eventId == "U1000" {
		grads, err := listWednesdayGrads()
		return wednesdayCohorts, grads, err

	} else if eventId == "1000+" {
		grads, err := listThursdayGrads()
		return thursdayCohorts, grads, err
	}
	return nil, nil, fmt.Errorf("invalid event ID: %v", eventId)
}

func listWednesdayGrads() (map[database.DojoCohort][]database.Graduation, error) {
	startTime := time.Now().Add(-time.Hour * 24 * 7)
	startTime = time.Date(startTime.Year(), startTime.Month(), startTime.Day(), 17, 30, 0, 0, startTime.Location())
	endTime := startTime.Add(time.Hour * 24 * 7)
	return listGraduations(startTime.Format(time.RFC3339), endTime.Format(time.RFC3339), wednesdayCohorts)
}

func listThursdayGrads() (map[database.DojoCohort][]database.Graduation, error) {
	startTime := time.Now().Add(-time.Hour * 24 * 8)
	startTime = time.Date(startTime.Year(), startTime.Month(), startTime.Day(), 17, 30, 0, 0, startTime.Location())
	endTime := startTime.Add(time.Hour * 24 * 7)
	return listGraduations(startTime.Format(time.RFC3339), endTime.Format(time.RFC3339), thursdayCohorts)
}

func listGraduations(startTime, endTime string, cohorts []database.DojoCohort) (map[database.DojoCohort][]database.Graduation, error) {
	graduations := make(map[database.DojoCohort][]database.Graduation)
	var startKey string

	for ok := true; ok; ok = startKey != "" {
		gs, sk, err := repository.ListGraduationsByDate(startTime, startKey)
		if err != nil {
			return nil, err
		}
		startKey = sk

		for _, g := range gs {
			if g.CreatedAt < startTime || g.CreatedAt >= endTime {
				continue
			}
			for _, cohort := range cohorts {
				if g.PreviousCohort == cohort {
					graduations[cohort] = append(graduations[cohort], g)
				}
			}
		}
	}

	return graduations, nil
}
