import {
    getCategoryScore,
    getCurrentCount,
    getRemainingCategoryScorePercent,
    getSuggestedTasks,
    getTotalCount,
    getUnitScore,
    Requirement,
    RequirementCategory,
} from '@/database/requirement';
import {
    ALL_COHORTS,
    dojoCohorts,
    RatingSystem,
    TimeFormat,
    User,
} from '@/database/user';
import commandLineArgs from 'command-line-args';
import commandLineUsage from 'command-line-usage';
import * as fs from 'fs';
import { json2csv } from 'json-2-csv';
import { requirements as allRequirements } from './requirements';

const optionDefinitions = [
    {
        name: 'help',
        description: 'Display this usage guide.',
        alias: 'h',
        type: Boolean,
    },
    {
        name: 'cohorts',
        description:
            'The cohorts to run the simulation on. Each cohort will get its own CSV file.',
        alias: 'c',
        type: String,
        multiple: true,
    },
];

const usage = [
    {
        header: 'Simulate the Suggested Task Algorithm',
        content:
            'A utility for running the suggested task algorithm on mock users and generating CSV reports',
    },
    {
        header: 'Synopsis',
        content: [
            '$ simulate-suggested-tasks',
            '$ simulate-suggested-tasks -c 1200-1300',
        ],
    },
    {
        header: 'Options',
        optionList: optionDefinitions,
    },
];

const opts = commandLineArgs(optionDefinitions);
if (opts.help) {
    console.log(commandLineUsage(usage));
    process.exit(0);
}

function getCohorts(optCohorts: string[] | undefined): string[] {
    if (!optCohorts || optCohorts.length === 0) {
        return dojoCohorts;
    }
    return optCohorts;
}

function getEmptyUser(cohort: string): User {
    return {
        dojoCohort: cohort,
        progress: {},

        // Necessary for typing, unused in script
        username: '',
        displayName: '',
        discordUsername: '',
        bio: '',
        subscriptionStatus: '',
        ratingSystem: RatingSystem.Chesscom,
        ratings: {},
        disableBookingNotifications: false,
        disableCancellationNotifications: false,
        isAdmin: false,
        isCalendarAdmin: false,
        isTournamentAdmin: false,
        isBetaTester: false,
        isCoach: false,
        createdAt: '',
        updatedAt: '',
        numberOfGraduations: 0,
        previousCohort: '',
        lastGraduatedAt: '',
        enableLightMode: false,
        timezoneOverride: '',
        timeFormat: TimeFormat.Default,
        hasCreatedProfile: false,
        followerCount: 0,
        followingCount: 0,
        referralSource: '',
        notificationSettings: {},
        totalDojoScore: 0,
        exams: {},
    };
}

interface ReportRow {
    suggestedTask1: string;
    suggestedTask2: string;
    suggestedTask3: string;
    chosenTask: string;
    gamesPoints: number;
    gamesPercent: number;
    tacticsPoints: number;
    tacticsPercent: number;
    middlegamesPoints: number;
    middlegamesPercent: number;
    endgamePoints: number;
    endgamePercent: number;
    openingPoints: number;
    openingPercent: number;
}

function getReportRow(
    suggestedTasks: Requirement[],
    chosenTask: Requirement,
    user: User,
    requirements: Requirement[],
): ReportRow {
    return {
        suggestedTask1: suggestedTasks[0]?.shortName || suggestedTasks[0]?.name || '',
        suggestedTask2: suggestedTasks[1]?.shortName || suggestedTasks[1]?.name || '',
        suggestedTask3: suggestedTasks[2]?.shortName || suggestedTasks[2]?.name || '',
        chosenTask: `${chosenTask.shortName || chosenTask.name} (${getCurrentCount(user.dojoCohort, chosenTask, user.progress[chosenTask.id])} / ${getTotalCount(user.dojoCohort, chosenTask)})`,
        gamesPoints:
            getCategoryScore(
                user,
                user.dojoCohort,
                RequirementCategory.Games,
                requirements,
            ) || 0,
        gamesPercent:
            1 -
            getRemainingCategoryScorePercent(
                user,
                user.dojoCohort,
                RequirementCategory.Games,
                requirements,
            ),
        tacticsPoints:
            getCategoryScore(
                user,
                user.dojoCohort,
                RequirementCategory.Tactics,
                requirements,
            ) || 0,
        tacticsPercent:
            1 -
            getRemainingCategoryScorePercent(
                user,
                user.dojoCohort,
                RequirementCategory.Tactics,
                requirements,
            ),
        middlegamesPoints:
            getCategoryScore(
                user,
                user.dojoCohort,
                RequirementCategory.Middlegames,
                requirements,
            ) || 0,
        middlegamesPercent:
            1 -
            getRemainingCategoryScorePercent(
                user,
                user.dojoCohort,
                RequirementCategory.Middlegames,
                requirements,
            ),
        endgamePoints:
            getCategoryScore(
                user,
                user.dojoCohort,
                RequirementCategory.Endgame,
                requirements,
            ) || 0,
        endgamePercent:
            1 -
            getRemainingCategoryScorePercent(
                user,
                user.dojoCohort,
                RequirementCategory.Endgame,
                requirements,
            ),
        openingPoints:
            getCategoryScore(
                user,
                user.dojoCohort,
                RequirementCategory.Opening,
                requirements,
            ) || 0,
        openingPercent:
            1 -
            getRemainingCategoryScorePercent(
                user,
                user.dojoCohort,
                RequirementCategory.Opening,
                requirements,
            ),
    };
}

function simulateTrainingPlan(cohort: string, requirements: Requirement[]) {
    console.info('Starting simulation for cohort ', cohort);

    const rows: ReportRow[] = [];
    const user = getEmptyUser(cohort);
    let suggestedTasks = getSuggestedTasks([], requirements, user);

    do {
        const chosenTask =
            suggestedTasks[Math.floor(Math.random() * suggestedTasks.length)];

        if (!user.progress[chosenTask.id]) {
            user.progress[chosenTask.id] = {
                requirementId: chosenTask.id,
                counts: {
                    [cohort]: chosenTask.startCount,
                    [ALL_COHORTS]: chosenTask.startCount,
                },
                minutesSpent: { [cohort]: 0 },
                updatedAt: new Date().toISOString(),
            };
        }

        let increment = 1;
        const unitScore = getUnitScore(cohort, chosenTask);
        if (unitScore > 0 && unitScore < 1) {
            increment = Math.ceil(1 / chosenTask.unitScore);
        } else if (unitScore === 0) {
            increment = getTotalCount(cohort, chosenTask);
        }

        if (chosenTask.numberOfCohorts === 0 || chosenTask.numberOfCohorts === 1) {
            user.progress[chosenTask.id].counts[ALL_COHORTS] += increment;
        } else {
            user.progress[chosenTask.id].counts[user.dojoCohort] += increment;
        }

        rows.push(getReportRow(suggestedTasks, chosenTask, user, requirements));
        suggestedTasks = getSuggestedTasks([], requirements, user);
    } while (suggestedTasks.length);

    const csv = json2csv(rows);
    fs.writeFileSync(`suggested-tasks-${cohort}.csv`, csv, 'utf-8');
    console.info(`Report saved at suggested-tasks-${cohort}.csv`);
}

function getCohortRequirements(cohort: string): Requirement[] {
    return allRequirements.filter((r) => r.counts[cohort]);
}

const cohorts = getCohorts(opts.cohorts as string[]);
for (const cohort of cohorts) {
    const requirements = getCohortRequirements(cohort);
    simulateTrainingPlan(cohort, requirements);
}
