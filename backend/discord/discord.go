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

var frontendHost = os.Getenv("frontendHost")
var authToken = os.Getenv("discordAuth")
var findGameChannelId = os.Getenv("discordFindGameChannelId")
var publicGuildId = os.Getenv("discordPublicGuildId")
var privateGuildId = os.Getenv("discordPrivateGuildId")

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
func getDiscordIdByDiscordUsername(discord *discordgo.Session, fullDiscordUsername string) (string, error) {
	discordUsername := fullDiscordUsername
	var discordDiscriminator string

	discordTokens := strings.Split(discordUsername, "#")
	if len(discordTokens) > 2 {
		return "", errors.New(400, fmt.Sprintf("Discord username `%s` is in unrecognized format", fullDiscordUsername), "")
	}
	if len(discordTokens) == 2 {
		discordUsername = discordTokens[0]
		discordDiscriminator = discordTokens[1]
	}

	if discordUsername == "" {
		return "", errors.New(400, fmt.Sprintf("Discord username `%s` cannot be empty", fullDiscordUsername), "")
	}

	discordUsers, err := discord.GuildMembersSearch(privateGuildId, discordUsername, 1000)
	if err != nil {
		return "", errors.Wrap(500, "Temporary server error", "Failed to search for guild members", err)
	}
	if len(discordUsers) == 0 {
		return "", errors.New(404, fmt.Sprintf("Discord username `%s` not found in ChessDojo Training Program server", discordUsername), "")
	}

	if len(discordUsers) == 1 && discordDiscriminator == "" {
		return discordUsers[0].User.ID, nil
	}

	if discordDiscriminator == "" {
		return "", errors.New(400, fmt.Sprintf("Multiple users found for username `%s`. Add your #id and try again.", fullDiscordUsername), "")
	}

	for _, u := range discordUsers {
		if u.User.Discriminator == discordDiscriminator {
			return u.User.ID, nil
		}
	}

	return "", errors.New(404, fmt.Sprintf("Cannot find #id `%s` for discord username `%s`", discordDiscriminator, discordUsername), "")
}

// CheckDiscordUsername verifies that the provided discord username can be found in the server.
// An error is returned if the username cannot be found.
func CheckDiscordUsername(discordUsername string) error {
	discord, err := discordgo.New("Bot " + authToken)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed to create discord session", err)
	}

	_, err = getDiscordIdByDiscordUsername(discord, discordUsername)
	return err
}
