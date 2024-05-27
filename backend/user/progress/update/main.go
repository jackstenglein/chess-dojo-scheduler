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

var repository database.UserProgressUpdater = database.DynamoDB

type ProgressUpdateRequest struct {
	RequirementId           string              `json:"requirementId"`
	Cohort                  database.DojoCohort `json:"cohort"`
	IncrementalCount        int                 `json:"incrementalCount"`
	IncrementalMinutesSpent int                 `json:"incrementalMinutesSpent"`
	Date                    string              `json:"date"`
	Notes                   string              `json:"notes"`
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
	now := time.Now()
	progress.UpdatedAt = now.Format(time.RFC3339)

	date := now
	if request.Date != "" {
		d, err := time.Parse(time.RFC3339, request.Date)
		if err != nil {
			log.Errorf("Failed to parse request.Date: %v", err)
		} else {
			date = d
		}
	}

	timelineEntry := &database.TimelineEntry{
		TimelineEntryKey: database.TimelineEntryKey{
			Owner: user.Username,
			Id:    fmt.Sprintf("%s_%s", date.Format(time.DateOnly), uuid.NewString()),
		},
		OwnerDisplayName:    user.DisplayName,
		RequirementId:       request.RequirementId,
		RequirementName:     task.Name,
		RequirementCategory: "Non-Dojo",
		ScoreboardDisplay:   task.ScoreboardDisplay,
		Cohort:              request.Cohort,
		TotalCount:          1,
		MinutesSpent:        request.IncrementalMinutesSpent,
		TotalMinutesSpent:   progress.MinutesSpent[request.Cohort],
		Date:                date.Format(time.RFC3339),
		CreatedAt:           now.Format(time.RFC3339),
		Notes:               request.Notes,
	}
	if err := repository.PutTimelineEntry(timelineEntry); err != nil {
		return api.Failure(err), nil
	}

	user, err := repository.UpdateUserProgress(user.Username, progress)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(user), nil
}

func handleDefaultTask(request *ProgressUpdateRequest, user *database.User) (api.Response, error) {
	requirement, err := repository.GetRequirement(request.RequirementId)
	if err != nil {
		return api.Failure(err), nil
	}
	totalCount, ok := requirement.Counts[request.Cohort]
	if !ok {
		return api.Failure(errors.New(400, fmt.Sprintf("Invalid request: cohort `%s` does not apply to this requirement", request.Cohort), "")), nil
	}

	progress, ok := user.Progress[request.RequirementId]
	if !ok {
		progress = &database.RequirementProgress{
			RequirementId: request.RequirementId,
			Counts:        make(map[database.DojoCohort]int),
			MinutesSpent:  make(map[database.DojoCohort]int),
		}
	}

	originalScore := requirement.CalculateScore(request.Cohort, progress)

	var originalCount int
	if requirement.IsExpired(progress) {
		originalCount = 0
	} else if requirement.NumberOfCohorts == 1 || requirement.NumberOfCohorts == 0 {
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

	date := now
	if request.Date != "" {
		d, err := time.Parse(time.RFC3339, request.Date)
		if err != nil {
			log.Errorf("Failed to parse request.Date: %v", err)
		} else {
			date = d
		}
	}

	newScore := requirement.CalculateScore(request.Cohort, progress)

	name := requirement.ShortName
	if name == "" {
		name = requirement.Name
	}

	timelineEntry := &database.TimelineEntry{
		TimelineEntryKey: database.TimelineEntryKey{
			Owner: user.Username,
			Id:    fmt.Sprintf("%s_%s", date.Format(time.DateOnly), uuid.NewString()),
		},
		OwnerDisplayName:    user.DisplayName,
		RequirementId:       request.RequirementId,
		RequirementName:     name,
		RequirementCategory: requirement.Category,
		ScoreboardDisplay:   requirement.ScoreboardDisplay,
		ProgressBarSuffix:   requirement.ProgressBarSuffix,
		Cohort:              request.Cohort,
		TotalCount:          totalCount,
		PreviousCount:       originalCount,
		NewCount:            originalCount + request.IncrementalCount,
		DojoPoints:          newScore - originalScore,
		TotalDojoPoints:     newScore,
		MinutesSpent:        request.IncrementalMinutesSpent,
		TotalMinutesSpent:   progress.MinutesSpent[request.Cohort],
		Date:                date.Format(time.RFC3339),
		CreatedAt:           updatedAt,
		Notes:               request.Notes,
	}

	if err := repository.PutTimelineEntry(timelineEntry); err != nil {
		return api.Failure(err), nil
	}

	user, err = repository.UpdateUserProgress(user.Username, progress)
	if err != nil {
		return api.Failure(err), nil
	}
	return api.Success(user), nil
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Infof("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(errors.New(400, "Invalid request: username is required", "")), nil
	}

	request := &ProgressUpdateRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		return api.Failure(errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}
	if request.RequirementId == "" {
		return api.Failure(errors.New(400, "Invalid request: requirementId is required", "")), nil
	}
	if request.Cohort == "" {
		return api.Failure(errors.New(400, "Invalid request: cohort is required", "")), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(err), nil
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
