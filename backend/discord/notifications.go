package discord

import (
	"fmt"
	"strings"
	"time"

	"github.com/bwmarrin/discordgo"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

// SendBookingNotification sends a notification of a newly booked meeting
// to the provided user through Discord DM.
func SendBookingNotification(username string, meetingId string) error {
	user, err := repository.GetUser(username)
	if err != nil {
		return err
	}

	if user.NotificationSettings.DiscordNotificationSettings.GetDisableMeetingBooking() {
		return nil
	}

	msg := fmt.Sprintf("Hello, someone has just booked a meeting with you! View it [here](%s/meeting/%s).", frontendHost, meetingId)
	return SendNotification(user, msg)
}

// SendGroupJoinNotification sends a notification of a new join to a
// group meeting to the providied user through Discord DM.
func SendGroupJoinNotification(username string, availabilityId string) error {
	user, err := repository.GetUser(username)
	if err != nil {
		return err
	}

	if user.NotificationSettings.DiscordNotificationSettings.GetDisableMeetingBooking() {
		return nil
	}

	msg := fmt.Sprintf("Hello, someone just joined your group meeting! View it [here](%s/group/%s)", frontendHost, availabilityId)
	return SendNotification(user, msg)
}

// SendCancellationNotification sends a notification of a cancelled meeting
// to the provided user through Discord DM.
func SendCancellationNotification(username string, msg string) error {
	user, err := repository.GetUser(username)
	if err != nil {
		return err
	}

	if user.NotificationSettings.DiscordNotificationSettings.GetDisableMeetingCancellation() {
		return nil
	}

	return SendNotification(user, msg)
}

// SendAvailabilityNotification sends a notification of a new event of type EventTypeAvailability.
func SendAvailabilityNotification(event *database.Event) (string, error) {
	if event.Type != database.EventTypeAvailability {
		return "", errors.New(400, "Invalid request: event.type must be `AVAILABILITY`", "")
	}

	discord, err := discordgo.New("Bot " + authToken)
	if err != nil {
		return "", errors.Wrap(500, "Temporary server error", "Failed to create discord session", err)
	}

	startTime, err := time.Parse(time.RFC3339, event.StartTime)
	if err != nil {
		return "", errors.Wrap(400, "Invalid request: availability.startTime cannot be parsed", "", err)
	}
	endTime, err := time.Parse(time.RFC3339, event.EndTime)
	if err != nil {
		return "", errors.Wrap(400, "Invalid request: availability.endTime cannot be parsed", "", err)
	}

	var sb strings.Builder

	discordId, err := getDiscordIdByCognitoUsername(discord, event.Owner)
	if err != nil {
		log.Errorf("Failed to get discordId: %v", err)
		sb.WriteString(fmt.Sprintf("Availability posted by %s", event.OwnerDisplayName))
	} else {
		sb.WriteString(fmt.Sprintf("Availability posted by <@%s>", discordId))
	}

	sb.WriteString(fmt.Sprintf("\nStart Time: <t:%d:f>", startTime.Unix()))
	sb.WriteString(fmt.Sprintf("\nEnd Time: <t:%d:f>", endTime.Unix()))

	if event.Description != "" {
		sb.WriteString(fmt.Sprintf("\nDescription: %s", event.Description))
	}

	sb.WriteString("\nTypes: ")
	sb.WriteString(strings.Join(database.GetDisplayNames(event.Types), ", "))

	sb.WriteString("\nCohorts: ")
	for i, c := range event.Cohorts {
		sb.WriteString(string(c))
		if i+1 < len(event.Cohorts) {
			sb.WriteString(", ")
		}
	}

	sb.WriteString(fmt.Sprintf("\nCurrent Participants: %d/%d", len(event.Participants), event.MaxParticipants))
	sb.WriteString(fmt.Sprintf("\n[Click to Book](%s/calendar/availability/%s)", frontendHost, event.Id))

	if event.DiscordMessageId == "" {
		msg, err := discord.ChannelMessageSend(findGameChannelId, sb.String())
		if err != nil {
			return "", errors.Wrap(500, "Temporary server error", "Failed to send discord channel message", err)
		}
		return msg.ID, nil
	} else {
		_, err := discord.ChannelMessageEdit(findGameChannelId, event.DiscordMessageId, sb.String())
		return event.DiscordMessageId, errors.Wrap(500, "Temporary server error", "Failed to edit discord channel message", err)
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

	discordUsers, err := discord.GuildMembersSearch(privateGuildId, discordUsername, 1000)
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
