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

type LeaderboardType string

const (
	LeaderboardType_OpenClassical LeaderboardType = "OPEN_CLASSICAL"
)

const CurrentLeaderboard = "CURRENT"

var LeaderboardNames = []LeaderboardType{
	"ARENA",
	"SWISS",
	"GRAND_PRIX",
	"MIDDLEGAME_SPARRING",
	"ENDGAME_SPARRING",
}

var TimeControls = []string{
	"BLITZ",
	"RAPID",
	"CLASSICAL",
}

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
	// LEADERBOARD_(MONTHLY|YEARLY)_(ARENA|SWISS|GRAND_PRIX|MIDDLEGAME_SPARRING|ENDGAME_SPARRING)_(BLITZ|RAPID|CLASSICAL)
	Type LeaderboardType `dynamodbav:"type" json:"type"`

	// The start of the period the leaderboard applies to and the range key of the table.
	// For the current leaderboard, this is set to the value of CurrentLeaderboard.
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`

	// The time control of the leaderboard. Valid values are blitz, rapid and classical.
	TimeControl string `dynamodbav:"timeControl" json:"timeControl"`

	// The players in the leaderboard, sorted by their score.
	Players []LeaderboardPlayer `dynamodbav:"players" json:"players"`
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

// GetLeaderboard fetches the leaderboard with the provided values.
func (repo *dynamoRepository) GetLeaderboard(timePeriod, tournamentType, timeControl, startsAt string) (*Leaderboard, error) {
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
				S: aws.String(startsAt),
			},
		},
		TableName: aws.String(tournamentTable),
	}

	leaderboard := Leaderboard{
		Type:        LeaderboardType(leaderboardType),
		StartsAt:    startsAt,
		TimeControl: timeControl,
	}
	err := repo.getItem(input, &leaderboard)
	return &leaderboard, err
}

// OpenClassical represents an Open Classical tournament.
type OpenClassical struct {
	// The hash key of the tournaments table. Regular tournaments have a complicated
	// structure, but for Open Classicals, this is just the value OPEN_CLASSICAL
	Type LeaderboardType `dynamodbav:"type" json:"type"`

	// The start of the period the tournament applies to and the range key of the table.
	// For the current Open Classical, this is set to the value of CurrentLeaderboard.
	StartsAt string `dynamodbav:"startsAt" json:"startsAt"`

	// The name of a completed tournament. This attribute is only present on completed
	// open classicals.
	Name string `dynamodbav:"name" json:"name"`

	// Whether the open classical is accepting registrations or not.
	AcceptingRegistrations bool `dynamodbav:"acceptingRegistrations" json:"acceptingRegistrations"`

	// The sections in the tournament
	Sections map[string]OpenClassicalSection `dynamodbav:"sections" json:"sections"`

	// Players who are not in good standing and cannot register, mapped by their Lichess username.
	BannedPlayers map[string]OpenClassicalPlayer `dynamodbav:"bannedPlayers" json:"bannedPlayers"`
}

// A section in the Open Classical tournament. Generally consists of both a region and a rating range.
type OpenClassicalSection struct {
	// The name of the section.
	Name string `dynamodbav:"name" json:"name"`

	// The region of the section.
	Region string `dynamodbav:"region" json:"region"`

	// The rating section of the section.
	Section string `dynamodbav:"section" json:"section"`

	// The players in the section, mapped by their Lichess username.
	Players map[string]OpenClassicalPlayer `dynamodbav:"players" json:"players"`

	// The rounds in the tournament for this section.
	Rounds []OpenClassicalRound `dynamodbav:"rounds" json:"rounds"`
}

// OpenClassicalRound represents a single round in the Open Classical tournaments.
type OpenClassicalRound struct {
	// The list of pairings for the round
	Pairings []OpenClassicalPairing `dynamodbav:"pairings" json:"pairings"`
}

// OpenClassicalPairing represents a single pairing in the Open Classical tournaments,
// which are separate from the regular leaderboards.
type OpenClassicalPairing struct {
	// The Lichess username of the player with the white pieces
	White OpenClassicalPlayerSummary `dynamodbav:"white" json:"white"`

	// The player with the black pieces
	Black OpenClassicalPlayerSummary `dynamodbav:"black" json:"black"`

	// The result of the game
	Result string `dynamodbav:"result" json:"result"`
}

// OpenClassicalPlayerSummary represents the minimum information needed to schedule
// a game with a player in the Open Classical.
type OpenClassicalPlayerSummary struct {
	// The Lichess username of the player
	LichessUsername string `dynamodbav:"lichessUsername" json:"lichessUsername"`

	// The Discord username of the player
	DiscordUsername string `dynamodbav:"discordUsername" json:"discordUsername"`

	// The player's title, if they have one
	Title string `dynamodbav:"title" json:"title"`

	// The player's Lichess rating at the start of the Open Classical
	Rating int `dynamodbav:"rating" json:"rating"`
}

// OpenClassicalPlayer represents a player in the Open Classical tournaments, which
// are separate from the regular tournaments. As opposed to the OpenClassicalPlayerSummary,
// this type contains the player's full registration information.
type OpenClassicalPlayer struct {
	OpenClassicalPlayerSummary

	// The username of the player in the Dojo Scoreboard, if they are logged in
	Username string `dynamodbav:"username" json:"username"`

	// The email of the player
	Email string `dynamodbav:"email" json:"-"`

	// The region the player is in
	Region string `dynamodbav:"region" json:"region"`

	// The section the player is in
	Section string `dynamodbav:"section" json:"section"`

	// The player's bye requests
	ByeRequests []bool `dynamodbav:"byeRequests" json:"byeRequests"`
}

// SetOpenClassical inserts the provided OpenClassical into the database.
func (repo *dynamoRepository) SetOpenClassical(openClassical *OpenClassical) error {
	openClassical.Type = LeaderboardType_OpenClassical

	item, err := dynamodbattribute.MarshalMap(openClassical)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshall open classical", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(tournamentTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "Failed DynamoDB PutItem request", err)
}

// GetOpenClassical returns the open classical for the provided startsAt period.
func (repo *dynamoRepository) GetOpenClassical(startsAt string) (*OpenClassical, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {
				S: aws.String(string(LeaderboardType_OpenClassical)),
			},
			"startsAt": {
				S: aws.String(startsAt),
			},
		},
		TableName: aws.String(tournamentTable),
	}

	openClassical := OpenClassical{}
	err := repo.getItem(input, &openClassical)
	return &openClassical, err
}

// UpdateOpenClassicalRegistration adds the provided player to the given open classical. If the player
// already exists in a different section, they are removed.
func (repo *dynamoRepository) UpdateOpenClassicalRegistration(openClassical *OpenClassical, player *OpenClassicalPlayer) (*OpenClassical, error) {
	item, err := dynamodbattribute.MarshalMap(player)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal open classical player", err)
	}

	updateExpr := "REMOVE "
	exprAttrNames := map[string]*string{
		"#acceptingRegistrations": aws.String("acceptingRegistrations"),
		"#sections":               aws.String("sections"),
		"#players":                aws.String("players"),
		"#username":               aws.String(strings.ToLower(player.LichessUsername)),
	}

	for key, section := range openClassical.Sections {
		if section.Region != player.Region || section.Section != player.Section {
			sectionName := fmt.Sprintf("#%s", key)
			updateExpr += fmt.Sprintf("#sections.%s.#players.#username, ", sectionName)
			exprAttrNames[sectionName] = aws.String(key)
		}
	}
	updateExpr = updateExpr[0 : len(updateExpr)-2]

	sectionName := fmt.Sprintf("#%s_%s", player.Region, player.Section)
	updateExpr += fmt.Sprintf(" SET #sections.%s.#players.#username = :player", sectionName)
	exprAttrNames[sectionName] = aws.String(fmt.Sprintf("%s_%s", player.Region, player.Section))

	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {
				S: aws.String(string(openClassical.Type)),
			},
			"startsAt": {
				S: aws.String(openClassical.StartsAt),
			},
		},
		UpdateExpression:         aws.String(updateExpr),
		ConditionExpression:      aws.String("#acceptingRegistrations = :true"),
		ExpressionAttributeNames: exprAttrNames,
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":player": {M: item},
			":true":   {BOOL: aws.Bool(true)},
		},
		TableName:    aws.String(tournamentTable),
		ReturnValues: aws.String("ALL_NEW"),
	}

	result, err := repo.svc.UpdateItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(400, "Registration for this tournament has already closed", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}

	resultTnmt := OpenClassical{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &resultTnmt); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal UpdateItem result", err)
	}
	return &resultTnmt, nil
}

// ListPreviousOpenClassicals returns a list of OpenClassicals whose name is not CURRENT.
// The list is sorted in descending order by name.
func (repo *dynamoRepository) ListPreviousOpenClassicals(startKey string) ([]OpenClassical, string, error) {
	input := dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#type = :openClassical"),
		ExpressionAttributeNames: map[string]*string{
			"#type": aws.String("type"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":openClassical": {S: aws.String("OPEN_CLASSICAL")},
		},
		IndexName:        aws.String(tournamentTableOpenClassicalIndex),
		TableName:        aws.String(tournamentTable),
		ScanIndexForward: aws.Bool(false),
	}

	var openClassicals []OpenClassical
	lastKey, err := repo.query(&input, startKey, &openClassicals)
	if err != nil {
		return nil, "", err
	}
	return openClassicals, lastKey, nil
}
