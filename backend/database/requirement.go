package database

import (
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

type ScoreboardDisplay string

const (
	Unspecified ScoreboardDisplay = ""
	Hidden      ScoreboardDisplay = "HIDDEN"
	Checkbox    ScoreboardDisplay = "CHECKBOX"
	ProgressBar ScoreboardDisplay = "PROGRESS_BAR"
)

func (s ScoreboardDisplay) IsValid() bool {
	return s == Hidden || s == Checkbox || s == ProgressBar
}

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
	// ALL_COHORTS is *not* a valid value.
	Counts map[DojoCohort]int `dynamodbav:"counts" json:"counts"`

	// The number of cohorts the requirement must be completed in before completion
	// is "carried over" to new cohorts
	NumberOfCohorts int `dynamodbav:"numberOfCohorts" json:"numberOfCohorts"`

	// The score per unit
	UnitScore float32 `dynamodbav:"unitScore" json:"unitScore"`

	// The URLs of the videos describing the requirement, if any exist
	VideoUrls []string `dynamodbav:"videoUrls" json:"videoUrls"`

	// The positions included in the requirement, if any exist
	PositionUrls []string `dynamodbav:"positionUrls" json:"positionUrls"`

	// How the requirement should be displayed on the scoreboard.
	ScoreboardDisplay ScoreboardDisplay `dynamodbav:"scoreboardDisplay" json:"scoreboardDisplay"`

	// The time the requirement was most recently updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`

	// The priority in which to sort this requirement when displaying to the user
	SortPriority string `dynamodbav:"sortPriority" json:"sortPriority"`
}

// CalculateScore returns the score for the given requirement based on the provided
// cohort and progress.
func (r *Requirement) CalculateScore(cohort DojoCohort, progress *RequirementProgress) float32 {
	if r == nil || progress == nil {
		return 0
	}
	if _, ok := r.Counts[cohort]; !ok {
		return 0
	}
	if r.NumberOfCohorts == 1 || r.NumberOfCohorts == 0 {
		count, _ := progress.Counts[AllCohorts]
		return r.UnitScore * float32(count)
	}
	if r.NumberOfCohorts > 1 && len(progress.Counts) >= r.NumberOfCohorts {
		var maxCount int = 0
		for _, count := range progress.Counts {
			if count > maxCount {
				maxCount = count
			}
		}
		return r.UnitScore * float32(maxCount)
	}
	count, _ := progress.Counts[cohort]
	return r.UnitScore * float32(count)
}

type RequirementProgress struct {
	// The id of the requirement that the progress applies to
	RequirementId string `dynamodbav:"requirementId" json:"requirementId"`

	// The current number of units completed in the requirement, by cohort.
	// ALL_COHORTS *is* a valid value.
	Counts map[DojoCohort]int `dynamodbav:"counts" json:"counts"`

	// The number of minutes spent working on the requirement, by cohort.
	// ALL_COHORTS is *not* a valid value.
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

	// The time the user most recently graduated
	LastGraduatedAt string `dynamodbav:"lastGraduatedAt" json:"lastGraduatedAt"`
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

type RequirementSetter interface {
	UserGetter

	// SetRequirement saves the provided requirement in the database.
	SetRequirement(requirement *Requirement) error
}

type RequirementScanner interface {
	UserGetter

	// ScanRequirements fetches a list of requirements matching the provided cohort, if provided, and a list
	// of all requirements if not provided.
	ScanRequirements(cohort DojoCohort, startKey string) ([]*Requirement, string, error)
}

// fetchScoreboardRequirements returns a list of requirements matching the provided cohort that should be displayed
// on the scoreboard. The next startKey is returned as well.
func (repo *dynamoRepository) fetchScoreboardRequirements(cohort DojoCohort, startKey string) ([]*Requirement, string, error) {
	// We use a query here since only the ACTIVE requirements should be displayed on the scoreboard.
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#status = :active"),
		ExpressionAttributeNames: map[string]*string{
			"#status":  aws.String("status"),
			"#display": aws.String("scoreboardDisplay"),
			"#counts":  aws.String("counts"),
			"#cohort":  aws.String(string(cohort)),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":active": {S: aws.String(string(Active))},
			":hidden": {S: aws.String(string(Hidden))},
		},
		FilterExpression: aws.String("#display <> :hidden AND attribute_exists(#counts.#cohort)"),
		TableName:        aws.String(requirementTable),
	}

	var requirements []*Requirement
	lastKey, err := repo.query(input, startKey, &requirements)
	if err != nil {
		return nil, "", err
	}
	return requirements, lastKey, nil
}

// ScanRequirements returns a list of requirements matching the provided cohort. Archived requirements and requirements
// hidden from the scoreboard are returned.
func (repo *dynamoRepository) ScanRequirements(cohort DojoCohort, startKey string) ([]*Requirement, string, error) {
	input := &dynamodb.ScanInput{
		TableName: aws.String(requirementTable),
	}

	if cohort != "" {
		input.SetExpressionAttributeNames(map[string]*string{
			"#counts": aws.String("counts"),
			"#cohort": aws.String(string(cohort)),
		})
		input.SetFilterExpression("attribute_exists(#counts.#cohort)")
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
	return repo.ScanRequirements(cohort, startKey)
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

// SetRequirement saves the provided requirement in the database.
func (repo *dynamoRepository) SetRequirement(requirement *Requirement) error {
	item, err := dynamodbattribute.MarshalMap(requirement)
	if err != nil {
		return errors.Wrap(500, "Temporary server error", "Unable to marshal requirement", err)
	}

	input := &dynamodb.PutItemInput{
		Item:      item,
		TableName: aws.String(requirementTable),
	}

	_, err = repo.svc.PutItem(input)
	return errors.Wrap(500, "Temporary server error", "DynamoDB PutItem failure", err)
}
