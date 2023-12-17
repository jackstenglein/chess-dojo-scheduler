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
	// The owner of the course.
	Owner string `dynamodbav:"owner" json:"owner"`

	// The display name of the owner of the course.
	OwnerDisplayName string `dynamodbav:"ownerDisplayName" json:"ownerDisplayName"`

	// The stripe ID of the owner of the course.
	StripeId string `dynamodbav:"stripeId" json:"stripeId"`

	// The type of the course and the hash key of the table.
	Type CourseType `dynamodbav:"type" json:"type"`

	// The id of the course and the range key of the table.
	Id string `dynamodbav:"id" json:"id"`

	// The name of the course.
	Name string `dynamodbav:"name" json:"name"`

	// The description of the course.
	Description string `dynamodbav:"description" json:"description"`

	// Bullet points describing what's included in the course.
	WhatsIncluded []string `dynamodbav:"whatsIncluded" json:"whatsIncluded"`

	// The color the course is designed for.
	Color string `dynamodbav:"color" json:"color"`

	// The cohorts the course is designed for.
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohorts"`

	// The human-readable range of the cohorts the course is designed for.
	CohortRange string `dynamodbav:"cohortRange" json:"cohortRange"`

	// Whether the course is included with a training-plan subscription.
	IncludedWithSubscription bool `dynamodbav:"includedWithSubscription" json:"includedWithSubscription"`

	// Whether the course can be purchased by free-tier users.
	AvailableForFreeUsers bool `dynamodbav:"availableForFreeUsers" json:"availableForFreeUsers"`

	// The options to purchase the course.
	PurchaseOptions []CoursePurchaseOption `dynamodbav:"purchaseOptions" json:"purchaseOptions"`

	// The list of chapters included in the course.
	Chapters []*Chapter `dynamodbav:"chapters" json:"chapters"`
}

// Represents a way to purchase a course.
type CoursePurchaseOption struct {
	// The name of the purchase option.
	Name string `dynamodbav:"name" json:"name"`

	// The normal, full-price of the purchase option in cents.
	FullPrice int `dynamodbav:"fullPrice" json:"fullPrice"`

	// The current price of the purchase option in cents. If non-positive, then FullPrice is used instead.
	CurrentPrice int `dynamodbav:"currentPrice" json:"currentPrice"`

	// A list of selling points for the purchase option.
	SellingPoints []CourseSellingPoint `dynamodbav:"sellingPoints,omitempty" json:"sellingPoints,omitempty"`

	// A list of course ids this purchase option gives access to. If not present, the containing course ID is used.
	CourseIds []string `dynamodbav:"courseIds,omitempty" json:"courseIds,omitempty"`
}

// A specific selling point for a course.
type CourseSellingPoint struct {
	// A short description of the selling point.
	Description string `dynamodbav:"description" json:"description"`

	// Whether the selling point is included or not.
	Included bool `dynamodbav:"included" json:"included"`
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
	// Required to fetch the user's course permissions.
	UserGetter

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

// CourseLister provides an interface for listing courses.
type CourseLister interface {
	// ListCourses returns a list of courses with the provided type.
	ListCourses(courseType, startKey string) ([]Course, string, error)

	// ScanCourses returns a list of all courses.
	ScanCourses(startKey string) ([]Course, string, error)
}

// ListCourses returns a list of courses with the provided type.
func (repo *dynamoRepository) ListCourses(courseType, startKey string) ([]Course, string, error) {
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
	var courses []Course
	lastKey, err := repo.query(input, startKey, &courses)
	if err != nil {
		return nil, "", err
	}
	return courses, lastKey, nil
}

// ScanCourses returns a list of all courses.
func (repo *dynamoRepository) ScanCourses(startKey string) ([]Course, string, error) {
	input := &dynamodb.ScanInput{
		IndexName: aws.String("SummaryIndex"),
		TableName: aws.String(courseTable),
	}
	var courses []Course
	lastKey, err := repo.scan(input, startKey, &courses)
	if err != nil {
		return nil, "", err
	}
	return courses, lastKey, nil
}
