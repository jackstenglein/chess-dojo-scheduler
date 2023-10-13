package database

import (
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
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

	// The display name of the poster of the comment
	OwnerDisplayName string `dynamodbav:"ownerDisplayName" json:"ownerDisplayName"`

	// The cohort of the poster of the comment
	OwnerCohort DojoCohort `dynamodbav:"ownerCohort" json:"ownerCohort"`

	// The cohort the owner most recently graduated from
	OwnerPreviousCohort DojoCohort `dynamodbav:"ownerPreviousCohort" json:"ownerPreviousCohort"`

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

	// The sort key of the game, in the form of date_uuid for newer games. Note that
	// the date value is taken from the createdAt value, but has dashes replaced with periods
	// to match the PGN specification.
	Id string `dynamodbav:"id" json:"id"`

	// The player with the white pieces
	White string `dynamodbav:"white" json:"white"`

	// The player with the black pieces
	Black string `dynamodbav:"black" json:"black"`

	// The date that the game was played, in the form 2023.01.02
	// We use periods instead of dashes to match the PGN specification.
	Date string `dynamodbav:"date" json:"date"`

	// The date and time the game was created. This is in the time.RFC3339 format.
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`

	// The username of the owner of this game
	Owner string `dynamodbav:"owner" json:"owner"`

	// The display name of the owner of this game
	OwnerDisplayName string `dynamodbav:"ownerDisplayName" json:"ownerDisplayName"`

	// The cohort the owner most recently graduated from
	OwnerPreviousCohort DojoCohort `dynamodbav:"ownerPreviousCohort" json:"ownerPreviousCohort"`

	// The PGN headers of the game
	Headers map[string]string `dynamodbav:"headers" json:"headers"`

	// Whether the game has been featured by the sensei
	IsFeatured string `dynamodbav:"isFeatured" json:"isFeatured"`

	// The date the game was marked as featured
	FeaturedAt string `dynamodbav:"featuredAt" json:"featuredAt"`

	// The PGN text of the game
	Pgn string `dynamodbav:"pgn" json:"pgn,omitempty"`

	// The comments left on the game
	Comments []*Comment `dynamodbav:"comments" json:"comments"`

	// The default board orientation for the game
	Orientation string `dynamodbav:"orientation" json:"orientation,omitempty"`
}

type GameUpdate struct {
	// The player with the white pieces
	White *string `dynamodbav:"white,omitempty" json:"white"`

	// The player with the black pieces
	Black *string `dynamodbav:"black,omitempty" json:"black"`

	// The PGN headers of the game
	Headers map[string]string `dynamodbav:"headers,omitempty" json:"headers"`

	// The PGN text of the game
	Pgn *string `dynamodbav:"pgn,omitempty" json:"pgn,omitempty"`

	// Whether the game has been featured by the sensei
	IsFeatured *string `dynamodbav:"isFeatured,omitempty" json:"isFeatured"`

	// The date the game was marked as featured
	FeaturedAt *string `dynamodbav:"featuredAt,omitempty" json:"featuredAt"`

	// The default board orientation for the game
	Orientation *string `dynamodbav:"orientation,omitempty" json:"orientation"`
}

type GamePutter interface {
	UserGetter
	TimelinePutter

	// BatchPutGames inserts the provided list of games into the database.
	BatchPutGames(games []*Game) (int, error)

	// RecordGameCreation updates the given user to increase their game creation stats.
	RecordGameCreation(user *User, amount int) error
}

type GameUpdater interface {
	UserGetter

	// UpdateGame applies the specified update to the specified game.
	UpdateGame(cohort, id, owner string, update *GameUpdate) (*Game, error)
}

type GameDeleter interface {
	// DeleteGame removes the specified game from the database, if the game
	// is owned by the calling user.
	DeleteGame(username, cohort, id string) (*Game, error)
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

	// ListFeaturedGames returns a list of Games featured more recently than the provided date.
	ListFeaturedGames(date, startKey string) ([]*Game, string, error)

	// ListGamesByEco returns a list of Games matching the provided ECO. The PGN text is excluded and must be
	// fetched separately with a call to GetGame.
	ListGamesByEco(eco, startDate, endDate, startKey string) ([]*Game, string, error)

	// ScanGames returns a list of all Games in the database.
	ScanGames(startKey string) ([]*Game, string, error)
}

type GameCommenter interface {
	// CreateComment appends the provided comment to the provided Game's comment list.
	CreateComment(cohort, id string, comment *Comment) (*Game, error)

	NotificationPutter
}

// BatchPutGames inserts the provided list of games into the database. The number of successfully
// updated games is returned.
func (repo *dynamoRepository) BatchPutGames(games []*Game) (int, error) {
	var writeRequests []*dynamodb.WriteRequest
	updated := 0
	for _, g := range games {
		item, err := dynamodbattribute.MarshalMap(g)
		if err != nil {
			return updated, errors.Wrap(500, "Temporary server error", "Failed to marshal game", err)
		}

		// Hack to work around https://github.com/aws/aws-sdk-go/issues/682
		if len(g.Comments) == 0 {
			emptyList := make([]*dynamodb.AttributeValue, 0)
			item["comments"] = &dynamodb.AttributeValue{L: emptyList}
		}

		req := &dynamodb.WriteRequest{
			PutRequest: &dynamodb.PutRequest{
				Item: item,
			},
		}
		writeRequests = append(writeRequests, req)

		if len(writeRequests) == 25 {
			if err := repo.sendBatchPutGames(writeRequests); err != nil {
				return updated, err
			}
			updated += 25
			writeRequests = nil
		}
	}

	if len(writeRequests) > 0 {
		if err := repo.sendBatchPutGames(writeRequests); err != nil {
			return updated, err
		}
		updated += len(writeRequests)
	}
	return updated, nil
}

func (repo *dynamoRepository) sendBatchPutGames(writeRequests []*dynamodb.WriteRequest) error {
	input := &dynamodb.BatchWriteItemInput{
		RequestItems: map[string][]*dynamodb.WriteRequest{
			gameTable: writeRequests,
		},
		ReturnConsumedCapacity: aws.String("NONE"),
	}

	output, err := repo.svc.BatchWriteItem(input)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Failed DynamoDB BatchWriteItem", err)
	}
	if len(output.UnprocessedItems) > 0 {
		return errors.New(500, "Temporary server error", "DynamoDB BatchWriteItem failed to process")
	}
	return nil
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

	game := Game{}
	if err := repo.getItem(input, &game); err != nil {
		return nil, err
	}
	return &game, nil
}

// UpdateGame applies the specified update to the specified game.
func (repo *dynamoRepository) UpdateGame(cohort, id, owner string, update *GameUpdate) (*Game, error) {
	av, err := dynamodbattribute.MarshalMap(update)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal user update", err)
	}

	builder := expression.UpdateBuilder{}
	for k, v := range av {
		builder = builder.Set(expression.Name(k), expression.Value(v))
	}

	expr, err := expression.NewBuilder().WithUpdate(builder).Build()
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB expression building error", err)
	}

	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"cohort": {
				S: aws.String(cohort),
			},
			"id": {
				S: aws.String(id),
			},
		},
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		UpdateExpression:          expr.Update(),
		ConditionExpression:       aws.String("attribute_exists(id)"),
		TableName:                 aws.String(gameTable),
		ReturnValues:              aws.String("ALL_NEW"),
	}

	if owner != "" {
		input.SetConditionExpression("attribute_exists(id) AND #owner = :owner")
		input.ExpressionAttributeNames["#owner"] = aws.String("owner")
		input.ExpressionAttributeValues[":owner"] = &dynamodb.AttributeValue{S: aws.String(owner)}
	}

	result, err := repo.svc.UpdateItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(400, "Invalid request: game not found or you do not have permission to update it", "DynamoDB conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB UpdateItem failure", err)
	}

	game := Game{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &game); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal UpdateItem result", err)
	}
	return &game, nil
}

// DeleteGame removes the specified game from the database, if the game
// is owned by the calling user.
func (repo *dynamoRepository) DeleteGame(username, cohort, id string) (*Game, error) {
	input := &dynamodb.DeleteItemInput{
		ConditionExpression: aws.String("#owner = :owner"),
		ExpressionAttributeNames: map[string]*string{
			"#owner": aws.String("owner"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":owner": {S: aws.String(username)},
		},
		Key: map[string]*dynamodb.AttributeValue{
			"cohort": {S: aws.String(cohort)},
			"id":     {S: aws.String(id)},
		},
		ReturnValues: aws.String("ALL_OLD"),
		TableName:    aws.String(gameTable),
	}

	result, err := repo.svc.DeleteItem(input)
	if err != nil {
		if aerr, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(400, "Invalid request: game does not exist or you do not have permission to delete it", "Dynamo conditional check failed", aerr)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed Dynamo DeleteItem call", err)
	}

	game := Game{}
	if err := dynamodbattribute.UnmarshalMap(result.Attributes, &game); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal DeleteItem result", err)
	}
	return &game, nil
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
		"#cohort":           aws.String("cohort"),
		"#id":               aws.String("id"),
		"#white":            aws.String("white"),
		"#black":            aws.String("black"),
		"#date":             aws.String("date"),
		"#owner":            aws.String("owner"),
		"#ownerDisplayName": aws.String("ownerDisplayName"),
		"#headers":          aws.String("headers"),
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
		ProjectionExpression:      aws.String("#cohort,#id,#white,#black,#date,#owner,#ownerDisplayName,#headers"),
		ScanIndexForward:          aws.Bool(false),
		TableName:                 aws.String(gameTable),
	}

	var games []*Game
	lastKey, err := repo.query(input, startKey, &games)
	if err != nil {
		return nil, "", err
	}
	return games, lastKey, nil
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

	var games []*Game
	lastKey, err := repo.query(input, startKey, &games)
	if err != nil {
		return nil, "", err
	}
	return games, lastKey, nil
}

type listGamesByPlayerStartKey struct {
	WhiteKey string `json:"whiteKey"`
	BlackKey string `json:"blackKey"`
}

// ListGamesByPlayer returns a list of Games matching the provided player. The PGN text is excluded and must
// be fetched separately with a call to GetGame.
func (repo *dynamoRepository) ListGamesByPlayer(player string, color PlayerColor, startDate, endDate, startKey string) ([]*Game, string, error) {
	player = strings.ToLower(strings.TrimSpace(player))

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
			S: aws.String(strings.ToLower(player)),
		},
	}

	keyConditionExpression = addDates(keyConditionExpression, expressionAttributeNames, expressionAttributeValues, startDate, endDate)

	indexName := strings.Title(color) + "Idx"
	input := &dynamodb.QueryInput{
		KeyConditionExpression:    aws.String(keyConditionExpression),
		ExpressionAttributeNames:  expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		ScanIndexForward:          aws.Bool(false),
		IndexName:                 aws.String(indexName),
		TableName:                 aws.String(gameTable),
	}

	var games []*Game
	lastKey, err := repo.query(input, startKey, &games)
	if err != nil {
		return nil, "", err
	}
	return games, lastKey, nil
}

// ListFeaturedGames returns a list of Games featured more recently than the provided date.
func (repo *dynamoRepository) ListFeaturedGames(date, startKey string) ([]*Game, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#f = :true AND #d >= :d"),
		ExpressionAttributeNames: map[string]*string{
			"#f": aws.String("isFeatured"),
			"#d": aws.String("featuredAt"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":true": {S: aws.String("true")},
			":d":    {S: aws.String(date)},
		},
		IndexName: aws.String("FeaturedIdx"),
		TableName: aws.String(gameTable),
	}

	var games []*Game
	lastKey, err := repo.query(input, startKey, &games)
	if err != nil {
		return nil, "", err
	}
	return games, lastKey, nil
}

// ListGamesByEco returns a list of Games matching the provided ECO. The PGN text is excluded and must be
// fetched separately with a call to GetGame.
func (repo *dynamoRepository) ListGamesByEco(eco, startDate, endDate, startKey string) ([]*Game, string, error) {
	filterExpression := "#h.#eco = :eco"
	expressionAttributeNames := map[string]*string{
		"#h":   aws.String("headers"),
		"#eco": aws.String("ECO"),
	}
	expressionAttributeValues := map[string]*dynamodb.AttributeValue{
		":eco": {
			S: aws.String(eco),
		},
	}

	filterExpression = addDates(filterExpression, expressionAttributeNames, expressionAttributeValues, startDate, endDate)

	input := &dynamodb.ScanInput{
		FilterExpression:          aws.String(filterExpression),
		ExpressionAttributeNames:  expressionAttributeNames,
		ExpressionAttributeValues: expressionAttributeValues,
		IndexName:                 aws.String("OwnerIndex"),
		TableName:                 aws.String(gameTable),
	}

	var games []*Game
	lastKey, err := repo.scan(input, startKey, &games)
	if err != nil {
		return nil, "", err
	}
	return games, lastKey, nil
}

// ScanGames returns a list of all Games in the database.
func (repo *dynamoRepository) ScanGames(startKey string) ([]*Game, string, error) {
	input := &dynamodb.ScanInput{
		TableName: aws.String(gameTable),
	}

	var games []*Game
	lastKey, err := repo.scan(input, startKey, &games)
	if err != nil {
		return nil, "", err
	}
	return games, lastKey, nil
}

// CreateComment appends the provided comment to the provided Game's comment list.
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
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB UpdateItem failure", err)
	}

	game := Game{}
	if err = dynamodbattribute.UnmarshalMap(result.Attributes, &game); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to unmarshal CreateComment result", err)
	}
	return &game, nil
}
