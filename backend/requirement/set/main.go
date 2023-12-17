package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/google/uuid"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.RequirementSetter = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	user, err := repository.GetUser(api.GetUserInfo(event).Username)
	if err != nil {
		return api.Failure(err), nil
	}
	if !user.IsAdmin && !user.IsCalendarAdmin {
		err := errors.New(403, "You do not have permission to perform this action", "")
		return api.Failure(err), nil
	}

	requirement := &database.Requirement{}
	if err := json.Unmarshal([]byte(event.Body), requirement); err != nil {
		err := errors.Wrap(400, "Invalid request: body format is invalid", "Unable to unmarshal body", err)
		return api.Failure(err), nil
	}

	if requirement.Id == "" {
		requirement.Id = uuid.NewString()
	}
	requirement.Status = database.Active

	if requirement.Category == "" {
		err := errors.New(400, "Invalid request: category is required", "")
		return api.Failure(err), nil
	}
	if requirement.Name == "" {
		err := errors.New(400, "Invalid request: name is required", "")
		return api.Failure(err), nil
	}
	if requirement.Description == "" {
		err := errors.New(400, "Invalid request: description is required", "")
		return api.Failure(err), nil
	}
	if len(requirement.Counts) == 0 {
		err := errors.New(400, "Invalid request: counts must have at least one object", "")
		return api.Failure(err), nil
	}
	if requirement.SortPriority == "" {
		err := errors.New(400, "Invalid request: sortPriority is required", "")
		return api.Failure(err), nil
	}
	if !requirement.ScoreboardDisplay.IsValid() {
		err := errors.New(400, fmt.Sprintf("Invalid request: scoreboardDisplay %q is invalid", requirement.ScoreboardDisplay), "")
		return api.Failure(err), nil
	}
	if requirement.NumberOfCohorts == 0 {
		requirement.NumberOfCohorts = 1
	}
	requirement.UpdatedAt = time.Now().Format(time.RFC3339)

	if err := repository.SetRequirement(requirement); err != nil {
		return api.Failure(err), nil
	}

	return api.Success(requirement), nil
}

func main() {
	lambda.Start(Handler)
}
