package main

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const funcName = "user-graduate-handler"

var repository database.GraduationCreator = database.DynamoDB

type GraduationRequest struct {
	Comments string `json:"comments"`
}

type GraduationResponse struct {
	Graduation *database.Graduation `json:"graduation"`
	UserUpdate *database.UserUpdate `json:"userUpdate"`
}

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)

	info := api.GetUserInfo(event)
	if info.Username == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: username is required", "")), nil
	}

	request := &GraduationRequest{}
	if err := json.Unmarshal([]byte(event.Body), request); err != nil {
		return api.Failure(funcName, errors.Wrap(400, "Invalid request: unable to unmarshal request body", "", err)), nil
	}

	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	nextCohort := user.DojoCohort.GetNextCohort()
	if nextCohort == database.NoCohort {
		return api.Failure(funcName, errors.New(400, fmt.Sprintf("Invalid request: cohort `%s` cannot graduate", user.DojoCohort), "")), nil
	}

	var requirements []*database.Requirement
	var startKey string
	for ok := true; ok; ok = (startKey != "") {
		reqs, lastKey, err := repository.ListRequirements(user.DojoCohort, true, startKey)
		if err != nil {
			return api.Failure(funcName, err), nil
		}
		requirements = append(requirements, reqs...)
		startKey = lastKey
	}

	startedAt := user.LastGraduatedAt
	if startedAt == "" {
		startedAt = user.CreatedAt
	}
	updatedAt := time.Now().Format(time.RFC3339)

	startRating, currentRating := user.GetRatings()

	graduation := database.Graduation{
		Username:        info.Username,
		DiscordUsername: user.DiscordUsername,
		PreviousCohort:  user.DojoCohort,
		NewCohort:       nextCohort,
		Score:           user.CalculateScore(requirements),
		RatingSystem:    user.RatingSystem,
		StartRating:     startRating,
		CurrentRating:   currentRating,
		Comments:        request.Comments,
		Progress:        user.Progress,
		StartedAt:       startedAt,
		UpdatedAt:       updatedAt,
	}
	if err := repository.PutGraduation(&graduation); err != nil {
		return api.Failure(funcName, err), nil
	}

	var numberOfGraduations = user.NumberOfGraduations + 1
	update := database.UserUpdate{
		NumberOfGraduations: &numberOfGraduations,
		LastGraduatedAt:     &updatedAt,
		DojoCohort:          &nextCohort,
	}
	if err := repository.UpdateUser(info.Username, &update); err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, &GraduationResponse{Graduation: &graduation, UserUpdate: &update}), nil
}

func main() {
	lambda.Start(Handler)
}
