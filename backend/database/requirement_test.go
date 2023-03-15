package database

import (
	"testing"
)

func TestCalculateScore(t *testing.T) {
	table := []struct {
		name        string
		requirement *Requirement
		cohort      DojoCohort
		progress    *RequirementProgress
		want        float32
	}{
		{
			name:   "NilRequirement",
			cohort: DojoCohort("1400-1500"),
			progress: &RequirementProgress{
				RequirementId: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
			},
		},
		{
			name: "InvalidCohort",
			requirement: &Requirement{
				Id: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
				UnitScore: 0.5,
			},
			cohort: DojoCohort("InvalidCohort"),
			progress: &RequirementProgress{
				RequirementId: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 5,
					"1500-1600": 10,
				},
			},
		},
		{
			name: "NilProgress",
			requirement: &Requirement{
				Id: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
				UnitScore: 0.5,
			},
			cohort: DojoCohort("1400-1500"),
		},
		{
			name: "ZeroCohorts",
			requirement: &Requirement{
				Id: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
				UnitScore: 0.5,
			},
			cohort: DojoCohort("1400-1500"),
			progress: &RequirementProgress{
				RequirementId: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500":   5,
					"ALL_COHORTS": 7,
				},
			},
			want: 3.5,
		},
		{
			name: "OneCohort",
			requirement: &Requirement{
				Id: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
				UnitScore:       0.5,
				NumberOfCohorts: 1,
			},
			cohort: DojoCohort("1400-1500"),
			progress: &RequirementProgress{
				RequirementId: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500":   5,
					"ALL_COHORTS": 7,
				},
			},
			want: 3.5,
		},
		{
			name: "TwoCohortsOneComplete",
			requirement: &Requirement{
				Id: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
				UnitScore:       0.5,
				NumberOfCohorts: 2,
			},
			cohort: DojoCohort("1400-1500"),
			progress: &RequirementProgress{
				RequirementId: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 4,
				},
			},
			want: 2,
		},
		{
			name: "TwoCohortsBothComplete",
			requirement: &Requirement{
				Id: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
				UnitScore:       0.5,
				NumberOfCohorts: 2,
			},
			cohort: DojoCohort("1400-1500"),
			progress: &RequirementProgress{
				RequirementId: "test-requirement",
				Counts: map[DojoCohort]int{
					"1400-1500": 7,
					"1500-1600": 10,
				},
			},
			want: 5,
		},
	}

	for _, tc := range table {
		t.Run(tc.name, func(t *testing.T) {
			got := tc.requirement.CalculateScore(tc.cohort, tc.progress)

			if got != tc.want {
				t.Errorf("CalculateScore(%v, %s, %v) got: %f; want: %f", tc.requirement, tc.cohort, tc.progress, got, tc.want)
			}
		})
	}
}
