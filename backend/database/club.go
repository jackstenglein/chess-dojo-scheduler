package database

import (
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type Club struct {
	// The ID of the club and the primary key of the table.
	Id string `dynamodbav:"id" json:"id"`

	// The user-facing name of the club
	Name string `dynamodbav:"name" json:"name"`

	// The full description of the club, which supports basic markdown
	Description string `dynamodbav:"description" json:"description"`

	// A short description of the club, which appears on the list page
	ShortDescription string `dynamodbav:"shortDescription,omitempty" json:"shortDescription"`

	// The username of the owner of the club
	Owner string `dynamodbav:"owner" json:"owner"`

	// The Stripe promo code associated with the club
	PromoCode string `dynamodbav:"promoCode,omitempty" json:"promoCode,omitempty"`

	// A link to the club's external webpage, if it has one
	ExternalUrl string `dynamodbav:"externalUrl,omitempty" json:"externalUrl"`

	// The physical location of the club, if it has one
	Location ClubLocation `dynamodbav:"location,omitempty" json:"location"`

	// The number of members in the club
	MemberCount int `dynamodbav:"memberCount" json:"memberCount"`

	// The members of the club, mapped by their usernames
	Members map[string]ClubMember `dynamodbav:"members" json:"members"`

	// Whether the club is unlisted
	Unlisted bool `dynamodbav:"unlisted" json:"unlisted"`

	// Whether the club requires approval to join
	ApprovalRequired bool `dynamodbav:"approvalRequired" json:"approvalRequired"`

	// The pending requests to join the club, mapped by their usernames
	JoinRequests map[string]ClubJoinRequest `dynamodbav:"joinRequests" json:"joinRequests"`

	// The date and time the club was created, in time.RFC3339 format
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`

	// The date and time the club info (not members) was last updated, in time.RFC3339 format
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
}

type ClubLocation struct {
	// The city the club is located in
	City string `dynamodbav:"city,omitempty" json:"city"`

	// The state the club is located in
	State string `dynamodbav:"state,omitempty" json:"state"`

	// The country the club is located in
	Country string `dynamodbav:"country,omitempty" json:"country"`
}

type ClubMember struct {
	// The username of the club member
	Username string `dynamodbav:"username" json:"username"`

	// The date and time the user joined the club, in time.RFC3339 format
	JoinedAt string `dynamodbav:"joinedAt" json:"joinedAt"`
}

type ClubJoinRequest struct {
	// The username of the person requesting to join
	Username string `dynamodbav:"username" json:"username"`

	// The display name of the person requesting to join
	DisplayName string `dynamodbav:"displayName" json:"displayName"`

	// The cohort of the person requesting to join
	Cohort string `dynamodbav:"cohort" json:"cohort"`

	// Optional notes left by the person requesting to join
	Notes string `dynamodbav:"notes" json:"notes"`

	// The date and time the join request was created, in time.RFC3339 format
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
}

type ClubUpdate struct {
	// The user-facing name of the club
	Name *string `dynamodbav:"name,omitempty" json:"name,omitempty"`

	// The description of the club
	Description *string `dynamodbav:"description,omitempty" json:"description,omitempty"`

	// A short description of the club, which appears on the list page
	ShortDescription *string `dynamodbav:"shortDescription,omitempty" json:"shortDescription,omitempty"`

	// A link to the club's external webpage, if it has one
	ExternalUrl *string `dynamodbav:"externalUrl,omitempty" json:"externalUrl,omitempty"`

	// The club's city, if it has a physical location
	City *string `dynamodbav:"city,omitempty" json:"city,omitempty"`

	// Whether the club requires approval to join
	ApprovalRequired *bool `dynamodbav:"approvalRequired,omitempty" json:"approvalRequired,omitempty"`

	// The date and time the club was updated, in time.RFC3339 format
	// Cannot be manually passed by the updater and is set automatically by the server
	UpdatedAt *string `dynamodbav:"updatedAt,omitempty" json:"-"`
}

// Creates the given club in the database. The club id must not already exist.
func (repo *dynamoRepository) CreateClub(club *Club) error {
	item, err := dynamodbattribute.MarshalMap(club)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal club", err)
	}

	// Hack to work around https://github.com/aws/aws-sdk-go/issues/682
	emptyMap := make(map[string]*dynamodb.AttributeValue)
	item["joinRequests"] = &dynamodb.AttributeValue{M: emptyMap}

	input := &dynamodb.PutItemInput{
		ConditionExpression: aws.String("attribute_not_exists(id)"),
		Item:                item,
		TableName:           aws.String(clubTable),
	}
	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}

// Applies the given update to the given club. The club after the update is returned.
func (repo *dynamoRepository) UpdateClub(id string, caller string, update *ClubUpdate) (*Club, error) {
	update.UpdatedAt = aws.String(time.Now().Format(time.RFC3339))

	av, err := dynamodbattribute.Marshal(update)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Unable to marshal club update", err)
	}

	builder := expression.UpdateBuilder{}
	for k, v := range av.M {
		builder = builder.Set(expression.Name(k), expression.Value(v))
	}

	expr, err := expression.NewBuilder().WithUpdate(builder).Build()
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "DynamoDB expression building error", err)
	}

	exprAttrNames := expr.Names()
	exprAttrNames["#owner"] = aws.String("owner")

	exprAttrValues := expr.Values()
	exprAttrValues[":caller"] = &dynamodb.AttributeValue{S: aws.String(caller)}

	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		ExpressionAttributeNames:  exprAttrNames,
		ExpressionAttributeValues: exprAttrValues,
		UpdateExpression:          expr.Update(),
		ConditionExpression:       aws.String("attribute_exists(id) AND #owner = :caller"),
		TableName:                 aws.String(clubTable),
		ReturnValues:              aws.String("ALL_NEW"),
	}
	club := &Club{}
	if err := repo.updateItem(input, club); err != nil {
		if _, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(404, "Invalid request: club not found", "DynamoDB conditional check failed", err)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}
	return club, nil
}

// Returns a list of clubs, excluding the promo code, members and join requests. The next start key is also returned.
func (repo *dynamoRepository) ListClubs(startKey string) ([]Club, string, error) {
	input := &dynamodb.ScanInput{
		FilterExpression:     aws.String("#unlisted <> :true"),
		ProjectionExpression: aws.String("id,#name,description,shortDescription,#owner,externalUrl,#location,memberCount,approvalRequired,createdAt,updatedAt"),
		ExpressionAttributeNames: map[string]*string{
			"#unlisted": aws.String("unlisted"),
			"#name":     aws.String("name"),
			"#owner":    aws.String("owner"),
			"#location": aws.String("location"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":true": {BOOL: aws.Bool(true)},
		},
		TableName: aws.String(clubTable),
	}

	var clubs []Club
	lastKey, err := repo.scan(input, startKey, &clubs)
	if err != nil {
		return nil, "", err
	}
	return clubs, lastKey, nil
}

// Returns the club with the given id.
func (repo *dynamoRepository) GetClub(id string) (*Club, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		TableName: aws.String(clubTable),
	}

	club := Club{}
	if err := repo.getItem(input, &club); err != nil {
		return nil, err
	}
	return &club, nil
}

// Adds the given username as a member of the given club. The club must have ApprovalRequired set to false.
// The club after updating is returned.
func (repo *dynamoRepository) JoinClub(id string, username string) (*Club, error) {
	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		ConditionExpression: aws.String("attribute_exists(id) AND #approvalRequired <> :true"),
		UpdateExpression:    aws.String("SET #members.#username = :member ADD #memberCount :q"),
		ExpressionAttributeNames: map[string]*string{
			"#approvalRequired": aws.String("approvalRequired"),
			"#members":          aws.String("members"),
			"#username":         aws.String(username),
			"#memberCount":      aws.String("memberCount"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":true": {BOOL: aws.Bool(true)},
			":member": {M: map[string]*dynamodb.AttributeValue{
				"username": {S: aws.String(username)},
				"joinedAt": {S: aws.String(time.Now().Format(time.RFC3339))},
			}},
			":q": {N: aws.String("1")},
		},
		TableName:    aws.String(clubTable),
		ReturnValues: aws.String("ALL_NEW"),
	}

	club := &Club{}
	if err := repo.updateItem(input, club); err != nil {
		if _, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(404, "Invalid request: club not found or requires approval to join", "DynamoDB conditional check failed", err)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}
	return club, nil
}

// Adds the given join request to the given club. The club after updating is returned.
func (repo *dynamoRepository) RequestToJoinClub(id string, request *ClubJoinRequest) (*Club, error) {
	request.CreatedAt = time.Now().Format(time.RFC3339)
	item, err := dynamodbattribute.MarshalMap(request)
	if err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to marshal join request", err)
	}

	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		UpdateExpression: aws.String("SET #requests.#username = :request"),
		ExpressionAttributeNames: map[string]*string{
			"#requests": aws.String("joinRequests"),
			"#username": aws.String(request.Username),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":request": {M: item},
		},
		TableName:    aws.String(clubTable),
		ReturnValues: aws.String("ALL_NEW"),
	}

	club := &Club{}
	if err := repo.updateItem(input, club); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to update club", err)
	}
	return club, nil
}

// Converts a join request with the given username into a member for the given club. The club
// after updating is returned.
func (repo *dynamoRepository) ApproveClubJoinRequest(id string, username string) (*Club, error) {
	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		ConditionExpression: aws.String("attribute_exists(id)"),
		UpdateExpression:    aws.String("REMOVE #requests.#username SET #members.#username = :member ADD #memberCount :q"),
		ExpressionAttributeNames: map[string]*string{
			"#requests":    aws.String("joinRequests"),
			"#username":    aws.String(username),
			"#members":     aws.String("members"),
			"#memberCount": aws.String("memberCount"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":q": {N: aws.String("1")},
			":member": {M: map[string]*dynamodb.AttributeValue{
				"username": {S: aws.String(username)},
				"joinedAt": {S: aws.String(time.Now().Format(time.RFC3339))},
			}},
		},
		TableName:    aws.String(clubTable),
		ReturnValues: aws.String("ALL_NEW"),
	}

	club := &Club{}
	if err := repo.updateItem(input, club); err != nil {
		if _, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(404, "Invalid request: club not found", "DynamoDB conditional check failed", err)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}
	return club, nil
}

// Deletes the join request with the given username from the given club. The club after updating is returned.
func (repo *dynamoRepository) DeleteClubJoinRequest(id string, username string) (*Club, error) {
	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		UpdateExpression: aws.String("REMOVE #requests.#username"),
		ExpressionAttributeNames: map[string]*string{
			"#requests": aws.String("joinRequests"),
			"#username": aws.String(username),
		},
		TableName:    aws.String(clubTable),
		ReturnValues: aws.String("ALL_NEW"),
	}

	club := &Club{}
	if err := repo.updateItem(input, club); err != nil {
		return nil, errors.Wrap(500, "Temporary server error", "Failed to update club", err)
	}
	return club, nil
}

// Removes the given username as a member from the given club. The user cannot be the owner of the club.
func (repo *dynamoRepository) RemoveClubMember(id string, username string) (*Club, error) {
	input := &dynamodb.UpdateItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		ConditionExpression: aws.String("attribute_exists(id) AND #owner <> :username"),
		UpdateExpression:    aws.String("REMOVE #members.#username ADD #memberCount :q"),
		ExpressionAttributeNames: map[string]*string{
			"#owner":       aws.String("owner"),
			"#members":     aws.String("members"),
			"#username":    aws.String(username),
			"#memberCount": aws.String("memberCount"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":username": {S: aws.String(username)},
			":q":        {N: aws.String("-1")},
		},
		TableName:    aws.String(clubTable),
		ReturnValues: aws.String("ALL_NEW"),
	}

	club := &Club{}
	if err := repo.updateItem(input, club); err != nil {
		if _, ok := err.(*dynamodb.ConditionalCheckFailedException); ok {
			return nil, errors.Wrap(404, "Invalid request: club not found or user cannot be removed", "DynamoDB conditional check failed", err)
		}
		return nil, errors.Wrap(500, "Temporary server error", "Failed DynamoDB UpdateItem", err)
	}
	return club, nil
}
