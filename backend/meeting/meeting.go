package meeting

import (
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.MeetingLister = database.DynamoDB

type ListMeetingsResponse struct {
	Meetings         []*database.Meeting `json:"meetings"`
	LastEvaluatedKey string              `json:"lastEvaluatedKey,omitempty"`
}

func List(username, startKey string) (*ListMeetingsResponse, error) {
	meetings, lastKey, err := repository.ListMeetings(username, startKey)
	if err != nil {
		return nil, err
	}

	return &ListMeetingsResponse{
		Meetings:         meetings,
		LastEvaluatedKey: lastKey,
	}, nil
}
