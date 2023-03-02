package database

type Requirement struct {
	// Uniquely identifies a requirement
	Id string `dynamodbav:"id" json:"id"`

	// The display name of the requirement
	Name string `dynamodbav:"name" json:"name"`

	// The description of the requirement
	Description string `dynamodbav:"description" json:"description"`

	// The total number of units in the requirement
	Count int `dynamodbav:"count" json:"count"`

	// The score per unit
	UnitScore int `dynamodbav:"unitScore" json:"unitScore"`

	// The URLs of the videos describing the requirement, if any exist
	VideoUrls []string `dynamodbav:"videoUrls" json:"videoUrls"`

	// The cohorts that the requirement applies to
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohorts"`

	// The time the requirement was most recently updated
	UpdatedAt string `dynamodbav:"updatedAt" json:"updatedAt"`
}

type RequirementProgress struct {
	// The id of the requirement that the progress applies to
	RequirementId string `dynamodbav:"requirementId" json:"requirementId"`

	// The display name of the requirement that the progress applies to
	RequirementName string `dynamodbav:"requirementName" json:"requirementName"`

	// The current number of units completed in the requirement
	CurrentCount int `dynamodbav:"currentCount" json:"currentCount"`

	// The total number of units in the requirement
	TotalCount int `dynamodbav:"totalCount" json:"totalCount"`

	// The number of minutes spent working on the requirement
	MinutesSpent int `dynamodbav:"minutesSpent" json:"minutesSpent"`

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
