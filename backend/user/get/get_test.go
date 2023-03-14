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

const testUsername = "test-getUser"
const testEmail = "test@chess-dojo-scheduler.com"
const testName = "Test Name"

func setupSuite(t *testing.T) func(t *testing.T) {
	_, err := database.DynamoDB.CreateUser(testUsername, testEmail, testName)
	if err != nil {
		t.Errorf("Failed to create user: %v", err)
	}

	return func(t *testing.T) {
		err := database.DynamoDB.DeleteUser(testUsername)
		if err != nil {
			t.Errorf("Failed to delete user: %v", err)
		}
	}
}

func getEvent(testName string, username string, public bool) api.Request {
	if public {
		return api.Request{
			RequestContext: events.APIGatewayProxyRequestContext{
				RequestID: testName,
			},
			PathParameters: map[string]string{
				"username": username,
			},
		}
	}

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
	}
}

func TestGetUser(t *testing.T) {
	teardownSuite := setupSuite(t)
	defer teardownSuite(t)

	ctx := context.Background()

	table := []struct {
		name     string
		username string
		public   bool
		wantCode int
		wantErr  bool
		wantUser *database.User
	}{
		{
			name:     "PublicMissingUsername",
			username: "",
			public:   true,
			wantCode: 400,
			wantErr:  true,
		},
		{
			name:     "PrivateMissingUsername",
			username: "",
			public:   false,
			wantCode: 400,
			wantErr:  true,
		},
		{
			name:     "PublicNonexistentUser",
			username: "nonexistentUser",
			public:   true,
			wantCode: 404,
			wantErr:  true,
		},
		{
			name:     "PublicSuccessfulRequest",
			username: testUsername,
			public:   true,
			wantCode: 200,
			wantUser: &database.User{
				Username:   testUsername,
				DojoCohort: database.NoCohort,
				Progress:   map[string]*database.RequirementProgress{},
				Timeline:   make([]*database.TimelineEntry, 0),
			},
		},
		{
			name:     "PrivateSuccessfulRequest",
			username: testUsername,
			public:   false,
			wantCode: 200,
			wantUser: &database.User{
				Username:   testUsername,
				DojoCohort: database.NoCohort,
				Progress:   map[string]*database.RequirementProgress{},
				Timeline:   make([]*database.TimelineEntry, 0),
			},
		},
	}

	for _, tc := range table {
		t.Run(tc.name, func(t *testing.T) {
			event := getEvent(tc.name, tc.username, tc.public)
			got, err := Handler(ctx, event)

			if err != nil {
				t.Errorf("GetUser(%v) got err: %v", event, err)
			}

			if got.StatusCode != tc.wantCode {
				t.Errorf("GetUser(%v) got status: %d; want status: %d", event, got.StatusCode, tc.wantCode)
			}

			if !tc.wantErr {
				gotUser := &database.User{}
				json.Unmarshal([]byte(got.Body), gotUser)
				gotUser.CreatedAt = ""
				gotUser.UpdatedAt = ""

				if diff := cmp.Diff(tc.wantUser, gotUser, cmpopts.IgnoreFields(database.User{}, "CreatedAt", "UpdatedAt")); diff != "" {
					t.Errorf("GetUser(%v) diff (-want +got):\n%s", event, diff)
				}
			}
		})
	}
}
