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
    [BADGE.POLGAR_MATE_TWO]: [500, 750, 1471, 2000, 2500, 3000, 3718],
    [BADGE.POLGAR_MATE_THREE]: [4462],
    [BADGE.CLASSICAL_GAMES]: [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500],
    [BADGE.ANNONTATE_GAMES]: [1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500],
    [BADGE.DAILY_STREAK]: [3, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
};

/**
 * classical games level to message hashmap
 */

const classicalGameMilestones: Record<number, string> = {
    1: 'Congrats on playing your first classical game. Keep up the good work!',
    5: "Congrats on playing five classical games. That's a full tournament!",
    10: "Congrats on playing 10 classical games! You're on your way!",
    25: "Wow! 25 classical games—you're really dedicated!",
    50: "Congrats on reaching 50 classical games! That's impressive!",
    75: "You're unstoppable! 75 classical games played!",
    100: "Amazing! You've played 100 classical games—century club!",
    150: '150 classical games! Your dedication is truly inspiring!',
    200: "200 classical games—you're a seasoned player now!",
    250: 'Incredible! 250 classical games! A true chess warrior!',
    300: '300 classical games! Your endurance is unmatched!',
    400: '400 classical games—masterful commitment!',
    500: "500 classical games! You're a true legend!",
};

/**
 *
 * annontation to message hashmap
 */

const annotationMilestones: Record<number, string> = {
    1: 'Congrats on annotating your first classical game. Keep up the good work!',
    5: "Congrats on annotating five classical games. That's a strong start!",
    10: "Congrats on annotating 10 classical games! You're building valuable insights!",
    25: 'Wow! 25 classical game annotations—your analysis is impressive!',
    50: 'Congrats on reaching 50 annotated classical games! A true analyst!',
    75: "You're a dedicated student of the game! Whoa, check out Fischer over here!",
    100: 'Amazing! 100 classical game annotations—insightful mastery! Whoa, check out Botvinnik over here!',
    150: '150 annotations! Your analytical skills are truly inspiring!',
    200: "200 classical game annotations—you're shaping your chess mind!",
    250: 'Incredible! 250 annotations! A true chess scholar!',
    300: '300 annotations! Whoa, check out Tarrasch over here!!',
    400: '400 classical game annotations—remarkable dedication!',
    500: '500 classical game annotations! Whoa, check out Tartakower over here!',
};

/**
 * Polgar to message hashmap
 */

const polgarMateMilestones: Record<number, string> = {
    50: "Congrats on solving your first 50 Polgar mates! You're sharpening your tactical vision.",
    306: "Amazing! You've completed all mate-in-ones. Great job recognizing immediate threats!",
    500: '500 Polgar mates solved! Your tactical acumen is growing rapidly.',
    750: "750 Polgar mates! That's impressive dedication to tactical mastery.",
    1000: '1,000 Polgar mates solved! Your chess instincts are getting sharper!',
    1471: "Incredible! You've solved all simple mate-in-twos. Tactical brilliance!",
    2000: '2,000 Polgar mates solved—truly remarkable tactical prowess!',
    2500: "2,500 Polgar mates! You're a tactical mastermind!",
    3000: "3,000 Polgar mates solved—you're relentless in your pursuit of tactical excellence!",
    3718: "Outstanding! You've conquered all mate-in-twos. Tactical genius unlocked!",
    4462: "Amazing achievement! You've mastered all mate-in-threes. Tactical artistry!",
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
 * gets the badge message
 * @param level the level for badge
 * @param badge the badge type
 * @returns the message
 */
function getBadgeMessage(level: number, badge: BADGE): string {
    let msg: string;
    switch (badge) {
        case BADGE.POLGAR_MATE_ONE:
            msg = polgarMateMilestones[level];
            break;
        case BADGE.POLGAR_MATE_TWO:
            msg = polgarMateMilestones[level];
            break;
        case BADGE.POLGAR_MATE_THREE:
            msg = polgarMateMilestones[level];
            break;
        case BADGE.ANNONTATE_GAMES:
            msg = annotationMilestones[level];
            break;
        case BADGE.CLASSICAL_GAMES:
            msg = classicalGameMilestones[level];
            break;
        case BADGE.DAILY_STREAK:
            msg = 'Wowza! Your daily streak hit ' + level + '!';
            break;
    }

    return msg;
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
    info.push(getBadgeMessage(level, badge));

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
