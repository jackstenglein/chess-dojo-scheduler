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
}

type UserUpdateRequest struct {
	DiscordUsername  *string     `dynamodbav:"discordUsername,omitempty" json:"discordUsername"`
	ChesscomUsername *string     `dynamodbav:"chesscomUsername,omitempty" json:"chesscomUsername"`
	LichessUsername  *string     `dynamodbav:"lichessUsername,omitempty" json:"lichessUsername"`
	DojoCohort       *DojoCohort `dynamodbav:"dojoCohort,omitempty" json:"dojoCohort"`
}
