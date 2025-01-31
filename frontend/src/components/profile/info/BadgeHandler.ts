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