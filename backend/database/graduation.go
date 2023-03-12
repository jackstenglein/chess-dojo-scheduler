package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type Graduation struct {
	// The Cognito username of the graduating user.
	// The hash key of the table.
	Username string `dynamodbav:"username" json:"username"`

	// The Discord username of the graduating user.
	DiscordUsername string `dynamodbav:"discordUsername" json:"discordUsername"`

	// The cohort the user is graduating from.
	// The range key of the table.
	PreviousCohort DojoCohort `dynamodbav:"previousCohort" json:"previousCohort"`

	// The cohort the user is entering.
	NewCohort DojoCohort `dynamodbav:"newCohort" json:"newCohort"`

	// The user's cohort score at the time of graduation.
	Score float32 `dynamodbav:"score" json:"score"`

	// The user's preferred rating system at the time of graduation.
	RatingSystem RatingSystem `dynamodbav:"ratingSystem" json:"ratingSystem"`

	// The rating the user started with.
	StartRating int `dynamodbav:"startRating" json:"startRating"`

	// The user's rating at the time of graduation.
	CurrentRating int `dynamodbav:"currentRating" json:"currentRating"`

	// The user's comments on graduating.
	Comments string `dynamodbav:"comments" json:"comments"`

	// The user's progress at the time of graduation.
	Progress map[string]*RequirementProgress `dynamodbav:"progress" json:"progress"`

	// The number of times the user has graduated, including this graduation.
	NumberOfGraduations int `dynamodbav:"numberOfGraduations" json:"numberOfGraduations"`

	// The time the user started the cohort.
	StartedAt string `dynamodbav:"startedAt" json:"startedAt"`

	// The time that the user graduated.
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
}

type GraduationCreator interface {
	UserGetter
	UserUpdater
	RequirementLister

	// PutGraduation saves the provided Graduation in the database.
	PutGraduation(graduation *Graduation) error
}

type GraduationLister interface {
	// ListGraduations returns a list of graduations matching the provided cohort.
	ListGraduations(cohort DojoCohort, startKey string) ([]*Graduation, string, error)
}

// PutGraduation saves the provided Graduation in the database.
func (repo *dynamoRepository) PutGraduation(graduation *Graduation) error {
	item, err := dynamodbattribute.MarshalMap(graduation)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal graduation", err)
	}

	if len(graduation.Progress) == 0 {
		emptyMap := make(map[string]*dynamodb.AttributeValue)
		item["progress"] = &dynamodb.AttributeValue{M: emptyMap}
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(graduationTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// ListGraduations returns a list of graduations matching the provided cohort.
func (repo *dynamoRepository) ListGraduations(cohort DojoCohort, startKey string) ([]*Graduation, string, error) {
	input := &dynamodb.ScanInput{
		FilterExpression: aws.String("#previousCohort = :cohort"),
		ExpressionAttributeNames: map[string]*string{
			"#previousCohort": aws.String("previousCohort"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":cohort": {S: aws.String(string(cohort))},
		},
		TableName: aws.String(graduationTable),
	}

	var graduations []*Graduation
	lastKey, err := repo.scan(input, startKey, &graduations)
	if err != nil {
		return nil, "", err
	}
	return graduations, lastKey, nil
}
