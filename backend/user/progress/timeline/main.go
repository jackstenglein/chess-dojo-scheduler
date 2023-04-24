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

const funcName = "user-progress-timeline-update-handler"

var repository database.UserProgressUpdater = database.DynamoDB

type UpdateTimelineRequest struct {
	RequirementId string                    `json:"requirementId"`
	Cohort        database.DojoCohort       `json:"cohort"`
	Entries       []*database.TimelineEntry `json:"entries"`
	Count         int                       `json:"count"`
	MinutesSpent  int                       `json:"minutesSpent"`
}

func removeIndex(s []*database.TimelineEntry, index int) []*database.TimelineEntry {
	if index == len(s)-1 {
		if index == 0 {
			return nil
		}
		s[index] = nil
		return s[:index-1]
	}
	s[index], s[len(s)-1] = s[len(s)-1], nil
	return s[:len(s)-1]
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	request := &UpdateTimelineRequest{}
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

	requirement, err := repository.GetRequirement(request.RequirementId)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	// Correct user's timeline
	log.Debugf("Timeline before removal: %+v", user.Timeline)
	for i := 0; i < len(user.Timeline) && len(user.Timeline) > 0; i++ {
		log.Debugf("Checking index: %d", i)
		if user.Timeline[i].RequirementId == request.RequirementId && user.Timeline[i].Cohort == request.Cohort {
			log.Debugf("Removing index: %d", i)
			user.Timeline = removeIndex(user.Timeline, i)
			log.Debugf("Timeline after removing index: %+v", user.Timeline)
			i--
		}
	}
	log.Debugf("Timeline after removal: %+v", user.Timeline)
	user.Timeline = append(user.Timeline, request.Entries...)
	log.Debugf("Timeline after append: %+v", user.Timeline)

	// Correct user's progress map
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

	update := &database.UserUpdate{
		Timeline: &user.Timeline,
		Progress: &user.Progress,
	}
	user, err = repository.UpdateUser(user.Username, update)
	if err != nil {
		return api.Failure(funcName, err), nil
	}
	return api.Success(funcName, user), nil
}

func main() {
	lambda.Start(Handler)
}
