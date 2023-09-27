package main

import (
	"fmt"
	"log"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/discord"
)

var repository = database.DynamoDB
var mediaStore = database.S3

func main() {
	var users []*database.User
	var startKey string
	var err error

	updated := 0
	failed := 0

	for ok := true; ok; ok = startKey != "" {
		fmt.Println("StartKey: ", startKey)
		users, startKey, err = repository.ScanUsers(startKey)
		if err != nil {
			log.Fatal(err)
		}

		for _, u := range users {
			success, err := updateUser(u)
			if success {
				updated += 1
			}
			if err != nil {
				failed += 1
				fmt.Printf("Failed to update user %s: %v\n", u.Username, err)
			}
		}
	}

	fmt.Printf("Success: %d updated, %d failed\n", updated, failed)
}

func updateUser(user *database.User) (bool, error) {
	if user.DiscordUsername == "" {
		return false, nil
	}

	url, err := discord.GetDiscordAvatarURL(user.DiscordUsername)
	if err != nil {
		return false, err
	}
	if url == "" {
		return false, nil
	}

	err = mediaStore.CopyImageFromURL(url, fmt.Sprintf("/profile/%s", user.Username))
	return err == nil, err
}
