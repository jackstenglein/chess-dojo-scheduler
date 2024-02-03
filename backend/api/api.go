package api

import (
	"encoding/json"
	"fmt"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"

	"github.com/aws/aws-lambda-go/events"
)

type Request events.APIGatewayProxyRequest
type Response events.APIGatewayProxyResponse

// UserInfo contains user information that is accessible from the Cognito id token claims.
type UserInfo struct {
	// The username of the user.
	Username string `json:"-"`

	// The email of the user
	Email string `json:"-"`
}

// GetUserInfo extracts the user info from the id token claim of the given request.
// Any fields that cannot be extracted are left blank.
func GetUserInfo(event Request) *UserInfo {
	var username string
	var email string

	if jwt, ok := event.RequestContext.Authorizer["jwt"]; ok {
		if jwtMap, ok := jwt.(map[string]interface{}); ok {
			if claims, ok := jwtMap["claims"]; ok {
				if claimsMap, ok := claims.(map[string]interface{}); ok {
					username, ok = claimsMap["cognito:username"].(string)
					email, ok = claimsMap["email"].(string)
				}
			}
		}
	}

	return &UserInfo{Username: username, Email: email}
}

// errorToResponse converts the given error into an AWS ApiGateway Response object.
func errorToResponse(e *errors.Error) Response {
	if e == nil {
		return Response{StatusCode: 200}
	}

	if e.Code >= 500 {
		log.Error(e)
	} else {
		log.Warn(e)
	}

	var message string
	if body, err := json.Marshal(e); err != nil {
		log.Error("Cannot marshal error:", err)
		message = fmt.Sprintf("Unknown error (cannot marshal): %s", e.PublicMessage)
	} else {
		message = string(body)
	}

	return Response{
		StatusCode:      e.Code,
		IsBase64Encoded: false,
		Body:            message,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	}
}

// Failure converts the given error into an AWS ApiGateway Response object.
func Failure(err error) Response {
	var lerr *errors.Error
	if errors.As(err, &lerr) {
		return errorToResponse(lerr)
	}

	log.Error(err)
	var message string
	body, err := json.Marshal(map[string]interface{}{
		"code":    500,
		"message": "Unknown error (unknown type): " + err.Error(),
	})
	if err != nil {
		message = fmt.Sprintf("{\"publicMessage\": \"Unknown error (unknown type, cannot marshal): %s\"}", err)
	} else {
		message = string(body)
	}

	return Response{
		StatusCode:      500,
		IsBase64Encoded: false,
		Body:            message,
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	}
}

// Success returns an AWS ApiGateway Response object with the provided
// object encoded as the JSON body.
func Success(in interface{}) Response {
	body, err := json.Marshal(in)
	if err != nil {
		log.Error(err)
		return Response{
			StatusCode:      500,
			IsBase64Encoded: false,
			Body:            fmt.Sprintf("{\"publicMessage\": \"Request was successful, but body failed to marshal: %s\"}", err),
			Headers: map[string]string{
				"Content-Type":                "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		}
	}

	log.Debugf("Response: %#v", in)
	return Response{
		StatusCode:      200,
		IsBase64Encoded: false,
		Body:            string(body),
		Headers: map[string]string{
			"Content-Type":                "application/json",
			"Access-Control-Allow-Origin": "*",
		},
	}
}
