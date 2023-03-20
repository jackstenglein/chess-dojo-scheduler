package main

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

const testUsername = "test-updateUser"
const testEmail = "test@chess-dojo-scheduler.com"
const testName = "Test Name"

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

func getEvent(testName string, username string, update *database.UserUpdate) api.Request {
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
		update   *database.UserUpdate
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
			name:     "SuccessfulRequest",
			username: testUsername,
			update: &database.UserUpdate{
				DiscordUsername:                  aws.String("testDiscordUsername"),
				Bio:                              aws.String("testBio"),
				RatingSystem:                     (*database.RatingSystem)(aws.String(string(database.Fide))),
				ChesscomUsername:                 aws.String("testChesscomUsername"),
				LichessUsername:                  aws.String("testLichessUsername"),
				FideId:                           aws.String("testFideId"),
				UscfId:                           aws.String("testUscfId"),
				StartChesscomRating:              aws.Int(1),
				StartLichessRating:               aws.Int(2),
				StartFideRating:                  aws.Int(3),
				StartUscfRating:                  aws.Int(4),
				DojoCohort:                       (*database.DojoCohort)(aws.String("2400+")),
				DisableBookingNotifications:      aws.Bool(true),
				DisableCancellationNotifications: aws.Bool(true),
			},
			wantCode: 200,
			wantUser: &database.User{
				Username:                         testUsername,
				Email:                            testEmail,
				Name:                             testName,
				DiscordUsername:                  "testDiscordUsername",
				Bio:                              "testBio",
				RatingSystem:                     database.Fide,
				ChesscomUsername:                 "testChesscomUsername",
				LichessUsername:                  "testLichessUsername",
				FideId:                           "testFideId",
				UscfId:                           "testUscfId",
				StartChesscomRating:              1,
				StartLichessRating:               2,
				StartFideRating:                  3,
				StartUscfRating:                  4,
				DojoCohort:                       "2400+",
				DisableBookingNotifications:      true,
				DisableCancellationNotifications: true,
			},
		},
	}

	for _, tc := range table {
		t.Run(tc.name, func(t *testing.T) {
			event := getEvent(tc.name, tc.username, tc.update)
			got, err := Handler(ctx, event)

			if err != nil {
				t.Errorf("UpdateUser(%v) got err: %v", event, err)
			}

			if got.StatusCode != tc.wantCode {
				t.Errorf("UpdateUser(%v) response: %v", event, got)
				t.Fatalf("UpdateUser(%v) got status: %d; want status: %d", event, got.StatusCode, tc.wantCode)
			}

			if !tc.wantErr {
				gotUser, err := database.DynamoDB.GetUser(tc.username)
				if err != nil {
					t.Errorf("GetUser(%s) got err: %v", tc.username, err)
				}

				if diff := cmp.Diff(tc.wantUser, gotUser, cmpopts.EquateEmpty(), cmpopts.IgnoreFields(database.User{}, "CreatedAt", "UpdatedAt")); diff != "" {
					t.Errorf("GetUser(%v) diff (-want +got):\n%s", event, diff)
				}
			}
		})
	}
}
