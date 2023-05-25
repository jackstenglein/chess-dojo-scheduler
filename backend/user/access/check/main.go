package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/user/access"
)

const funcName = "user-access-handler"

var repository database.UserUpdater = database.DynamoDB

func Handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)
	user, err := repository.GetUser(info.Username)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	if isForbidden, err := access.IsForbidden(user.WixEmail); err != nil {
		if isForbidden {
			// Cache that the user is forbidden from accessing the site, that
			// way future reloads of the frontend immediately hide the site
			_, err := repository.UpdateUser(info.Username, &database.UserUpdate{
				IsForbidden: aws.Bool(true),
			})
			if err != nil {
				log.Error("Failed UpdateUser: ", err)
			}
		}

		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, nil), nil
}

func main() {
	lambda.Start(Handler)
}
