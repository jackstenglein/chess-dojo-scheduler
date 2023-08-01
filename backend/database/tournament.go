package database

import (
	"fmt"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type TournamentType string

const (
	TournamentType_Swiss TournamentType = "SWISS"
	TournamentType_Arena TournamentType = "ARENA"
)

type Tournament struct {
	// The type of the tournament and the hash key of the table
	Type TournamentType `dynamodbav:"type" json:"type"`

	// The time the tournament starts at in ISO-8601 format and
	// the range key of the table.
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

type LeaderboardType string

const CurrentLeaderboard = "CURRENT"

// LeaderboardPlayer represents a single player in the tournament leaderboards.
type LeaderboardPlayer struct {
	// The Lichess username of the player.
	Username string `dynamodbav:"username" json:"username"`

	// The Lichess rating of the player.
	Rating int `dynamodbav:"rating" json:"rating"`

	// The score of the player in the given leaderboard.
	Score float32 `dynamodbav:"score" json:"score"`
}

type Leaderboard struct {
	// The type of the leaderboard and the hash key of the table. Follows this format:
	// LEADERBOARD_(MONTHLY|YEARLY)_(ARENA|SWISS|GRAND_PRIX)_(BLITZ|RAPID|CLASSICAL)
	Type LeaderboardType `dynamodbav:"type" json:"type"`

	// The start of the period the leaderboard applies to and the range key of the table.
	// For the current leaderboard, this is set to the value of CurrentLeaderboard.
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`

	// The time control of the leaderboard. Valid values are blitz, rapid and classical.
	TimeControl string `dynamodbav:"timeControl" json:"timeControl"`

	// The players in the leaderboard, sorted by their score.
	Players []LeaderboardPlayer `dynamodbav:"players" json:"players"`
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

// SetLeaderboard inserts the provided leaderboard into the database.
func (repo *dynamoRepository) SetLeaderboard(leaderboard Leaderboard) error {
	item, err := dynamodbattribute.MarshalMap(leaderboard)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal leaderboard", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(tournamentTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed DynamoDB PutItem request", err)
}

func (repo *dynamoRepository) GetCurrentLeaderboard(timePeriod, tournamentType, timeControl string) (*Leaderboard, error) {
	timePeriod = strings.ToUpper(timePeriod)
	tournamentType = strings.ToUpper(tournamentType)
	timeControl = strings.ToUpper(timeControl)

	leaderboardType := fmt.Sprintf("LEADERBOARD_%s_%s_%s", timePeriod, tournamentType, timeControl)
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {
				S: aws.String(leaderboardType),
			},
			"startsAt": {
				S: aws.String(CurrentLeaderboard),
			},
		},
		TableName: aws.String(tournamentTable),
	}

	leaderboard := Leaderboard{}
	if err := repo.getItem(input, &leaderboard); err != nil {
		return nil, err
	}
	return &leaderboard, nil
}
