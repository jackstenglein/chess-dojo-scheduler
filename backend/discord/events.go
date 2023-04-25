package discord

import (
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

func CreateEvent() error {
	discord, err := discordgo.New("Bot " + authToken)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to create discord session", err)
	}

	startTime := time.Now().Add(time.Hour)
	endTime := time.Now().Add(2 * time.Hour)

	params := discordgo.GuildScheduledEventParams{
		Name:               "Test Event",
		Description:        "Test Description",
		ScheduledStartTime: &startTime,
		ScheduledEndTime:   &endTime,
		PrivacyLevel:       discordgo.GuildScheduledEventPrivacyLevelGuildOnly,
		EntityType:         discordgo.GuildScheduledEventEntityTypeExternal,
		EntityMetadata: &discordgo.GuildScheduledEventEntityMetadata{
			Location: "No Location Provided",
		},
	}
	_, err = discord.GuildScheduledEventCreate("691123894001598536", &params)
	return err
}
