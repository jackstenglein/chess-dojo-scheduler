package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

// Opening contains the full information needed to store an opening repertoire and lessons
// across all cohort ranges.
type Opening struct {
	// The primary key of the opening.
	Id string `dynamodbav:"id" json:"id"`

	// The name of the opening.
	Name string `dynamodbav:"name" json:"name"`

	// The list of levels associated with the opening (starter, expert, etc).
	Levels []*OpeningLevel `dynamodbav:"levels" json:"levels"`
}

// OpeningLevel contains the information needed to store an opening repertoire and lessons
// at a single cohort range.
type OpeningLevel struct {
	// The name of the opening level.
	Name string `dynamodbav:"name" json:"name"`

	// The cohorts the opening level applies to.
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohorts"`

	// A human-readable range of the cohorts the level applies to (Ex: 1200-1800).
	CohortRange string `dynamodbav:"cohortRange" json:"cohortRange"`

	// The list of modules within the opening level.
	Modules []*OpeningModule `dynamodbav:"modules" json:"modules"`
}

type OpeningModuleType string

const (
	Video             OpeningModuleType = "VIDEO"
	PgnViewer         OpeningModuleType = "PGN_VIEWER"
	SparringPositions OpeningModuleType = "SPARRING_POSITIONS"
	ModelGames        OpeningModuleType = "MODEL_GAMES"
	Themes            OpeningModuleType = "THEMES"
)

// OpeningModule is a single section within an opening.
type OpeningModule struct {
	// The name of the opening module.
	Name string `dynamodbav:"name" json:"name"`

	// The type of the opening module.
	Type OpeningModuleType `dynamodbav:"type" json:"type"`

	// The description of the opening module.
	Description string `dynamodbav:"description" json:"description"`

	// The URLs of embedded videos, if any exist. Generally used only if
	// type is Video.
	VideoUrls []string `dynamodbav:"videoUrls" json:"videoUrls"`

	// The PGN text of the module. Generally used only if type
	// is PgnViewer.
	Pgn string `dynamodbav:"pgn" json:"pgn"`

	// The positions of the module. Generally used only if type is
	// SparringPositions or Themes.
	Positions []*Position `dynamodbav:"positions" json:"positions"`

	// The games associated with the module. Generally only used if type
	// is ModelGames.
	Games []*Game `dynamodbav:"games" json:"games"`
}

type OpeningLister interface {
	// ListOpenings returns a list of openings in the database.
	ListOpenings(startKey string) ([]*Opening, string, error)
}

// ListOpenings returns a list of openings in the database.
func (repo *dynamoRepository) ListOpenings(startKey string) ([]*Opening, string, error) {
	input := &dynamodb.ScanInput{
		TableName: aws.String(openingTable),
	}
	var openings []*Opening
	lastKey, err := repo.scan(input, startKey, &openings)
	if err != nil {
		return nil, "", err
	}
	return openings, lastKey, nil
}
