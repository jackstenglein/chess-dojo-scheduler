<<<<<<< HEAD
import { Requirement } from "@/database/requirement";
import { User } from "@/database/user";
import { getCurrentScore } from "@/database/requirement";

export const BADGE_ELIGIBLE_LIMIT_GAMES: number[] = [
    1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500
];

export const STREAKS_BADGES: number[] = [
    1, 5, 10, 25, 50, 75, 100, 150
]

export const POLGAR_BADGES: number[] = [
    50, 500, 750, 1407, 1500, 2000, 2500, 3000
]

export const ROUND_ROBIN_BADGES: string[] = [
    'fall', 'summer', 'winter', 'spring'
]

export function getAnonGameBadge(level: number): string {
    return `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/ana/new/clean/Ann_${level}-removebg-preview.png?raw=true`;
}

export function getClaGameBadge(level: number): string {
    return `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/cla/new/clean/cla_${level}-removebg-preview.png?raw=true`
}

export function getPolgarBadge(level: number): string {
    return `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/pol/new/clean/polgar_${level}-removebg-preview.png?raw=true`
}

export function getRRbadge(season: string): string {
    return `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/rr/clean/RR_${season}-removebg-preview.png?raw=true`
}

export function getStreakBadge(streak: number): string {
    return `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/streak/clean/streak${streak}paper-clean.png?raw=true`
}

export function isEligbleForBadge(user: User, reqid: string, targetLevel: number, reqs: Requirement[]): boolean {

    const analyzeREQ = reqs.find((r) => r.id == reqid);

    console.log('ANALYZESS of', analyzeREQ?.name);

    if(!analyzeREQ){
        return false;
    }

    if(!user){
        return false;
    }
    
    if(user.graduationCohorts != null){
        if(user.graduationCohorts.length == 0){
            console.log('IN PAST')
            const currentScore = getCurrentScore(user.dojoCohort, analyzeREQ, user.progress[analyzeREQ.id]);
            console.log(currentScore)
            return currentScore == targetLevel;
        }else{
            let totalScore = 0;
            console.log('IN CURRENT PLUS PAST')
            for(const cohort of user.graduationCohorts){
                totalScore += getCurrentScore(cohort, analyzeREQ, user.progress[analyzeREQ.id]);
            }
            
            totalScore = totalScore + getCurrentScore(user.dojoCohort, analyzeREQ, user.progress[analyzeREQ.id])
            console.log(totalScore)
            return totalScore == targetLevel;
        }
    }else{
        console.log('JUST CURRENT')
        const currentScore = getCurrentScore(user.dojoCohort, analyzeREQ, user.progress[analyzeREQ.id]);
        return currentScore == targetLevel;
    }

}
=======
import { User } from '@/database/user';

/**
 * BADGE enum representation
 */
export enum BADGE {
    POLGAR_MATE_ONE = '917be358-e6d9-47e6-9cad-66fc2fdb5da6',
    POLGAR_MATE_TWO = 'f815084f-b9bc-408d-9db9-ba9b1c260ff3',
    POLGAR_MATE_THREE = '657fd4c7-461c-4503-b5f7-38a5a3480008',
    CLASSICAL_GAMES = '38f46441-7a4e-4506-8632-166bcbe78baf',
    ANNONTATE_GAMES = '4d23d689-1284-46e6-b2a2-4b4bfdc37174',
    DAILY_STREAK = 'DAILY_STREAK',
}

/**
 * Current Badge limits
 */
const BADGE_LIMITS: Record<BADGE, number[]> = {
    [BADGE.POLGAR_MATE_ONE]: [50, 306],
    [BADGE.POLGAR_MATE_TWO]: [500, 750, 1471, 2000, 2500, 3000],
    [BADGE.POLGAR_MATE_THREE]: [4462],
    [BADGE.CLASSICAL_GAMES]: [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500],
    [BADGE.ANNONTATE_GAMES]: [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500],
    [BADGE.DAILY_STREAK]: [3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
};

/**
 * Badge titles
 */
const BADGE_TITLE: Record<BADGE, string> = {
    [BADGE.POLGAR_MATE_ONE]: 'Polgar M1',
    [BADGE.POLGAR_MATE_TWO]: 'Polgar M2',
    [BADGE.POLGAR_MATE_THREE]: 'Polgar M3',
    [BADGE.ANNONTATE_GAMES]: 'Game Annontation',
    [BADGE.CLASSICAL_GAMES]: 'Classical Games Played',
    [BADGE.DAILY_STREAK]: 'Daily Streak',
};

const ROUND_ROBIN_BADGES: string[] = ['fall', 'summer', 'winter', 'spring'];

/**
 * gets the RR badge
 * @param season the RR season
 * @returns RR image
 */
export function getRRbadge(season: string): string {
    return `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/rr/clean/RR_${season}-removebg-preview.png?raw=true`;
}

/**
 * Get the counting badge images
 * @param level the level to fetch the badge for
 * @param badge the type of badge
 * @returns the image of the badge
 */
function getBadgeImage(level: number, badge: BADGE): string {
    let imageURL: string;
    switch (badge) {
        case BADGE.POLGAR_MATE_ONE:
            imageURL = `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/pol/new/clean/polgar_${level}-removebg-preview.png?raw=true`;
            break;
        case BADGE.POLGAR_MATE_TWO:
            imageURL = `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/pol/new/clean/polgar_${level}-removebg-preview.png?raw=true`;
            break;
        case BADGE.POLGAR_MATE_THREE:
            imageURL = `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/pol/new/clean/polgar_${level}-removebg-preview.png?raw=true`;
            break;
        case BADGE.CLASSICAL_GAMES:
            imageURL = `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/cla/new/clean/cla_${level}-removebg-preview.png?raw=true`;
            break;
        case BADGE.ANNONTATE_GAMES:
            imageURL = `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/ana/new/clean/Ann_${level}-removebg-preview.png?raw=true`;
            break;
        case BADGE.DAILY_STREAK:
            imageURL = `https://github.com/jalpp/DojoIcons/blob/main/milestones/DojoBadges/streak/clean/streak${level}paper-clean.png?raw=true`;
            break;
    }

    return imageURL;
}

/**
 * check if a user is eligible for the badge and given requirement
 * @param user the current user
 * @param reqid the requirement ID
 * @param targetLevel the target level for user to earn the badge
 * @returns if user is eligible
 */
function isEligibleForBadge(user: User, reqid: string, targetLevel: number): boolean {
    const progress = user.progress[reqid];
    if (!progress) {
        return false;
    }

    let totalCount = 0;
    for (const key in progress.counts) {
        totalCount += progress.counts[key];
    }

    return totalCount >= targetLevel;
}

/**
 * gets the level the user is elgible for
 * @param user the current user
 * @param reqid the requirement id
 * @param levels the counting badge levels list
 * @returns the current level badge user can get
 */
function isEligibleForLimit(user: User, reqid: string, levels: number[]): number {
    let maxLevel: number = -1;
    for (const level of levels) {
        const elgible = isEligibleForBadge(user, reqid, level);

        if (elgible) {
            maxLevel = level;
        } else {
            return maxLevel;
        }
    }

    return -1;
}

/**
 * gets the info and badge image for eligible badge
 * @param user current user
 * @param badge the badge type
 * @returns info and image for the badge
 */
function isEligibleBadgeImage(user: User, badge: BADGE): string[] | undefined {
    const level: number = isEligibleForLimit(user, badge, BADGE_LIMITS[badge]);
    const info: string[] = [];
    if (level == -1) {
        return undefined;
    }

    info.push(getBadgeImage(level, badge));
    info.push(BADGE_TITLE[badge] + ' ' + level);

    return info;
}

/**
 * Gets all possible elgible badges for user
 * @param user the current user
 * @returns all possible badges
 */
export function getEligibleBadges(user: User): string[][] {
    const keys = Object.values(BADGE);
    const overallInfo: string[][] = [];
    keys.forEach((key) => {
        const badgeImg = isEligibleBadgeImage(user, key);
        if (badgeImg != undefined) {
            overallInfo.push(badgeImg);
        }
    });

    return overallInfo;
}
>>>>>>> b5032b42 (fix(badges): add viewing badge ability when eligible)
