package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

type RequirementStatus string

const (
	Active   RequirementStatus = "ACTIVE"
	Archived RequirementStatus = "ARCHIVED"
)

type ScoreboardDisplay string

const (
	Unspecified ScoreboardDisplay = ""
	Hidden      ScoreboardDisplay = "HIDDEN"
	Checkbox    ScoreboardDisplay = "CHECKBOX"
	ProgressBar ScoreboardDisplay = "PROGRESS_BAR"
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

	// How the requirement should be displayed on the scoreboard.
	ScoreboardDisplay ScoreboardDisplay `dynamodbav:"scoreboardDisplay" json:"scoreboardDisplay"`

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

	// The current number of units completed in the requirement, by cohort.
	Counts map[DojoCohort]int `dynamodbav:"counts" json:"counts"`

	// The number of minutes spent working on the requirement, by cohort
	MinutesSpent map[DojoCohort]int `dynamodbav:"minutesSpent" json:"minutesSpent"`

	// The time the requirement was most recently updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
}

type TimelineEntry struct {
	// The id of the requirement that the timeline entry applies to
	RequirementId string `dynamodbav:"requirementId" json:"requirementId"`

	// The name of the requirement that the timeline entry applies to
	RequirementName string `dynamodbav:"requirementName" json:"requirementName"`

	// The category of the requirement that the timeline entry applies to
	RequirementCategory string `dynamodbav:"requirementCategory" json:"requirementCategory"`

	// How the requirement should be displayed on the scoreboard.
	ScoreboardDisplay ScoreboardDisplay `dynamodbav:"scoreboardDisplay" json:"scoreboardDisplay"`

	// The cohort the timeline entry applies to
	Cohort DojoCohort `dynamodbav:"cohort" json:"cohort"`

	// The total value of the requirement
	TotalCount int `dynamodbav:"totalCount" json:"totalCount"`

	// The value of the user's progress prior to the timeline entry
	PreviousCount int `dynamodbav:"previousCount" json:"previousCount"`

	// The value of the user's progress after the timeline entry
	NewCount int `dynamodbav:"newCount" json:"newCount"`

	// The number of minutes spent on the timeline entry
	MinutesSpent int `dynamodbav:"minutesSpent" json:"minutesSpent"`

	// The time the timeline entry was created
	CreatedAt string `dynamodbav:"createdAt" json:"createdAt"`
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

type RequirementGetter interface {
	// GetRequirement returns the requirement with the provided id.
	GetRequirement(id string) (*Requirement, error)
}

// fetchScoreboardRequirements returns a list of requirements matching the provided cohort that should be displayed
// on the scoreboard. The next startKey is returned as well.
func (repo *dynamoRepository) fetchScoreboardRequirements(cohort DojoCohort, startKey string) ([]*Requirement, string, error) {
	// We use a query here since only the ACTIVE requirements should be displayed on the scoreboard.
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#status = :active"),
		ExpressionAttributeNames: map[string]*string{
			"#status":     aws.String("status"),
			"#display":    aws.String("scoreboardDisplay"),
			"#counts":     aws.String("counts"),
			"#cohort":     aws.String(string(cohort)),
			"#allcohorts": aws.String("ALL_COHORTS"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":active": {S: aws.String(string(Active))},
			":hidden": {S: aws.String(string(Hidden))},
		},
		FilterExpression: aws.String("#display <> :hidden AND (attribute_exists(#counts.#cohort) OR attribute_exists(#counts.#allcohorts))"),
		TableName:        aws.String(requirementTable),
	}

	var requirements []*Requirement
	lastKey, err := repo.query(input, startKey, &requirements)
	if err != nil {
		return nil, "", err
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

	var requirements []*Requirement
	lastKey, err := repo.scan(input, startKey, &requirements)
	if err != nil {
		return nil, "", err
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

// GetRequirement returns the requirement with the provided id.
func (repo *dynamoRepository) GetRequirement(id string) (*Requirement, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"status": {
				S: aws.String(string(Active)),
			},
			"id": {
				S: aws.String(id),
			},
		},
		TableName: aws.String(requirementTable),
	}

	requirement := Requirement{}
	if err := repo.getItem(input, &requirement); err != nil {
		return nil, err
	}
	return &requirement, nil
}
