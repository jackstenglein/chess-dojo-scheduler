package database

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type PlayerColor string

const (
	White  PlayerColor = "white"
	Black              = "black"
	Either             = "either"
)

type byDate []*Game

func (s byDate) Len() int {
	return len(s)
}

func (s byDate) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func (s byDate) Less(i, j int) bool {
	// We return games in descending order,
	// so use > here
	return s[i].Date > s[j].Date
}

type Comment struct {
	// The Cognito username of the poster of the comment
	Owner string `dynamodbav:"owner" json:"owner"`

	// The discord username of the poster of the comment
	OwnerDiscord string `dynamodbav:"ownerDiscord" json:"ownerDiscord"`

	// The cohort of the poster of the comment
	OwnerCohort DojoCohort `dynamodbav:"ownerCohort" json:"ownerCohort"`

	// A v4 UUID identifying the comment
	Id string `dynamodbav:"id" json:"id"`

	// The time the comment was created
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`

	// The time the comment was updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`

	// The content of the comment
	Content string `dynamodbav:"content" json:"content"`
}

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
	Pgn string `dynamodbav:"pgn" json:"pgn,omitempty"`

	// The comments left on the game
	Comments []*Comment `dynamodbav:"comments" json:"comments"`
}

type GamePutter interface {
	UserGetter

	// PutGame inserts the provided game into the database.
	PutGame(game *Game) error

	// RecordGameCreation updates the given user to increase their game creation stats.
	RecordGameCreation(user *User) error
}

type GameGetter interface {
	// GetGame returns the Game object with the provided cohort and id.
	GetGame(cohort, id string) (*Game, error)
}

type GameLister interface {
	// ListGamesByCohort returns a list of Games matching the provided cohort. The PGN text is excluded and must be
	// fetched separately with a call to GetGame.
	ListGamesByCohort(cohort, startDate, endDate, startKey string) ([]*Game, string, error)

	// ListGamesByOwner returns a list of Games matching the provided owner. The PGN text is excluded and must be
	// fetched separately with a call to GetGame.
	ListGamesByOwner(owner, startDate, endDate, startKey string) ([]*Game, string, error)

	// ListGamesByPlayer returns a list of Games matching the provided player. The PGN text is excluded and must
	// be fetched separately with a call to GetGame.
	ListGamesByPlayer(player string, color PlayerColor, startDate, endDate, startKey string) ([]*Game, string, error)
}

type GameCommenter interface {
	// CreateComment appends the provided comment to the provided Game's comment list.
	CreateComment(cohort, id string, comment *Comment) (*Game, error)
}

// PutGame inserts the provided game into the database.
func (repo *dynamoRepository) PutGame(game *Game) error {
	item, err := dynamodbattribute.MarshalMap(game)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal game", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(gameTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// GetGame returns the game object with the provided cohort and id.
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

// fetchGames performs the provided DynamoDB query. The startKey is unmarshalled and set on the query.
func (repo *dynamoRepository) fetchGames(input *dynamodb.QueryInput, startKey string) ([]*Game, string, error) {
	if startKey != "" {
		var exclusiveStartKey map[string]*dynamodb.AttributeValue
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled", err)
		}
		input.SetExclusiveStartKey(exclusiveStartKey)
	}

	input.SetTableName(gameTable)
	result, err := repo.svc.Query(input)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "DynamoDB Query failure", err)
	}

	var games []*Game
	if err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &games); err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Failed to unmarshal fetchGames result", err)
	}

	var lastKey string
	if len(result.LastEvaluatedKey) > 0 {
		b, err := json.Marshal(result.LastEvaluatedKey)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal fetchGames LastEvaluatedKey", err)
		}
		lastKey = string(b)
	}

	return games, lastKey, nil
}

// addDates adds the provided start and end dates to the given key condition expression and expression attribute maps.
func addDates(keyConditionExpression string, expressionAttributeNames map[string]*string, expressionAttributeValues map[string]*dynamodb.AttributeValue, startDate, endDate string) string {
	if startDate != "" && endDate != "" {
		keyConditionExpression += " AND #id BETWEEN :startId AND :endId"
		expressionAttributeNames["#id"] = aws.String("id")
		expressionAttributeValues[":startId"] = &dynamodb.AttributeValue{
			S: aws.String(startDate + "_00000000-0000-0000-0000-000000000000"),
		}
		expressionAttributeValues[":endId"] = &dynamodb.AttributeValue{
			S: aws.String(endDate + "_ffffffff-ffff-ffff-ffff-ffffffffffff"),
		}
	} else if startDate != "" {
		keyConditionExpression += " AND #id >= :startId"
		expressionAttributeNames["#id"] = aws.String("id")
		expressionAttributeValues[":startId"] = &dynamodb.AttributeValue{
			S: aws.String(startDate + "_00000000-0000-0000-0000-000000000000"),
		}
	} else if endDate != "" {
		keyConditionExpression += " AND #id <= :endId"
		expressionAttributeNames["#id"] = aws.String("id")
		expressionAttributeValues[":endId"] = &dynamodb.AttributeValue{
			S: aws.String(endDate + "_ffffffff-ffff-ffff-ffff-ffffffffffff"),
		}
	}
	return keyConditionExpression
}

// ListGamesByCohort returns a list of Games matching the provided cohort. The PGN text is excluded and must be
// fetched separately with a call to GetGame.
func (repo *dynamoRepository) ListGamesByCohort(cohort, startDate, endDate, startKey string) ([]*Game, string, error) {
	keyConditionExpression := "#cohort = :cohort"
	expressionAttributeNames := map[string]*string{
		"#cohort":  aws.String("cohort"),
		"#id":      aws.String("id"),
		"#white":   aws.String("white"),
		"#black":   aws.String("black"),
		"#date":    aws.String("date"),
		"#owner":   aws.String("owner"),
		"#headers": aws.String("headers"),
	}
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":cohort": {
			S: aws.String(string(cohort)),
		},
	}

	keyConditionExpression = addDates(keyConditionExpression, expressionAttributeNames, expressionAttributeValues, startDate, endDate)

	input := &dynamodb.QueryInput{
		KeyConditionExpression:    aws.String(keyConditionExpression),
		ExpressionAttributeNames:  expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ProjectionExpression:      aws.String("#cohort,#id,#white,#black,#date,#owner,#headers"),
		ScanIndexForward:          aws.Bool(false),
		TableName:                 aws.String(gameTable),
	}

	return repo.fetchGames(input, startKey)
}

// ListGamesByOwner returns a list of Games matching the provided owner. The PGN text is excluded and must be
// fetched separately with a call to GetGame.
func (repo *dynamoRepository) ListGamesByOwner(owner, startDate, endDate, startKey string) ([]*Game, string, error) {
	keyConditionExpression := "#owner = :owner"
	expressionAttributeNames := map[string]*string{
		"#owner": aws.String("owner"),
	}
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":owner": {
			S: aws.String(owner),
		},
	}

	keyConditionExpression = addDates(keyConditionExpression, expressionAttributeNames, expressionAttributeValues, startDate, endDate)

	input := &dynamodb.QueryInput{
		KeyConditionExpression:    aws.String(keyConditionExpression),
		ExpressionAttributeNames:  expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ScanIndexForward:          aws.Bool(false),
		IndexName:                 aws.String("OwnerIndex"),
		TableName:                 aws.String(gameTable),
	}

	return repo.fetchGames(input, startKey)
}

type listGamesByPlayerStartKey struct {
	WhiteKey string `json:"whiteKey"`
	BlackKey string `json:"blackKey"`
}

// ListGamesByPlayer returns a list of Games matching the provided player. The PGN text is excluded and must
// be fetched separately with a call to GetGame.
func (repo *dynamoRepository) ListGamesByPlayer(player string, color PlayerColor, startDate, endDate, startKey string) ([]*Game, string, error) {
	player = strings.ToLower(player)

	startKeys := listGamesByPlayerStartKey{}
	if startKey != "" {
		if err := json.Unmarshal([]byte(startKey), &startKeys); err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled", err)
		}
	}

	lastKeys := listGamesByPlayerStartKey{}
	games := make([]*Game, 0)

	if (color == White || color == Either) && (startKey == "" || startKeys.WhiteKey != "") {
		whiteGames, whiteKey, err := repo.listColorGames(player, string(White), startDate, endDate, startKeys.WhiteKey)
		if err != nil {
			return nil, "", err
		}
		games = append(games, whiteGames...)
		lastKeys.WhiteKey = whiteKey
	}

	if (color == Black || color == Either) && (startKey == "" || startKeys.BlackKey != "") {
		blackGames, blackKey, err := repo.listColorGames(player, string(Black), startDate, endDate, startKeys.BlackKey)
		if err != nil {
			return nil, "", err
		}
		games = append(games, blackGames...)
		lastKeys.BlackKey = blackKey
	}

	var lastKey string
	if lastKeys.WhiteKey != "" || lastKeys.BlackKey != "" {
		b, err := json.Marshal(&lastKeys)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal listGamesByPlayerStartKey", err)
		}
		lastKey = string(b)
	}

	sort.Sort(byDate(games))

	return games, lastKey, nil
}

func (repo *dynamoRepository) listColorGames(player, color, startDate, endDate, startKey string) ([]*Game, string, error) {
	expressionAttrName := fmt.Sprintf("#%s", color)
	keyConditionExpression := fmt.Sprintf("%s = :player", expressionAttrName)
	expressionAttributeNames := map[string]*string{
		expressionAttrName: aws.String(color),
	}
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":player": {
			S: aws.String(player),
		},
	}

	keyConditionExpression = addDates(keyConditionExpression, expressionAttributeNames, expressionAttributeValues, startDate, endDate)

	indexName := strings.Title(color) + "Index"
	input := &dynamodb.QueryInput{
		KeyConditionExpression:    aws.String(keyConditionExpression),
		ExpressionAttributeNames:  expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ScanIndexForward:          aws.Bool(false),
		IndexName:                 aws.String(indexName),
		TableName:                 aws.String(gameTable),
	}

	return repo.fetchGames(input, startKey)
}

func (repo *dynamoRepository) CreateComment(cohort, id string, comment *Comment) (*Game, error) {
	item, err := dynamodbattribute.MarshalMap(comment)
	if err != nil {
		return nil, errors.Wrap(400, "Invalid request: comment cannot be marshaled", "", err)
	}

	input := &dynamodb.UpdateItemInput{
		ConditionExpression: aws.String("attribute_exists(cohort)"),
		Key: map[string]*dynamodb.AttributeValue{
			"cohort": {
				S: aws.String(cohort),
			},
			"id": {
				S: aws.String(id),
			},
		},
		UpdateExpression: aws.String("SET #c = list_append(#c, :c)"),
		ExpressionAttributeNames: map[string]*string{
			"#c": aws.String("comments"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":c": {
				L: []*dynamodb.AttributeValue{
					{M: item},
				},
			},
		},
		ReturnValues: aws.String("ALL_NEW"),
		TableName:    aws.String(gameTable),
	}

	result, err := repo.svc.UpdateItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(400, "Invalid request: game not found", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB GetItem failure", err)
	}

	game := Game{}
	if err = dynamodbattribute.UnmarshalMap(result.Attributes, &game); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal GetGame result", err)
	}
	return &game, nil
}
