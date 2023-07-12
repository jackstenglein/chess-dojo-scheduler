package database

import (
	"math"
	"time"

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
	NonDojo     ScoreboardDisplay = "NON_DOJO"
)

func (s ScoreboardDisplay) IsValid() bool {
	return s == Hidden || s == Checkbox || s == ProgressBar || s == NonDojo
}

// CustomTask contains the fields for a user-entered NonDojo task.
type CustomTask struct {
	// Uniquely identifies a custom requirement.
	Id string `dynamodbav:"id" json:"id"`

	// The username of the owner of the custom task.
	Owner string `dynamodbav:"owner" json:"owner"`

	// The display name of the task
	Name string `dynamodbav:"name" json:"name"`

	// The description of the task
	Description string `dynamodbav:"description" json:"description"`

	// The total number of units in the task, by cohort
	// ALL_COHORTS is *not* a valid value.
	Counts map[DojoCohort]int `dynamodbav:"counts" json:"counts"`

	// Must be NonDojo
	ScoreboardDisplay ScoreboardDisplay `dynamodbav:"scoreboardDisplay" json:"scoreboardDisplay"`

	// Must be Non-Dojo
	Category string `dynamodbav:"category" json:"category"`

	// The time the task was most recently updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
}

// Position contains the field for a sparring position.
type Position struct {
	// An optional title associated with the position
	Title string `dynamodbav:"title" json:"title"`

	// The FEN of the position
	Fen string `dynamodbav:"fen" json:"fen"`

	// The time limit in seconds the position is meant to be played at
	LimitSeconds int `dynamodbav:"limitSeconds" json:"limitSeconds"`

	// The time increment in seconds the position is meant to be played at
	IncrementSeconds int `dynamodbav:"incrementSeconds" json:"incrementSeconds"`

	// The expected result of the position
	Result string `dynamodbav:"result" json:"result"`
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

	// The minimum starting value, applied to all cohorts. For example, the M2s start at 307
	StartCount int `dynamodbav:"startCount" json:"startCount"`

	// The number of cohorts the requirement must be completed in before completion
	// is "carried over" to new cohorts
	NumberOfCohorts int `dynamodbav:"numberOfCohorts" json:"numberOfCohorts"`

	// The score per unit. Applies to all cohorts unless overridden in UnitScoreOverride.
	UnitScore float32 `dynamodbav:"unitScore" json:"unitScore"`

	// The score per unit for each cohort. Overrides UnitScore if set for a particular cohort.
	// If not set for a cohort, UnitScore is used for that cohort.
	UnitScoreOverride map[DojoCohort]float32 `dynamodbav:"unitScoreOverride" json:"unitScoreOverride"`

	// The total score received after completing the requirement. Overrides UnitScore
	// and UnitScoreOverride if non-zero.
	TotalScore float32 `dynamodbav:"totalScore" json:"totalScore"`

	// The URLs of the videos describing the requirement, if any exist
	VideoUrls []string `dynamodbav:"videoUrls" json:"videoUrls"`

	// The positions included in the requirement, if any exist
	Positions []*Position `dynamodbav:"positions" json:"positions"`

	// How the requirement should be displayed on the scoreboard.
	ScoreboardDisplay ScoreboardDisplay `dynamodbav:"scoreboardDisplay" json:"scoreboardDisplay"`

	// Optional suffix to be displayed on progress bar label.
	ProgressBarSuffix string `dynamodbav:"progressBarSuffix" json:"progressBarSuffix"`

	// The time the requirement was most recently updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`

	// The priority in which to sort this requirement when displaying to the user
	SortPriority string `dynamodbav:"sortPriority" json:"sortPriority"`

	// The number of days after which completion of the requirement expires
	ExpirationDays int `dynamodbav:"expirationDays" json:"expirationDays"`
}

// CalculateScore returns the score for the given requirement based on the provided
// cohort and progress.
func (r *Requirement) CalculateScore(cohort DojoCohort, progress *RequirementProgress) float32 {
	if r == nil || progress == nil {
		return 0
	}
	if r.ScoreboardDisplay == NonDojo {
		return 0
	}
	if _, ok := r.Counts[cohort]; !ok {
		return 0
	}

	if r.ExpirationDays > 0 {
		expirationDate, err := time.Parse(time.RFC3339, progress.UpdatedAt)
		if err != nil {
			expirationDate.Add(time.Duration(r.ExpirationDays) * time.Hour * 24)
			if time.Now().After(expirationDate) {
				return 0
			}
		}
	}

	var count int
	if r.NumberOfCohorts == 1 || r.NumberOfCohorts == 0 {
		count, _ = progress.Counts[AllCohorts]
	} else if r.NumberOfCohorts > 1 && len(progress.Counts) >= r.NumberOfCohorts {
		for _, c := range progress.Counts {
			if c > count {
				count = c
			}
		}
	} else {
		count, _ = progress.Counts[cohort]
	}

	if r.TotalScore > 0 {
		if count >= r.Counts[cohort] {
			return r.TotalScore
		}
		return 0
	}

	unitScore := r.UnitScore
	if unitScoreOverride, ok := r.UnitScoreOverride[cohort]; ok {
		unitScore = unitScoreOverride
	}

	return float32(math.Max(float64(count-r.StartCount), 0)) * unitScore
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

type RequirementLister interface {
	// ListRequirements fetches a list of requirements matching the provided cohort. If scoreboardOnly is true, then
	// only requirements which should be displayed on the scoreboard will be returned. The next start key is returned
	// as well.
	ListRequirements(cohort DojoCohort, scoreboardOnly bool, startKey string) ([]*Requirement, string, error)

	// ScanRequirements fetches a list of requirements matching the provided cohort, if provided, and a list
	// of all requirements if not provided.
	ScanRequirements(cohort DojoCohort, startKey string) ([]*Requirement, string, error)
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
