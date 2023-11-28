package main

import (
	"context"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/log"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

var repository database.CourseGetter = database.DynamoDB

const funcName = "course-purchase-handler"

type PurchaseCourseResponse struct {
	Url string `json:"url"`
}

func main() {
	lambda.Start(handler)
}

func handler(ctx context.Context, event api.Request) (api.Response, error) {
	log.SetRequestId(event.RequestContext.RequestID)
	log.Debugf("Event: %#v", event)

	info := api.GetUserInfo(event)

	courseType := event.PathParameters["type"]
	id := event.PathParameters["id"]
	if courseType == "" || id == "" {
		return api.Failure(funcName, errors.New(400, "Invalid request: type and id are required", "")), nil
	}

	course, err := repository.GetCourse(courseType, id)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	purchaseOption := course.PurchaseOptions[0]
	selectedPurchaseOption := event.QueryStringParameters["purchaseOption"]
	if len(course.PurchaseOptions) > 1 && selectedPurchaseOption != "" {
		for _, option := range course.PurchaseOptions {
			if option.Name == selectedPurchaseOption {
				purchaseOption = option
				break
			}
		}
	}

	cancelUrl := event.QueryStringParameters["cancelUrl"]

	url, err := payment.PurchaseCourseUrl(info.Username, course, purchaseOption, cancelUrl)
	if err != nil {
		return api.Failure(funcName, err), nil
	}

	return api.Success(funcName, PurchaseCourseResponse{Url: url}), nil
}
