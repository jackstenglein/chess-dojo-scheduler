package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type Game struct {
	// The Dojo cohort for the game
	Cohort DojoCohort `dynamodbav:"cohort" json:"cohort"`

	// The sort key of the game, in the form of date_uuid
	Id string `dynamodbav:"id" json:"id"`

	// The player with the white pieces
	White string `dynamodbav:"white" json:"white"`

	// The player with the black pieces
	Black string `dynamodbav:"black" json:"black"`

	// The date that the game was played
	Date string `dynamodbav:"date" json:"date"`

	// The username of the owner of this game
	Owner string `dynamodbav:"owner" json:"owner"`

	// The PGN headers of the game
	Headers map[string]string `dynamodbav:"headers" json:"headers"`

	// The PGN text of the game
	Pgn string `dynamodbav:"pgn" json:"pgn"`
}

type GameGetter interface {
	// GetGame returns the Game object with the provided cohort and id.
	GetGame(cohort, id string) (*Game, error)
}

func (repo *dynamoRepository) GetGame(cohort, id string) (*Game, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"cohort": {
				S: aws.String(cohort),
			},
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(gameTable),
	}

	result, err := repo.svc.GetItem(input)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}
	if result.Item == nil {
		return nil, errors.New(404, "Invalid request: the specified game does not exist", "GetGame result.Item is nil")
	}

	game := Game{}
	if err = dynamodbattribute.UnmarshalMap(result.Item, &game); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetGame result", err)
	}
	return &game, nil
}
