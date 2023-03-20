package main

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const testUsername = "test-updateProgressUser"
const testEmail = "test@chess-dojo-scheduler.com"
const testName = "Test Name"

const repeatableReqId = "df074603-53f6-4d46-bd64-a207e8a0e289"
const repeatableReqName = "Algorithm 2"
const repeatableReqCategory = "Endgames"
const repeatableReqDisplay = database.Checkbox

const nonRepeatableReqId = "6b7966fd-4ea3-4075-939a-69e5811bc340"
const nonRepeatableReqName = "Polgar Mate-in-1s"
const nonRepeatableReqCategory = "Tactics"
const nonRepeatableReqDisplay = database.Unspecified

func setupSuite(t *testing.T) func(t *testing.T) {
	_, err := database.DynamoDB.CreateUser(testUsername, testEmail, testName)
	if err != nil {
		t.Errorf("Failed to create test user: %v", err)
	}

	return func(t *testing.T) {
		err := database.DynamoDB.DeleteUser(testUsername)
		if err != nil {
			t.Errorf("Failed to delete user: %v", err)
		}
	}
}

func getEvent(testName string, username string, update *ProgressUpdateRequest) api.Request {
	body, _ := json.Marshal(update)

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
		Body: string(body),
	}
}

func TestUpdateUser(t *testing.T) {
	teardownSuite := setupSuite(t)
	defer teardownSuite(t)

	ctx := context.Background()

	table := []struct {
		name     string
		username string
		update   *ProgressUpdateRequest
		wantCode int
		wantErr  bool
		wantUser *database.User
	}{
		{
			name:     "MissingUsername",
			wantCode: 400,
			wantErr:  true,
		},
		{
			name:     "MissingRequirementId",
			wantCode: 400,
			wantErr:  true,
			username: testUsername,
			update: &ProgressUpdateRequest{
				Cohort:                  "1000-1100",
				IncrementalCount:        1,
				IncrementalMinutesSpent: 15,
			},
		},
		{
			name:     "MissingCohort",
			wantCode: 400,
			wantErr:  true,
			username: testUsername,
			update: &ProgressUpdateRequest{
				RequirementId:           repeatableReqId,
				IncrementalCount:        1,
				IncrementalMinutesSpent: 15,
			},
		},
		{
			name:     "InvalidCohort",
			wantCode: 400,
			wantErr:  true,
			username: testUsername,
			update: &ProgressUpdateRequest{
				RequirementId:           repeatableReqId,
				Cohort:                  "fakeCohort",
				IncrementalCount:        1,
				IncrementalMinutesSpent: 15,
			},
		},
		{
			name:     "RepeatableRequirement",
			username: testUsername,
			update: &ProgressUpdateRequest{
				RequirementId:           repeatableReqId,
				Cohort:                  "1000-1100",
				IncrementalCount:        1,
				IncrementalMinutesSpent: 15,
			},
			wantCode: 200,
			wantUser: &database.User{
				Username:   testUsername,
				DojoCohort: database.NoCohort,
				Progress: map[string]*database.RequirementProgress{
					repeatableReqId: {
						RequirementId: repeatableReqId,
						Counts: map[database.DojoCohort]int{
							"1000-1100": 1,
						},
						MinutesSpent: map[database.DojoCohort]int{
							"1000-1100": 15,
						},
					},
				},
				Timeline: []*database.TimelineEntry{
					{
						RequirementId:       repeatableReqId,
						RequirementName:     repeatableReqName,
						RequirementCategory: repeatableReqCategory,
						ScoreboardDisplay:   repeatableReqDisplay,
						Cohort:              "1000-1100",
						TotalCount:          1,
						PreviousCount:       0,
						NewCount:            1,
						MinutesSpent:        15,
					},
				},
			},
		},
		{
			name:     "NonrepeatableRequirement",
			username: testUsername,
			update: &ProgressUpdateRequest{
				RequirementId:           nonRepeatableReqId,
				Cohort:                  "1100-1200",
				IncrementalCount:        50,
				IncrementalMinutesSpent: 100,
			},
			wantCode: 200,
			wantUser: &database.User{
				Username:   testUsername,
				DojoCohort: database.NoCohort,
				Progress: map[string]*database.RequirementProgress{
					repeatableReqId: {
						RequirementId: repeatableReqId,
						Counts: map[database.DojoCohort]int{
							"1000-1100": 1,
						},
						MinutesSpent: map[database.DojoCohort]int{
							"1000-1100": 15,
						},
					},
					nonRepeatableReqId: {
						RequirementId: nonRepeatableReqId,
						Counts: map[database.DojoCohort]int{
							database.AllCohorts: 50,
						},
						MinutesSpent: map[database.DojoCohort]int{
							"1100-1200": 100,
						},
					},
				},
				Timeline: []*database.TimelineEntry{
					{
						RequirementId:       repeatableReqId,
						RequirementName:     repeatableReqName,
						RequirementCategory: repeatableReqCategory,
						ScoreboardDisplay:   repeatableReqDisplay,
						Cohort:              "1000-1100",
						TotalCount:          1,
						PreviousCount:       0,
						NewCount:            1,
						MinutesSpent:        15,
					},
					{
						RequirementId:       nonRepeatableReqId,
						RequirementName:     nonRepeatableReqName,
						RequirementCategory: nonRepeatableReqCategory,
						ScoreboardDisplay:   nonRepeatableReqDisplay,
						Cohort:              "1100-1200",
						TotalCount:          306,
						PreviousCount:       0,
						NewCount:            50,
						MinutesSpent:        100,
					},
				},
			},
		},
	}

	for _, tc := range table {
		t.Run(tc.name, func(t *testing.T) {
			event := getEvent(tc.name, tc.username, tc.update)
			got, err := Handler(ctx, event)

			if err != nil {
				t.Errorf("UpdateProgress(%v) got err: %v", event, err)
			}

			if got.StatusCode != tc.wantCode {
				t.Errorf("UpdateProgress(%v) response: %v", event, got)
				t.Fatalf("UpdateProgress(%v) got status: %d; want status: %d", event, got.StatusCode, tc.wantCode)
			}

			if !tc.wantErr {
				gotUser := &database.User{}
				if err := json.Unmarshal([]byte(got.Body), gotUser); err != nil {
					t.Errorf("UpdateProgress(%v) failed to unmarshal body: %v", event, err)
				}

				opts := []cmp.Option{
					cmpopts.IgnoreFields(database.User{}, "CreatedAt", "UpdatedAt"),
					cmpopts.IgnoreFields(database.RequirementProgress{}, "UpdatedAt"),
					cmpopts.IgnoreFields(database.TimelineEntry{}, "CreatedAt"),
				}
				if diff := cmp.Diff(tc.wantUser, gotUser, opts...); diff != "" {
					t.Errorf("UpdateProgress(%v) diff (-want +got):\n%s", event, diff)
				}
			}
		})
	}
}
