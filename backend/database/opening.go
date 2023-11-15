package database

import (
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
)

type CourseType string

const (
	Opening CourseType = "OPENING"
	Other   CourseType = "OTHER"
)

// Course contains the full information for a course. A course is
// defined as a series of related chapters designed for a specific cohort range.
type Course struct {
	// The type of the course and the hash key of the table.
	Type CourseType `dynamodbav:"type" json:"type"`

	// The id of the course and the range key of the table.
	Id string `dynamodbav:"id" json:"id"`

	// The name of the course.
	Name string `dynamodbav:"name" json:"name"`

	// The description of the course.
	Description string `dynamodbav:"description" json:"description"`

	// The color the course is designed for.
	Color string `dynamodbav:"color" json:"color"`

	// The cohorts the course is designed for.
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohort"`

	// The human-readable range of the cohorts the course is designed for.
	CohortRange string `dynamodbav:"cohortRange" json:"cohortRange"`

	// The price of the course in cents (e.g. 700 is actually $7). A non-positive number indicates that
	// the course is not separately for sale.
	Price int `dynamodbav:"price" json:"price"`

	// Whether the course is included with a training-plan subscription.
	IncludedWithSubscription bool `dynamodbav:"includedWithSubscription" json:"includedWithSubscription"`

	// The list of chapters included in the course.
	Chapters []*Chapter `dynamodbav:"chapters" json:"chapters"`
}

// Chapter contains the information for a single course chapter.
type Chapter struct {
	// The name of the chapter.
	Name string `dynamodbav:"name" json:"name"`

	// The FEN to display as the thumbnail of the chapter.
	ThumbnailFen string `dynamodbav:"thumbnailFen" json:"thumbnailFen"`

	// The board orientation of the thumbnail.
	ThumbnailOrientation string `dynamodbav:"thumbnailOrientation" json:"thumbnailOrientation"`

	// The list of modules within the chapter.
	Modules []*CourseModule `dynamodbav:"modules" json:"modules"`
}

type CourseModuleType string

const (
	Video             CourseModuleType = "VIDEO"
	PgnViewer         CourseModuleType = "PGN_VIEWER"
	SparringPositions CourseModuleType = "SPARRING_POSITIONS"
	ModelGames        CourseModuleType = "MODEL_GAMES"
	Exercises         CourseModuleType = "EXERCISES"
)

type Coach string

const (
	Jesse  Coach = "JESSE"
	Kostya Coach = "KOSTYA"
	David  Coach = "DAVID"
)

// CourseModule is a single activity within a course chapter.
type CourseModule struct {
	// The optional id of the module. Used mainly for exercises to
	// persist progress on the exercises
	Id string `dynamodbav:"id" json:"id"`

	// The name of the module.
	Name string `dynamodbav:"name" json:"name"`

	// The type of the module.
	Type CourseModuleType `dynamodbav:"type" json:"type"`

	// The description of the module.
	Description string `dynamodbav:"description" json:"description"`

	// A body of text that appears after the main content of the module.
	Postscript string `dynamodbav:"postscript" json:"postscript"`

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

// CourseGetter provides an interface for fetching Courses.
type CourseGetter interface {
	// GetCourse returns the course with the provided type and id.
	GetCourse(courseType, id string) (*Course, error)
}

// GetCourse returns the course with the provided type and id.
func (repo *dynamoRepository) GetCourse(courseType, id string) (*Course, error) {
	input := &dynamodb.GetItemInput{
		Key: map[string]*dynamodb.AttributeValue{
			"type": {S: aws.String(courseType)},
			"id":   {S: aws.String(id)},
		},
		TableName: aws.String(courseTable),
	}

	course := Course{}
	if err := repo.getItem(input, &course); err != nil {
		return nil, err
	}
	return &course, nil
}

// TODO: delete after completing opening -> course migration
type OpeningGetter interface {
	// GetOpening returns the course with the provided id.
	GetOpening(id string) (*Course, error)
}

// TODO: delete after completing opening -> course migration
// GetOpening returns the course with the provided id.
func (repo *dynamoRepository) GetOpening(id string) (*Course, error) {
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

// CourseLister provides an interface for listing courses.
type CourseLister interface {
	// ListCourses returns a list of courses with the provided type.
	ListCourses(courseType, startKey string) ([]*Course, string, error)
}

// ListCourses returns a list of courses with the provided type.
func (repo *dynamoRepository) ListCourses(courseType, startKey string) ([]*Course, string, error) {
	input := &dynamodb.QueryInput{
		KeyConditionExpression: aws.String("#type = :type"),
		ExpressionAttributeNames: map[string]*string{
			"#type": aws.String("type"),
		},
		ExpressionAttributeValues: map[string]*dynamodb.AttributeValue{
			":type": {S: aws.String(courseType)},
		},
		IndexName: aws.String("SummaryIndex"),
		TableName: aws.String(courseTable),
	}
	var courses []*Course
	lastKey, err := repo.query(input, startKey, &courses)
	if err != nil {
		return nil, "", err
	}
	return courses, lastKey, nil
}

// TODO: delete after completing opening -> course migration
type OpeningLister interface {
	// ListOpenings returns a list of opening courses in the database.
	ListOpenings(startKey string) ([]*Course, string, error)
}

// TODO: delete after completing opening -> course migration
// ListOpenings returns a list of opening courses in the database.
func (repo *dynamoRepository) ListOpenings(startKey string) ([]*Course, string, error) {
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
