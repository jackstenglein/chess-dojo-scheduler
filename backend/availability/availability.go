package availability

import (
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var repository database.AvailabilitySearcher = database.DynamoDB

type ListAvailabilitiesResponse struct {
	Availabilities   []*database.Availability `json:"availabilities"`
	LastEvaluatedKey string                   `json:"lastEvaluatedKey,omitempty"`
}

// ListByOwner returns the Availabilities for which the provided username is the owner.
func ListByOwner(username, startKey string) (*ListAvailabilitiesResponse, error) {

	availabilities, lastKey, err := repository.ListAvailabilitiesByOwner(username, startKey)
	if err != nil {
		return nil, err
	}

	return &ListAvailabilitiesResponse{
		Availabilities:   availabilities,
		LastEvaluatedKey: lastKey,
	}, nil
}

// ListByTime returns a list of all Availabilities matching the provided request.
func ListByTime(user *database.User, startTime, startKey string) (*ListAvailabilitiesResponse, error) {

	availabilities, lastKey, err := repository.ListAvailabilitiesByTime(user, startTime, startKey)
	if err != nil {
		return nil, err
	}

	return &ListAvailabilitiesResponse{
		Availabilities:   availabilities,
		LastEvaluatedKey: lastKey,
	}, nil
}
