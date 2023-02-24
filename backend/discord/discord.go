package discord

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.UserGetter = database.DynamoDB

const guildId = "951958534113886238"

var frontendHost = os.Getenv("frontendHost")
var findGameChannelId = os.Getenv("discordFindGameChannelId")
var authToken = os.Getenv("discordAuth")

// getDiscordIdByCognitoUsername returns the discord ID of the user with the given Cognito username.
func getDiscordIdByCognitoUsername(discord *discordgo.Session, username string) (string, error) {
	user, err := repository.GetUser(username)
	if err != nil {
		return "", err
	}
	return getDiscordIdByUser(discord, user)
}

// getDiscordIdByUser returns the discord ID of the given user.
func getDiscordIdByUser(discord *discordgo.Session, user *database.User) (string, error) {
	if user.DiscordUsername == "" {
		return "", errors.New(400, "Cannot get discord id for empty DiscordUsername", "")
	}

	return getDiscordIdByDiscordUsername(discord, user.DiscordUsername)
}

// getDiscordIdByDiscordUsername returns the discord ID of the user with the given discord username.
func getDiscordIdByDiscordUsername(discord *discordgo.Session, discordUsername string) (string, error) {
	discordTokens := strings.Split(discordUsername, "#")
	if len(discordTokens) == 0 {
		return "", errors.New(400, fmt.Sprintf("Cannot send discord notification to username `%s`", discordUsername), "")
	}

	var discordDiscriminator string
	discordUsername = discordTokens[0]
	if len(discordTokens) > 1 {
		discordDiscriminator = discordTokens[1]
	}

	discordUsers, err := discord.GuildMembersSearch(guildId, discordUsername, 1000)
	if err != nil {
		return "", errors.Wrap(500, "Temporary server error", "Failed to search for guild members", err)
	}
	if len(discordUsers) == 0 {
		return "", errors.New(404, fmt.Sprintf("Cannot find discord username `%s`", discordUsername), "")
	}

	var discordUser *discordgo.Member
	if len(discordUsers) == 1 {
		discordUser = discordUsers[0]
	} else if discordDiscriminator == "" {
		return "", errors.New(400, fmt.Sprintf("Discord username `%s` does not contain # number and there are multiple users found", discordUsername), "")
	} else {
		for _, u := range discordUsers {
			if u.User.Discriminator == discordDiscriminator {
				discordUser = u
				break
			}
		}
		if discordUser == nil {
			return "", errors.New(404, fmt.Sprintf("Discord search returned users, but cannot find matching discriminator for discord username `%s`", discordUsername), "")
		}
	}

	return discordUser.User.ID, nil
}

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

	msg := fmt.Sprintf("Hello, someone has just booked a meeting with you! View it at %s/meeting/%s", frontendHost, meetingId)
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

	msg := fmt.Sprintf("Hello, someone just joined your group meeting! View it at %s/group/%s", frontendHost, availabilityId)
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

	msg := fmt.Sprintf("Hello, your opponent has cancelled your upcoming meeting. View it at %s/meeting/%s", frontendHost, meetingId)
	return SendNotification(user, msg)
}

// SendAvailabilityNotification sends a notification of a new availability.
func SendAvailabilityNotification(availability *database.Availability) (string, error) {
	discord, err := discordgo.New("Bot " + authToken)
	if err != nil {
		return "", errors.Wrap(500, "Temporary server error", "Failed to create discord session", err)
	}

	startTime, err := time.Parse(time.RFC3339, availability.StartTime)
	if err != nil {
		return "", errors.Wrap(400, "Invalid request: availability.startTime cannot be parsed", "", err)
	}
	endTime, err := time.Parse(time.RFC3339, availability.EndTime)
	if err != nil {
		return "", errors.Wrap(400, "Invalid request: availability.endTime cannot be parsed", "", err)
	}

	discordId, err := getDiscordIdByCognitoUsername(discord, availability.Owner)
	if err != nil {
		return "", err
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Availability posted by <@%s>", discordId))

	sb.WriteString(fmt.Sprintf("\nStart Time: <t:%d:f>", startTime.Unix()))
	sb.WriteString(fmt.Sprintf("\nEnd Time: <t:%d:f>", endTime.Unix()))

	sb.WriteString("\nTypes: ")
	sb.WriteString(strings.Join(database.GetDisplayNames(availability.Types), ", "))

	sb.WriteString("\nCohorts: ")
	for i, c := range availability.Cohorts {
		sb.WriteString("@")
		sb.WriteString(string(c))
		if i+1 < len(availability.Cohorts) {
			sb.WriteString(", ")
		}
	}

	sb.WriteString(fmt.Sprintf("\nCurrent Participants: %d/%d", len(availability.Participants), availability.MaxParticipants))

	if availability.DiscordMessageId == "" {
		msg, err := discord.ChannelMessageSend(findGameChannelId, sb.String())
		if err != nil {
			return "", errors.Wrap(500, "Temporary server error", "Failed to send discord channel message", err)
		}
		return msg.ID, nil
	} else {
		_, err := discord.ChannelMessageEdit(findGameChannelId, availability.DiscordMessageId, sb.String())
		return availability.DiscordMessageId, errors.Wrap(500, "Temporary server error", "Failed to send discord channel message", err)
	}
}

// DeleteMessage deletes the provided Discord notification message.
func DeleteMessage(messageId string) error {
	if messageId == "" {
		return nil
	}

	discord, err := discordgo.New("Bot " + authToken)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to create discord session", err)
	}

	err = discord.ChannelMessageDelete(findGameChannelId, messageId)
	return errors.Wrap(500, "Temporary server error", "Failed to delete Discord channel message", err)
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
