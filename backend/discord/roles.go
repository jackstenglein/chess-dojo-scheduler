package discord

import (
	"os"
	"strings"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var freeRoles = makeCohortRoles(os.Getenv("discordFreeRoles"))
var paidRoles = makeCohortRoles(os.Getenv("discordPaidRoles"))
var openClassicalRole = os.Getenv("discordOpenClassicalRole")

// makeCohortRoles returns a map from Dojo cohort to the corresponding Discord
// role ID in the given comma separated list.
func makeCohortRoles(roleCsv string) map[database.DojoCohort]string {
	roleIds := strings.Split(roleCsv, ",")
	rolesByCohort := make(map[database.DojoCohort]string)
	for i, roleId := range roleIds {
		rolesByCohort[database.Cohorts[i]] = roleId
	}
	return rolesByCohort
}

// getRole returns the Discord role ID for the given cohort and payment status.
func getRole(cohort database.DojoCohort, paid bool) string {
	if paid {
		return paidRoles[cohort]
	}
	return freeRoles[cohort]
}

// isCohortRole returns true if the given role ID is a paid or free cohort role.
func isCohortRole(roleId string) bool {
	for _, r := range freeRoles {
		if r == roleId {
			return true
		}
	}
	for _, r := range paidRoles {
		if r == roleId {
			return true
		}
	}
	return false
}
