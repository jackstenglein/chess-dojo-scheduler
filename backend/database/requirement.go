package database

import (
	"encoding/json"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
)

type RequirementStatus string

const (
	Active   RequirementStatus = "ACTIVE"
	Archived RequirementStatus = "ARCHIVED"
)

type Requirement struct {
	// Uniquely identifies a requirement. The sort key for the table.
	Id string `dynamodbav:"id" json:"id"`

	// Identifies whether the requirement is active or not. The partition key for the table.
	Status RequirementStatus `dynamodbav:"status" json:"status"`

	// The category that the requirement is in (Ex: Tactics)
	Category string `dynamodbav:"category" json:"category"`

	// The display name of the requirement
	Name string `dynamodbav:"name" json:"name"`

	// The description of the requirement
	Description string `dynamodbav:"description" json:"description"`

	// The total number of units in the requirement, by cohort
	Counts map[DojoCohort]int `dynamodbav:"counts" json:"counts"`

	// The score per unit
	UnitScore float32 `dynamodbav:"unitScore" json:"unitScore"`

	// The URLs of the videos describing the requirement, if any exist
	VideoUrls []string `dynamodbav:"videoUrls" json:"videoUrls"`

	// The positions included in the requirement, if any exist
	Positions []string `dynamodbav:"positions" json:"positions"`

	// If true, hide the requirement from the scoreboard
	HideFromScoreboard bool `dynamodbav:"hideFromScoreboard" json:"hideFromScoreboard"`

	// The time the requirement was most recently updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`

	// The priority in which to sort this requirement when displaying to the user
	SortPriority string `dynamodbav:"sortPriority" json:"sortPriority"`

	// True if the requirement resets when switching cohorts and false if
	// the requirement carries over across cohorts.
	Repeatable bool `dynamodbav:"repeatable" json:"repeatable"`
}

type RequirementProgress struct {
	// The id of the requirement that the progress applies to
	RequirementId string `dynamodbav:"requirementId" json:"requirementId"`

	// The display name of the requirement that the progress applies to
	RequirementName string `dynamodbav:"requirementName" json:"requirementName"`

	// The current number of units completed in the requirement, by cohort
	// If the requirement is not repeatable, then there is only one item
	// for ALL_COHORTS.
	Counts map[DojoCohort]int `dynamodbav:"counts" json:"counts"`

	// The number of minutes spent working on the requirement, by cohort
	MinutesSpent map[DojoCohort]int `dynamodbav:"minutesSpent" json:"minutesSpent"`

	// The time the requirement was most recently updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
}

type Graduation struct {
	// The Cognito username of the graduating user
	Username string `dynamodbav:"username"`

	// The Discord username of the graduating user
	DiscordUsername string `dynamodbav:"discordUsername"`

	// The cohort the user is graduating from
	PreviousCohort DojoCohort `dynamodbav:"previousCohort" json:"previousCohort"`

	// The cohort the user is entering
	NewCohort DojoCohort `dynamodbav:"newCohort" json:"newCohort"`

	// The user's cohort score at the time of graduation
	Score int `dynamodbav:"score" json:"score"`

	// The rating the user started with
	StartRating int `dynamodbav:"startRating" json:"startRating"`

	// The user's rating at the time of graduation
	CurrentRating int `dynamodbav:"currentRating" json:"currentRating"`

	// The user's comments on graduating
	Comments string `dynamodbav:"comments" json:"comments"`

	// The time the user started the cohort
	StartedAt string `dynamodbav:"startedAt" json:"startedAt"`

	// The time that the user graduated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
}

type RequirementLister interface {
	// ListRequirements fetches a list of requirements matching the provided cohort. If scoreboardOnly is true, then
	// only requirements which should be displayed on the scoreboard will be returned. The next start key is returned
	// as well.
	ListRequirements(cohort DojoCohort, scoreboardOnly bool, startKey string) ([]*Requirement, string, error)
}

// fetchScoreboardRequirements returns a list of requirements matching the provided cohort that should be displayed
// on the scoreboard. The next startKey is returned as well.
func (repo *dynamoRepository) fetchScoreboardRequirements(cohort DojoCohort, startKey string) ([]*Requirement, string, error) {
	// We use a query here since only the ACTIVE requirements should be displayed on the scoreboard.
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#status = :active"),
		ExpressionAttributeNames: map[string]*string{
			"#status":     aws.String("status"),
			"#hide":       aws.String("hideFromScoreboard"),
			"#counts":     aws.String("counts"),
			"#cohort":     aws.String(string(cohort)),
			"#allcohorts": aws.String("ALL_COHORTS"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":active": {S: aws.String(string(Active))},
			":hide":   {BOOL: aws.Bool(true)},
		},
		FilterExpression: aws.String("#hide <> :hide AND (attribute_exists(#counts.#cohort) OR attribute_exists(#counts.#allcohorts))"),
		TableName:        aws.String(requirementTable),
	}

	if startKey != "" {
		var exclusiveStartKey map[string]*dynamodb.AttributeValue
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled", err)
		}
		input.SetExclusiveStartKey(exclusiveStartKey)
	}

	result, err := repo.svc.Query(input)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "DynamoDB query failure", err)
	}

	var requirements []*Requirement
	if err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &requirements); err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Failed to unmarshal Query result", err)
	}

	var lastKey string
	if len(result.LastEvaluatedKey) > 0 {
		b, err := json.Marshal(result.LastEvaluatedKey)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal fetchScoreboardRequirements LastEvaluatedKey", err)
		}
		lastKey = string(b)
	}

	return requirements, lastKey, nil
}

// scanRequirements returns a list of requirements matching the provided cohort. Archived requirements and requirements
// hidden from the scoreboard are returned.
func (repo *dynamoRepository) scanRequirements(cohort DojoCohort, startKey string) ([]*Requirement, string, error) {
	input := &dynamodb.ScanInput{
		ExpressionAttributeNames: map[string]*string{
			"#counts":     aws.String("counts"),
			"#cohort":     aws.String(string(cohort)),
			"#allcohorts": aws.String("ALL_COHORTS"),
		},
		FilterExpression: aws.String("attribute_exists(#counts.#cohort) OR attribute_exists(#counts.#allcohorts)"),
		TableName:        aws.String(requirementTable),
	}

	if startKey != "" {
		var exclusiveStartKey map[string]*dynamodb.AttributeValue
		err := json.Unmarshal([]byte(startKey), &exclusiveStartKey)
		if err != nil {
			return nil, "", errors.Wrap(400, "Invalid request: startKey is not valid", "startKey could not be unmarshaled", err)
		}
		input.SetExclusiveStartKey(exclusiveStartKey)
	}

	result, err := repo.svc.Scan(input)
	if err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "DynamoDB scan failure", err)
	}

	var requirements []*Requirement
	if err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &requirements); err != nil {
		return nil, "", errors.Wrap(500, "Temporary server error", "Failed to unmarshal Scan result", err)
	}

	var lastKey string
	if len(result.LastEvaluatedKey) > 0 {
		b, err := json.Marshal(result.LastEvaluatedKey)
		if err != nil {
			return nil, "", errors.Wrap(500, "Temporary server error", "Failed to marshal scanRequirements LastEvaluatedKey", err)
		}
		lastKey = string(b)
	}

	return requirements, lastKey, nil
}

// ListRequirements fetches a list of requirements matching the provided cohort. If scoreboardOnly is true, then
// only requirements which should be displayed on the scoreboard will be returned. The next start key is returned
// as well.
func (repo *dynamoRepository) ListRequirements(cohort DojoCohort, scoreboardOnly bool, startKey string) ([]*Requirement, string, error) {
	if scoreboardOnly {
		return repo.fetchScoreboardRequirements(cohort, startKey)
	}
	return repo.scanRequirements(cohort, startKey)
}
