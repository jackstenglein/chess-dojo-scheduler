package main

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const testUsername = "test-graduate"

var testUser = &database.User{
	Username:              testUsername,
	Email:                 "test@chess-dojo-scheduler.com",
	Name:                  "Test Name",
	DiscordUsername:       "testDiscord",
	RatingSystem:          database.Chesscom,
	ChesscomUsername:      "testChesscom",
	LichessUsername:       "testLichess",
	StartChesscomRating:   500,
	CurrentChesscomRating: 2300,
	DojoCohort:            "2300-2400",
	LastGraduatedAt:       "testLastGraduatedAt",
	NumberOfGraduations:   2,
	PreviousCohort:        "2200-2300",
	Progress: map[string]*database.RequirementProgress{
		"5942704e-e164-48a5-aba6-bf0cb99773be": {
			RequirementId: "5942704e-e164-48a5-aba6-bf0cb99773be",
			Counts: map[database.DojoCohort]int{
				"2300-2400": 25,
			},
		},
	},
}

var testUserAfterGraduation = &database.User{
	Username:              testUsername,
	DiscordUsername:       "testDiscord",
	RatingSystem:          database.Chesscom,
	ChesscomUsername:      "testChesscom",
	LichessUsername:       "testLichess",
	StartChesscomRating:   500,
	CurrentChesscomRating: 2300,
	DojoCohort:            "2400+",
	LastGraduatedAt:       "Unknown",
	NumberOfGraduations:   3,
	PreviousCohort:        "2300-2400",
	Progress: map[string]*database.RequirementProgress{
		"5942704e-e164-48a5-aba6-bf0cb99773be": {
			RequirementId: "5942704e-e164-48a5-aba6-bf0cb99773be",
			Counts: map[database.DojoCohort]int{
				"2300-2400": 25,
			},
		},
	},
	UpdatedAt: "Unknown",
}

func setupSuite(t *testing.T) func(t *testing.T) {
	err := database.DynamoDB.SetUserConditional(testUser, nil)
	if err != nil {
		t.Errorf("Failed to create user: %v", err)
	}

	return nil
}

func getEvent(testName string, username string, comments string) api.Request {
	return api.Request{
		RequestContext: events.APIGatewayProxyRequestContext{
			RequestID: testName,
			Authorizer: map[string]interface{}{
				"jwt": map[string]interface{}{
					"claims": map[string]interface{}{
						"cognito:username": username,
					},
				},
			},
		},
		Body: fmt.Sprintf("{\"comments\":\"%s\"}", comments),
	}
}

func TestGraduate(t *testing.T) {
	setupSuite(t)

	ctx := context.Background()

	table := []struct {
		name           string
		username       string
		comments       string
		wantCode       int
		wantErr        bool
		wantGraduation *database.Graduation
		wantUser       *database.User
	}{
		{
			name:     "MissingUsername",
			username: "",
			wantCode: 400,
			wantErr:  true,
		},
		{
			name:     "NonexistentUser",
			username: "nonexistentUser",
			wantCode: 404,
			wantErr:  true,
		},
		{
			name:     "SuccessfulRequest",
			username: testUsername,
			comments: "These are the comments",
			wantCode: 200,
			wantGraduation: &database.Graduation{
				Username:            testUsername,
				DiscordUsername:     testUser.DiscordUsername,
				PreviousCohort:      testUser.DojoCohort,
				NewCohort:           "2400+",
				Score:               25,
				RatingSystem:        database.Chesscom,
				StartRating:         testUser.StartChesscomRating,
				CurrentRating:       testUser.CurrentChesscomRating,
				Comments:            "These are the comments",
				Progress:            testUser.Progress,
				StartedAt:           testUser.LastGraduatedAt,
				CreatedAt:           "Unknown",
				NumberOfGraduations: 3,
			},
			wantUser: testUserAfterGraduation,
		},
		{
			name:     "InvalidCohort",
			username: testUsername,
			comments: "These are the comments",
			wantCode: 400,
			wantErr:  true,
		},
	}

	for _, tc := range table {
		t.Run(tc.name, func(t *testing.T) {
			event := getEvent(tc.name, tc.username, tc.comments)
			got, err := Handler(ctx, event)

			if err != nil {
				t.Errorf("Graduate(%v) got err: %v", event, err)
			}

			if got.StatusCode != tc.wantCode {
				t.Errorf("Graduate(%v) response: %v", event, got)
				t.Fatalf("Graduate(%v) got status: %d; want status: %d", event, got.StatusCode, tc.wantCode)
			}

			if !tc.wantErr {
				gotResp := &GraduationResponse{}
				json.Unmarshal([]byte(got.Body), gotResp)

				if diff := cmp.Diff(tc.wantGraduation, gotResp.Graduation, cmpopts.IgnoreFields(database.Graduation{}, "CreatedAt")); diff != "" {
					t.Errorf("Graduate(%v) diff (-want +got):\n%s", event, diff)
				}
				if diff := cmp.Diff(tc.wantUser, gotResp.UserUpdate, cmpopts.EquateEmpty(), cmpopts.IgnoreFields(database.User{}, "LastGraduatedAt", "UpdatedAt")); diff != "" {
					t.Errorf("Graduate(%v) diff (-want +got):\n%s", event, diff)
				}
				if gotResp.Graduation.CreatedAt != gotResp.UserUpdate.LastGraduatedAt {
					t.Errorf("Graduate(%v) Graduation.CreatedAt: %s; UserUpdate.LastGraduatedAt: %s", event, gotResp.Graduation.CreatedAt, gotResp.UserUpdate.LastGraduatedAt)
				}
			}
		})
	}
}
