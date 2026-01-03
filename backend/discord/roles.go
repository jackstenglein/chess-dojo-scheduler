package discord

import (
	"os"
	"strings"

	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var freeRoles = makeCohortRoles(os.Getenv("discordFreeRoles"))
var paidRoles = makeCohortRoles(os.Getenv("discordPaidRoles"))
var openClassicalRole = os.Getenv("discordOpenClassicalRole")
var liveClassesRole = os.Getenv("discordLiveClassesRole")

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

// getRoles returns the Discord role IDs for the given cohort and tier.
func getRoles(cohort database.DojoCohort, tier database.SubscriptionTier) []string {
	if tier == database.SubscriptionTier_Free {
		return []string{freeRoles[cohort]}
	}

	if tier == database.SubscriptionTier_Basic {
		return []string{paidRoles[cohort]}
	}

	return []string{paidRoles[cohort], liveClassesRole}
}

// isSubscriptionBasedRole returns true if the given role ID is automatically assigned
// based on the user's subscription.
func isSubscriptionBasedRole(roleId string) bool {
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
	return roleId == liveClassesRole
}
