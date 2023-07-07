package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

// Course contains the full information for an opening course. An opening course is
// defined as a series of related chapters designed for a specific cohort range.
type Course struct {
	// The primary key of the course.
	Id string `dynamodbav:"id" json:"id"`

	// The name of the course.
	Name string `dynamodbav:"name" json:"name"`

	// The color the opening course is designed for.
	Color string `dynamodbav:"color" json:"color"`

	// The cohorts the opening course is designed for.
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohort"`

	// The human-readable range of the cohorts the opening course is designed for.
	CohortRange string `dynamodbav:"cohortRange" json:"cohortRange"`

	// The list of chapters included in the opening course.
	Chapters []*Chapter `dynamodbav:"chapters" json:"chapters"`
}

// Chapter contains the information for a single opening chapter.
type Chapter struct {
	// The name of the chapter.
	Name string `dynamodbav:"name" json:"name"`

	// The FEN to display as the thumbnail of the chapter.
	ThumbnailFen string `dynamodbav:"thumbnailFen" json:"thumbnailFen"`

	// The board orientation of the thumbnail.
	ThumbnailOrientation string `dynamodbav:"thumbnailOrientation" json:"thumbnailOrientation"`

	// The list of modules within the chapter.
	Modules []*OpeningModule `dynamodbav:"modules" json:"modules"`
}

type OpeningModuleType string

const (
	Video             OpeningModuleType = "VIDEO"
	PgnViewer         OpeningModuleType = "PGN_VIEWER"
	SparringPositions OpeningModuleType = "SPARRING_POSITIONS"
	ModelGames        OpeningModuleType = "MODEL_GAMES"
	Exercises         OpeningModuleType = "EXERCISES"
)

type Coach string

const (
	Jesse  Coach = "JESSE"
	Kostya Coach = "KOSTYA"
	David  Coach = "DAVID"
)

// OpeningModule is a single activity within an opening chapter.
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

	// A list of PGN texts for the module. Generally used only if type is
	// PgnViewer, ModelGames or Exercises.
	Pgns []string `dynamodbav:"pgns" json:"pgns"`

	// The coach to use for Exercises
	Coach Coach `dynamodbav:"coach" json:"coach"`

	// The positions of the module. Generally used only if type is
	// SparringPositions.
	Positions []*Position `dynamodbav:"positions" json:"positions"`

	// The default board orientation for the module.
	BoardOrientation string `dynamodbav:"boardOrientation" json:"boardOrientation"`
}

type OpeningGetter interface {
	// GetCourse returns the opening course with the provided id.
	GetCourse(id string) (*Course, error)
}

// GetCourse returns the opening course with the provided id.
func (repo *dynamoRepository) GetCourse(id string) (*Course, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"id": {S: aws.String(id)},
		},
		TableName: aws.String(openingTable),
	}

	course := Course{}
	if err := repo.getItem(input, &course); err != nil {
		return nil, err
	}
	return &course, nil
}

type OpeningLister interface {
	// ListCourses returns a list of opening courses in the database.
	ListCourses(startKey string) ([]*Course, string, error)
}

// ListCourses returns a list of opening courses in the database.
func (repo *dynamoRepository) ListCourses(startKey string) ([]*Course, string, error) {
	input := &dynamodb.ScanInput{
		IndexName: aws.String("CourseIndex"),
		TableName: aws.String(openingTable),
	}
	var courses []*Course
	lastKey, err := repo.scan(input, startKey, &courses)
	if err != nil {
		return nil, "", err
	}
	return courses, lastKey, nil
}
