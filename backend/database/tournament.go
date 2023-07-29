package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type TournamentType string

const (
	Swiss TournamentType = "SWISS"
	Arena TournamentType = "ARENA"
)

type Tournament struct {
	// The type of the tournament and the hash key of the table
	Type TournamentType `dynamodbav:"type" json:"type"`

	// The time the tournament starts at in ISO-8601 format
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`

	// The Lichess id of the tournament
	Id string `dynamodbav:"id" json:"id"`

	// The name of the tournament
	Name string `dynamodbav:"name" json:"name"`

	// Optional details about the tournament
	Description string `dynamodbav:"description" json:"description"`

	// Whether the tournament is rated or not
	Rated bool `dynamodbav:"rated" json:"rated"`

	// The time limit in seconds the position is meant to be played at
	LimitSeconds int `dynamodbav:"limitSeconds" json:"limitSeconds"`

	// The time increment in seconds the position is meant to be played at
	IncrementSeconds int `dynamodbav:"incrementSeconds" json:"incrementSeconds"`

	// The FEN of the starting position, if the tournament uses a custom position
	Fen string `dynamodbav:"fen,omitempty" json:"fen,omitempty"`

	// The Lichess URL of the tournament
	Url string `dynamodbav:"url" json:"url"`

	/** Arena-Specific attributes. Only present if Type is Arena. **/

	// The number of minutes the arena lasts for
	LengthMinutes int `dynamodbav:"lengthMinutes,omitempty" json:"lengthMinutes,omitempty"`

	/** Swiss-Specific attributes. Only present if Type is Swiss. **/

	// The number of rounds in the tournament
	NumRounds int `dynamodbav:"numRounds,omitempty" json:"numRounds,omitempty"`
}

type LeaderboardPlayer struct {
	Username string  `dynamodbav:"username" json:"username"`
	Rating   int     `dynamodbav:"rating" json:"rating"`
	Score    float32 `dynamodbav:"score" json:"score"`
	Rank     int     `dynamodbav:"rank" json:"rank"`
}

type Leaderboard struct {
	TimeControl string               `dynamodbav:"timeControl" json:"timeControl"`
	Type        TournamentType       `dynamodbav:"type" json:"type"`
	Players     []*LeaderboardPlayer `dynamodbav:"players" json:"players"`
}

// SetTournament inserts the provided tournament into the database.
func (repo *dynamoRepository) SetTournament(tournament *Tournament) error {
	if tournament == nil {
		return nil
	}

	item, err := dynamodbattribute.MarshalMap(tournament)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal tournament", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(tournamentTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed DynamoDB PutItem request", err)
}

// ListTournaments returns a list of tournaments matching the provided type.
func (repo *dynamoRepository) ListTournaments(t TournamentType, startKey string) ([]*Tournament, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#type = :t"),
		ExpressionAttributeNames: map[string]*string{
			"#type": aws.String("type"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":t": {S: aws.String(string(t))},
		},
		ScanIndexForward: aws.Bool(false),
		TableName:        aws.String(tournamentTable),
	}

	var tournaments []*Tournament
	lastKey, err := repo.query(input, startKey, &tournaments)
	if err != nil {
		return nil, "", err
	}
	return tournaments, lastKey, nil
}
