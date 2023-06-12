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

const funcName = "user-progress-update-handler"

var repository database.UserProgressUpdater = database.DynamoDB

type ProgressUpdateRequest struct {
	RequirementId           string              `json:"requirementId"`
	Cohort                  database.DojoCohort `json:"cohort"`
	IncrementalCount        int                 `json:"incrementalCount"`
	IncrementalMinutesSpent int                 `json:"incrementalMinutesSpent"`
}

func handleCustomTask(request *ProgressUpdateRequest, user *database.User, task *database.CustomTask) (api.Response, error) {
	progress, ok := user.Progress[request.RequirementId]
	if !ok {
		progress = &database.RequirementProgress{
			RequirementId: request.RequirementId,
			Counts:        make(map[database.DojoCohort]int),
			MinutesSpent:  make(map[database.DojoCohort]int),
		}
	}
	progress.MinutesSpent[request.Cohort] += request.IncrementalMinutesSpent
	progress.UpdatedAt = time.Now().Format(time.RFC3339)

	timelineEntry := &database.TimelineEntry{
		RequirementId:       request.RequirementId,
		RequirementName:     task.Name,
		RequirementCategory: "Non-Dojo",
		ScoreboardDisplay:   task.ScoreboardDisplay,
		Cohort:              request.Cohort,
		TotalCount:          1,
		MinutesSpent:        request.IncrementalMinutesSpent,
		CreatedAt:           time.Now().Format(time.RFC3339),
	}

	user, err := repository.UpdateUserProgress(user.Username, progress, timelineEntry)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func handleDefaultTask(request *ProgressUpdateRequest, user *database.User) (api.Response, error) {
	requirement, err := repository.GetRequirement(request.RequirementId)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	totalCount, ok := requirement.Counts[request.Cohort]
	if !ok {
		return api.Failure(funcName, errors.New(400, fmt.Sprintf("Invalid request: cohort `%s` does not apply to this requirement", request.Cohort), "")), nil
	}

	progress, ok := user.Progress[request.RequirementId]
	if !ok {
		progress = &database.RequirementProgress{
			RequirementId: request.RequirementId,
			Counts:        make(map[database.DojoCohort]int),
			MinutesSpent:  make(map[database.DojoCohort]int),
		}
	}

	var originalCount int
	if requirement.NumberOfCohorts == 1 || requirement.NumberOfCohorts == 0 {
		originalCount = progress.Counts[database.AllCohorts]
		progress.Counts[database.AllCohorts] += request.IncrementalCount
	} else {
		originalCount = progress.Counts[request.Cohort]
		progress.Counts[request.Cohort] += request.IncrementalCount
	}
	progress.MinutesSpent[request.Cohort] += request.IncrementalMinutesSpent

	now := time.Now()
	updatedAt := now.Format(time.RFC3339)
	progress.UpdatedAt = updatedAt

	timelineEntry := &database.TimelineEntry{
		TimelineEntryKey: database.TimelineEntryKey{
			Owner: user.Username,
			Id:    fmt.Sprintf("%s_%s", now.Format(time.DateOnly), uuid.NewString()),
		},
		RequirementId:       request.RequirementId,
		RequirementName:     requirement.Name,
		RequirementCategory: requirement.Category,
		ScoreboardDisplay:   requirement.ScoreboardDisplay,
		ProgressBarSuffix:   requirement.ProgressBarSuffix,
		Cohort:              request.Cohort,
		TotalCount:          totalCount,
		PreviousCount:       originalCount,
		NewCount:            originalCount + request.IncrementalCount,
		MinutesSpent:        request.IncrementalMinutesSpent,
		CreatedAt:           updatedAt,
	}

	if err := repository.PutTimelineEntry(timelineEntry); err != nil {
		return api.Failure(funcName, err), nil
	}

	user, err = repository.UpdateUserProgress(user.Username, progress, timelineEntry)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	request := &ProgressUpdateRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}
	if request.RequirementId == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: requirementId is required", "")), nil
	}
	if request.Cohort == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	for _, t := range user.CustomTasks {
		if t.Id == request.RequirementId {
			return handleCustomTask(request, user, t)
		}
	}

	return handleDefaultTask(request, user)
}

func main() {
	lambda.Start(Handler)
}
