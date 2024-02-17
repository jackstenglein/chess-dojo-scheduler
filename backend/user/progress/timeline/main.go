package main

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.UserProgressUpdater = database.DynamoDB

type UpdateTimelineRequest struct {
	RequirementId string                    `json:"requirementId"`
	Cohort        database.DojoCohort       `json:"cohort"`
	Updated       []*database.TimelineEntry `json:"updated"`
	Deleted       []*database.TimelineEntry `json:"deleted"`
	Count         int                       `json:"count"`
	MinutesSpent  int                       `json:"minutesSpent"`
}

func updateCustomTaskProgress(request *UpdateTimelineRequest, user *database.User) {
	progress, ok := user.Progress[request.RequirementId]
	if !ok {
		progress = &database.RequirementProgress{
			RequirementId: request.RequirementId,
			Counts:        make(map[database.DojoCohort]int),
			MinutesSpent:  make(map[database.DojoCohort]int),
		}
	}
	progress.UpdatedAt = time.Now().Format(time.RFC3339)
	progress.MinutesSpent[request.Cohort] = request.MinutesSpent
	user.Progress[request.RequirementId] = progress
}

func updateDefaultTaskProgress(request *UpdateTimelineRequest, user *database.User) error {
	requirement, err := repository.GetRequirement(request.RequirementId)
	if err != nil {
		return err
	}

	progress, ok := user.Progress[request.RequirementId]
	if !ok {
		progress = &database.RequirementProgress{
			RequirementId: request.RequirementId,
			Counts:        make(map[database.DojoCohort]int),
			MinutesSpent:  make(map[database.DojoCohort]int),
		}
	}
	progress.UpdatedAt = time.Now().Format(time.RFC3339)
	progress.MinutesSpent[request.Cohort] = request.MinutesSpent
	if requirement.NumberOfCohorts == 1 || requirement.NumberOfCohorts == 0 {
		progress.Counts[database.AllCohorts] = request.Count
	} else {
		progress.Counts[request.Cohort] = request.Count
	}
	user.Progress[progress.RequirementId] = progress
	return nil
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	request := &UpdateTimelineRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}
	if request.RequirementId == "" {
		return api.Failure(errors.New(400, "Invalid request: requirementId is required", "")), nil
	}
	if request.Cohort == "" {
		return api.Failure(errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	if len(request.Updated) == 0 && len(request.Deleted) == 0 {
		return api.Failure(errors.New(400, "Invalid request: at least one change is required", "")), nil
	}

	for _, entry := range request.Updated {
		if entry.Owner != info.Username {
			return api.Failure(errors.New(400, "Invalid request: you are not the owner of an updated entry", "")), nil
		}
	}

	for _, entry := range request.Deleted {
		if entry.Owner != info.Username {
			return api.Failure(errors.New(400, "Invalid request: you are not the owner of a deleted entry", "")), nil
		}
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
	}

	if len(request.Deleted) > 0 {
		_, err := repository.DeleteTimelineEntries(request.Deleted)
		if err != nil {
			return api.Failure(errors.Wrap(500, "Temporary server error", "Failed to delete timeline entries", err)), nil
		}
	}

	if len(request.Updated) > 0 {
		_, err := repository.PutTimelineEntries(request.Updated)
		if err != nil {
			return api.Failure(err), nil
		}
	}

	// Update user's progress
	found := false
	for _, t := range user.CustomTasks {
		if t.Id == request.RequirementId {
			updateCustomTaskProgress(request, user)
			found = true
			break
		}
	}
	if !found {
		updateDefaultTaskProgress(request, user)
	}

	update := &database.UserUpdate{
		Progress: &user.Progress,
	}
	user, err = repository.UpdateUser(user.Username, update)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(user), nil
}

func main() {
	lambda.Start(Handler)
}
