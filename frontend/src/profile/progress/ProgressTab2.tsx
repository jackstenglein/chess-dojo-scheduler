import DojoScoreCard from '@/components/profile/stats/DojoScoreCard';
import {
    RequirementCategory,
    RequirementStatus,
    ScoreboardDisplay,
} from '@/database/requirement';
import { User } from '@/database/user';
import { Chip, MenuItem, Stack, TextField } from '@mui/material';
import ProgressCategory from './ProgressCategory';

export function ProgressTab2({
    user,
    isCurrentUser,
}: {
    user: User;
    isCurrentUser: boolean;
}) {
    return (
        <Stack alignItems='start' mb={6}>
            <DojoScoreCard user={user} cohort={user.dojoCohort} />

            <TextField select label='Work Goal' value='3' fullWidth sx={{ mt: 4, mb: 3 }}>
                <MenuItem value='1'>1 hour / day</MenuItem>
                <MenuItem value='2'>2 hours / day</MenuItem>
                <MenuItem value='3'>3 hours / day</MenuItem>
                <MenuItem value='4'>4 hours / day</MenuItem>
            </TextField>

            <Stack direction='row' gap={1}>
                <Chip label='Daily' color='secondary' onClick={() => null} />
                <Chip
                    label='Weekly'
                    color='secondary'
                    variant='outlined'
                    onClick={() => null}
                />
                <Chip
                    label='Monthly'
                    color='secondary'
                    variant='outlined'
                    onClick={() => null}
                />
                <Chip
                    label='Full Training Plan'
                    color='secondary'
                    variant='outlined'
                    onClick={() => null}
                />
            </Stack>

            <ProgressCategory
                color='dojoOrange'
                c={{
                    name: "Today's Tasks" as RequirementCategory,
                    requirements: [
                        {
                            id: 'test-req-1',
                            status: RequirementStatus.Active,
                            category: RequirementCategory.Games,
                            name: 'Schedule Your Next Classical Game',
                            description: '',
                            freeDescription: '',
                            counts: {
                                ALL_COHORTS: 1,
                                [user.dojoCohort]: 1,
                            },
                            startCount: 0,
                            numberOfCohorts: 0,
                            unitScore: 0,
                            totalScore: 0,
                            scoreboardDisplay: ScoreboardDisplay.Hidden,
                            progressBarSuffix: '',
                            updatedAt: '',
                            sortPriority: '0.0.0',
                            expirationDays: 365,
                            isFree: true,
                        },
                        {
                            id: 'test-req-1',
                            status: RequirementStatus.Active,
                            category: RequirementCategory.Games,
                            name: 'Annotate a Classical Game',
                            description: '',
                            freeDescription: '',
                            counts: {
                                ALL_COHORTS: 1,
                                [user.dojoCohort]: 1,
                            },
                            startCount: 0,
                            numberOfCohorts: 0,
                            unitScore: 0,
                            totalScore: 0,
                            scoreboardDisplay: ScoreboardDisplay.Hidden,
                            progressBarSuffix: '',
                            updatedAt: '',
                            sortPriority: '0.0.0',
                            expirationDays: 365,
                            isFree: true,
                        },
                        {
                            id: 'test-req-2',
                            status: RequirementStatus.Active,
                            category: RequirementCategory.Tactics,
                            name: 'Solve Polgar M2s 307-350',
                            description: '',
                            freeDescription: '',
                            counts: {
                                ALL_COHORTS: 1,
                                [user.dojoCohort]: 1,
                            },
                            startCount: 0,
                            numberOfCohorts: 0,
                            unitScore: 0,
                            totalScore: 0,
                            scoreboardDisplay: ScoreboardDisplay.Hidden,
                            progressBarSuffix: '',
                            updatedAt: '',
                            sortPriority: '0.0.1',
                            expirationDays: 365,
                            isFree: true,
                        },
                        {
                            id: 'test-req-2',
                            status: RequirementStatus.Active,
                            category: RequirementCategory.Middlegames,
                            name: 'Read Most Instructive Games 1-6',
                            description: '',
                            freeDescription: '',
                            counts: {
                                ALL_COHORTS: 1,
                                [user.dojoCohort]: 1,
                            },
                            startCount: 0,
                            numberOfCohorts: 0,
                            unitScore: 0,
                            totalScore: 0,
                            scoreboardDisplay: ScoreboardDisplay.Hidden,
                            progressBarSuffix: '',
                            updatedAt: '',
                            sortPriority: '0.0.1',
                            expirationDays: 365,
                            isFree: true,
                        },
                    ],
                    totalComplete: 0,
                    totalRequirements: 4,
                }}
                expanded={true}
                toggleExpand={() => null}
                user={user}
                isCurrentUser={true}
                cohort={user.dojoCohort}
            />

            {/* <ProgressCategory
                color='dojoOrange'
                c={{
                    name: 'This Week' as RequirementCategory,
                    requirements: [],
                    totalComplete: 1,
                    totalRequirements: 6,
                }}
                expanded={false}
                toggleExpand={() => null}
                user={user}
                isCurrentUser={true}
                cohort={user.dojoCohort}
            /> */}
        </Stack>
    );
}
