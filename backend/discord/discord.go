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
	user, err := getDiscordUser(discord, fullDiscordUsername)
	if err != nil {
		return "", err
	}
	return user.ID, nil
}

// getDiscordUser returns the discord user with the given discord username.
func getDiscordUser(discord *discordgo.Session, fullDiscordUsername string) (*discordgo.User, error) {
	discordUsername := fullDiscordUsername
	var discordDiscriminator string

	discordTokens := strings.Split(discordUsername, "#")
	if len(discordTokens) > 2 {
		return nil, errors.New(400, fmt.Sprintf("Discord username `%s` is in unrecognized format", fullDiscordUsername), "")
	}
	if len(discordTokens) == 2 {
		discordUsername = discordTokens[0]
		discordDiscriminator = discordTokens[1]
	}

	if discordUsername == "" {
		return nil, errors.New(400, fmt.Sprintf("Discord username `%s` cannot be empty", fullDiscordUsername), "")
	}

	discordUsers, err := discord.GuildMembersSearch(privateGuildId, discordUsername, 1000)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to search for private guild members", err)
	}
	if len(discordUsers) == 0 {
		discordUsers, err = discord.GuildMembersSearch(publicGuildId, discordUsername, 1000)
		if err != nil {
			return nil, errors.Wrap(500, "Temporary server error", "Failed to search for public guild members", err)
		}
		if len(discordUsers) == 0 {
			return nil, errors.New(404, fmt.Sprintf("Discord username `%s` not found in the ChessDojo server or the ChessDojo Training Program server. Please join either server and try again.", discordUsername), "")
		}
	}

	if len(discordUsers) == 1 && discordDiscriminator == "" {
		return discordUsers[0].User, nil
	}

	if discordDiscriminator == "" {
		return nil, errors.New(400, fmt.Sprintf("Multiple users found for username `%s`. Add your #id and try again.", fullDiscordUsername), "")
	}

	for _, u := range discordUsers {
		if u.User.Discriminator == discordDiscriminator {
			return u.User, nil
		}
	}
	return nil, errors.New(404, fmt.Sprintf("Cannot find #id `%s` for discord username `%s`", discordDiscriminator, discordUsername), "")
}

// GetDiscordAvatarURL returns the Discord avatar for the provided Discord username.
// An error is returned if the username cannot be found.
func GetDiscordAvatarURL(discordUsername string) (string, error) {
	discord, err := discordgo.New("Bot " + authToken)
	if err != nil {
		return "", errors.Wrap(500, "Temporary server error", "Failed to create discord session", err)
	}

	user, err := getDiscordUser(discord, discordUsername)
	if err != nil {
		return "", err
	}
	return user.AvatarURL(""), nil
}
