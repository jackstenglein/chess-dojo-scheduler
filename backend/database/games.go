package database

type Game struct {
	// The Dojo cohort for the game
	Cohort DojoCohort `dynamodbav:"cohort" json:"cohort"`

	// The sort key of the game, in the form of date#uuid
	Id string `dynamodbav:"id" json:"id"`

	// The player with the white pieces
	White string `dynamodbav:"white" json:"white"`

	// The player with the black pieces
	Black string `dynamodbav:"black" json:"black"`

	// The date that the game was played
	Date string `dynamodbav:"date" json:"date"`

	// The username of the owner of this game
	Owner string `dynamodbav:"owner" json:"owner"`

	// The PGN text of the game
	Pgn string `dynamodbav:"pgn" json:"pgn"`
}
