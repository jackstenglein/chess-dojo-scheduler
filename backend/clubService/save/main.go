package main

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	if id := event.PathParameters["id"]; id == "" {
		return createClub(event), nil
	}
	return saveClub(event), nil
}

func createClub(event api.Request) api.Response {
	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", ""))
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err)
	}
	if user.SubscriptionStatus != database.SubscriptionStatus_Subscribed {
		return api.Failure(errors.New(403, "Invalid request: free-tier users cannot create clubs", ""))
	}

	club := &database.Club{}
	if err := json.Unmarshal([]byte(event.Body), club); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: failed to unmarshal body", "", err))
	}

	if err := checkClub(club); err != nil {
		return api.Failure(err)
	}

	club.Id = uuid.NewString()
	club.Owner = info.Username
	club.CreatedAt = time.Now().Format(time.RFC3339)
	club.UpdatedAt = time.Now().Format(time.RFC3339)
	club.MemberCount = 1
	club.Members = map[string]database.ClubMember{
		info.Username: {
			Username: info.Username,
			JoinedAt: club.CreatedAt,
		},
	}

	if err := repository.CreateClub(club); err != nil {
		return api.Failure(err)
	}
	return api.Success(club)
}

func saveClub(event api.Request) api.Response {
	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", ""))
	}

	clubUpdate := &database.ClubUpdate{}
	if err := json.Unmarshal([]byte(event.Body), clubUpdate); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: failed to unmarshal body", "", err))
	}

	club, err := repository.UpdateClub(event.PathParameters["id"], info.Username, clubUpdate)
	if err != nil {
		return api.Failure(err)
	}
	return api.Success(club)
}

func checkClub(club *database.Club) error {
	club.Name = strings.TrimSpace(club.Name)
	club.Description = strings.TrimSpace(club.Description)
	club.ShortDescription = strings.TrimSpace(club.ShortDescription)
	club.ExternalUrl = strings.TrimSpace(club.ExternalUrl)

	if club.Name == "" {
		return errors.New(400, "Invalid request: name is required", "")
	}
	if club.Description == "" {
		return errors.New(400, "Invalid request: description is required", "")
	}
	if !club.Unlisted && club.ShortDescription == "" {
		return errors.New(400, "Invalid request: shortDescription is required if the club is public", "")
	}

	return nil
}
