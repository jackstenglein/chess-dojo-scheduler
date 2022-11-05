package database

type DojoCohort string

var cohorts = []DojoCohort{
	"0-400",
	"400-600",
	"600-700",
	"700-800",
	"800-900",
	"900-1000",
	"1000-1100",
	"1100-1200",
	"1200-1300",
	"1300-1400",
	"1400-1500",
	"1500-1600",
	"1600-1700",
	"1700-1800",
	"1800-1900",
	"1900-2000",
	"2000-2100",
	"2100-2200",
	"2200-2300",
	"2300-2400",
	"2400+",
}

const allCohorts = "ALL_COHORTS"

// IsValidCohort returns true if the provided cohort is valid.
func IsValidCohort(c DojoCohort) bool {
	if c == allCohorts {
		return true
	}
	for _, c2 := range cohorts {
		if c == c2 {
			return true
		}
	}
	return false
}

type User struct {
	// Cognito attributes
	Username string `dynamodbav:"username" json:"username"`
	Email    string `dynamodbav:"email" json:"-"`
	Name     string `dynamodbav:"name" json:"-"`

	// Public attributes
	DiscordUsername  string     `dynamodbav:"discordUsername" json:"discordUsername"`
	ChesscomUsername string     `dynamodbav:"chesscomUsername" json:"chesscomUsername"`
	LichessUsername  string     `dynamodbav:"lichessUsername" json:"lichessUsername"`
	DojoCohort       DojoCohort `dynamodbav:"dojoCohort" json:"dojoCohort"`

	IsAdmin bool `dynamodbav:"isAdmin" json:"isAdmin"`
}

type AvailabilityType string

var availabilityTypes = []AvailabilityType{
	"CLASSICAL_GAME",
	"OPENING_SPARRING",
	"MIDDLEGAME_SPARRING",
	"ENDGAME_SPARRING",
	"ROOK_ENDGAME_PROGRESSION",
	"CLASSIC_ANALYSIS",
	"BOOK_STUDY",
}

// IsValidAvailabilityType returns true if the provided availability type
// is valid.
func IsValidAvailabilityType(t AvailabilityType) bool {
	for _, t2 := range availabilityTypes {
		if t == t2 {
			return true
		}
	}
	return false
}

type Availability struct {
	// The username of the creator of this availability.
	Owner string `dynamodbav:"owner" json:"owner"`

	// The discord username of the owner.
	OwnerDiscord string `dynamodbav:"ownerDiscord" json:"ownerDiscord"`

	// The cohort of the owner.
	OwnerCohort DojoCohort `dynamodbav:"ownerCohort" json:"ownerCohort"`

	// A v4 UUID identifying this availability
	Id string `dynamodbav:"id" json:"id"`

	// The time the availability starts, in full ISO-8601 format. This is the earliest
	// that the owner is willing to start their game/meeting.
	StartTime string `dynamodbav:"startTime" json:"startTime"`

	// The time the availability ends, in full ISO-8601 format. This is the latest
	// that the owner is willing to start their game/meeting.
	EndTime string `dynamodbav:"endTime" json:"endTime"`

	// The time that the availability will be deleted from the database. This is set
	// to 48 hours after the end time.
	ExpirationTime int64 `dynamodbav:"expirationTime" json:"-"`

	// The game/meeting types that the owner is willing to play.
	Types []AvailabilityType `dynamodbav:"types" json:"types"`

	// The dojo cohorts that the owner is willing to play against/meet with.
	Cohorts []DojoCohort `dynamodbav:"cohorts" json:"cohorts"`

	// The status of the Availability. Always set to SCHEDULED for now.
	Status string `dynamodbav:"status" json:"-"`

	// Contains either a zoom link, discord, discord classroom, etc.
	Location string `dynamodbav:"location" json:"location"`

	// An optional description for sparring positions, etc.
	Description string `dynamodbav:"description" json:"description"`
}

type Meeting struct {
	// The username of the person that created the availability
	// that spwaned this meeting.
	Owner string `dynamodbav:"owner" json:"owner"`

	// The other person participating in this meeting.
	Participant string `dynamodbav:"participant" json:"participant"`

	// A v4 UUID identifying this meeting
	Id string `dynamodbav:"id" json:"id"`

	// The time the meeting starts, in full ISO-8601 format.
	StartTime string `dynamodbav:"startTime" json:"startTime"`

	// The time that the meeting will be deleted from the database. This is set
	// to 48 hours after the start time.
	ExpirationTime int64 `dynamodbav:"expirationTime" json:"-"`

	// The game/meeting type that the participants will play
	Type AvailabilityType `dynamodbav:"type" json:"type"`

	// Contains either a zoom link, discord, discord classroom, etc.
	Location string `dynamodbav:"location" json:"location"`

	// An optional description for sparring positions, etc.
	Description string `dynamodbav:"description" json:"description"`
}
