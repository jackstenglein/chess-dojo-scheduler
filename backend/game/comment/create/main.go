package main

import (
	"context"
	"encoding/base64"
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

var repository database.GameCommenter = database.DynamoDB

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	cohort, ok := event.PathParameters["cohort"]
	if !ok {
		err := errors.New(400, "Invalid request: cohort is required", "")
		return api.Failure(err), nil
	}

	id, ok := event.PathParameters["id"]
	if !ok {
		err := errors.New(400, "Invalid request: id is required", "")
		return api.Failure(err), nil
	}
	if b, err := base64.StdEncoding.DecodeString(id); err != nil {
		err = errors.Wrap(400, "Invalid request: id is not base64 encoded", "", err)
		return api.Failure(err), nil
	} else {
		id = string(b)
	}

	comment, err := getComment(event)
	if err != nil {
		return api.Failure(err), nil
	}

	existingComments := event.QueryStringParameters["existing"] == "true"
	if comment.ParentIds != "" {
		existingComments = true
	}

	game, err := repository.PutComment(cohort, id, &comment, existingComments)
	if err != nil {
		return api.Failure(err), nil
	}

	if err := database.SendGameCommentEvent(game, &comment); err != nil {
		log.Error("Failed to send game comment notification event:", err)
	}

	if strings.HasPrefix(event.RawPath, "/game/v2/") {
		response := struct {
			Game    database.Game            `json:"game"`
			Comment database.PositionComment `json:"comment"`
		}{
			Game:    *game,
			Comment: comment,
		}
		return api.Success(response), nil
	}

	return api.Success(game), nil
}

func getComment(event api.Request) (database.PositionComment, error) {
	comment := database.PositionComment{}
	if err := json.Unmarshal([]byte(event.Body), &comment); err != nil {
		return comment, errors.Wrap(400, "Invalid request: unable to unmarshal body", "", err)
	}

	if comment.Owner.Username != api.GetUserInfo(event).Username {
		return comment, errors.New(400, "Invalid request: owner does not match caller", "")
	}

	if comment.Owner.DisplayName == "" {
		return comment, errors.New(400, "Invalid request: owner displayName must not be empty", "")
	}

	if !database.IsValidCohort(database.DojoCohort(comment.Owner.Cohort)) {
		return comment, errors.New(400, "Invalid request: owner cohort is invalid", "")
	}

	if comment.Fen == "" {
		return comment, errors.New(400, "Invalid request: fen is required", "")
	}

	if comment.Ply < 0 {
		return comment, errors.New(400, "Invalid request: ply must be non-negative", "")
	}

	if comment.Content == "" && comment.SuggestedVariation == "" {
		return comment, errors.New(400, "Invalid request: one of content and suggestedVariation must be non-empty", "")
	}

	comment.Id = uuid.NewString()
	comment.CreatedAt = time.Now().Format(time.RFC3339)
	comment.UpdatedAt = comment.CreatedAt

	return comment, nil
}
