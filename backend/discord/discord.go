package discord

import (
	"fmt"
	"os"
	"strings"

	"github.com/bwmarrin/discordgo"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.UserGetter = database.DynamoDB

const guildId = "951958534113886238"

var authToken = os.Getenv("discordAuth")

// SendBookingNotification sends a notification of a newly booked meeting
// to the provided user through Discord DM.
func SendBookingNotification(username string, meetingId string) error {
	user, err := repository.GetUser(username)
	if err != nil {
		return err
	}

	if user.DisableBookingNotifications {
		return nil
	}

	msg := fmt.Sprintf("Hello, someone has just booked a meeting with you! View it at https://www.chess-dojo-scheduler.com/meeting/%s", meetingId)
	return SendNotification(user, msg)
}

// SendGroupJoinNotification sends a notification of a new join to a
// group meeting to the providied user through Discord DM.
func SendGroupJoinNotification(username string, availabilityId string) error {
	user, err := repository.GetUser(username)
	if err != nil {
		return err
	}

	if user.DisableBookingNotifications {
		return nil
	}

	msg := fmt.Sprintf("Hello, someone just joined your group meeting! View it at https://www.chess-dojo-scheduler.com/group/%s", availabilityId)
	return SendNotification(user, msg)
}

// SendCancellationNotification sends a notification of a cancelled meeting
// to the provided user through Discord DM.
func SendCancellationNotification(username string, meetingId string) error {
	user, err := repository.GetUser(username)
	if err != nil {
		return err
	}

	if user.DisableCancellationNotifications {
		return nil
	}

	msg := fmt.Sprintf("Hello, your opponent has cancelled your upcoming meeting. View it at https://www.chess-dojo-scheduler.com/meeting/%s", meetingId)
	return SendNotification(user, msg)
}

// SendNotification sends the provided message over Discord DM to the provided user.
func SendNotification(user *database.User, message string) error {
	if user.DiscordUsername == "" {
		return errors.New(400, "Cannot send discord notification to empty username", "")
	}

	discordTokens := strings.Split(user.DiscordUsername, "#")
	if len(discordTokens) == 0 {
		return errors.New(400, fmt.Sprintf("Cannot send discord notification to username `%s`", user.DiscordUsername), "")
	}
	var discordUsername, discordDiscriminator string
	discordUsername = discordTokens[0]
	if len(discordTokens) > 1 {
		discordDiscriminator = discordTokens[1]
	}

	discord, err := discordgo.New("Bot " + authToken)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to create discord session", err)
	}

	discordUsers, err := discord.GuildMembersSearch(guildId, discordUsername, 1000)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to search for guild members", err)
	}
	if len(discordUsers) == 0 {
		return errors.New(404, fmt.Sprintf("Cannot find discord username `%s`", user.DiscordUsername), "")
	}

	var discordUser *discordgo.Member
	if len(discordUsers) == 1 {
		discordUser = discordUsers[0]
	} else if discordDiscriminator == "" {
		return errors.New(400, fmt.Sprintf("Discord username `%s` does not contain # number and there are multiple users found", user.DiscordUsername), "")
	} else {
		for _, u := range discordUsers {
			if u.User.Discriminator == discordDiscriminator {
				discordUser = u
				break
			}
		}
		if discordUser == nil {
			return errors.New(404, fmt.Sprintf("Discord search returned users, but cannot find matching discriminator for discord username `%s`", user.DiscordUsername), "")
		}
	}

	channel, err := discord.UserChannelCreate(discordUser.User.ID)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to create discord channel", err)
	}

	_, err = discord.ChannelMessageSend(channel.ID, message)
	return errors.Wrap(500, "Temporary server error", "Failed to send discord message", err)
}
