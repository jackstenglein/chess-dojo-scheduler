import { Requirement, RequirementCategory, RequirementProgress } from './requirement';
import {User, ALL_COHORTS} from './user';
import { suggestedAlgo, isComplete, getCategoryScore } from './requirement';
import * as fs from 'fs'
import { json2csv } from "/workspace/chess-dojo-scheduler/node_modules/json-2-csv/lib/converter"
import axios from 'axios';





const apiToken = "api-endpoint";

export async function simulateTrainingPlan(reqs: Requirement[], user: User) {
    const rows: any[] = [];
    let remainingReqs = reqs.filter(req => !isComplete(user.dojoCohort, req, user.progress[req.id]));
    console.log('running')
    while (remainingReqs.length > 0) {
        // Call suggestedAlgo
        const suggestedTasks = suggestedAlgo([], remainingReqs, user);
        
        // Pick a random task
        const chosenTask = suggestedTasks[Math.floor(Math.random() * suggestedTasks.length)];
        console.log(chosenTask)

        if (!chosenTask) break; // No tasks left to complete

        // Update progress
        if (!user.progress[chosenTask.id]) {
            user.progress[chosenTask.id] = {
                requirementId: chosenTask.id,
                counts: { [user.dojoCohort]: 0 },
                minutesSpent: { [user.dojoCohort]: 0 },
                updatedAt: new Date().toISOString(),
            };
        }
        
       
        let increment = 1;
        if (chosenTask.unitScore > 0 && chosenTask.unitScore < 1) {
            increment = Math.ceil(1 / chosenTask.unitScore);
        }

        if (chosenTask.numberOfCohorts === 0 || chosenTask.numberOfCohorts === 1) {
            user.progress[chosenTask.id].counts[ALL_COHORTS] += increment;
          } else {
            user.progress[chosenTask.id].counts[user.dojoCohort] += increment;
          }
       

        // Record data for JSON
        rows.push({
            'Suggested Task 1': suggestedTasks[0]?.name || '',
            'Suggested Task 2': suggestedTasks[1]?.name || '',
            'Suggested Task 3': suggestedTasks[2]?.name || '',
            'Task Chosen By User': chosenTask.name,
            'Games Dojo Points': getCategoryScore(user, user.dojoCohort, RequirementCategory.Games, remainingReqs) || 0,
            'Tactics Dojo Points': getCategoryScore(user, user.dojoCohort, RequirementCategory.Tactics, remainingReqs) || 0,
            'Middlegames Dojo Points': getCategoryScore(user, user.dojoCohort, RequirementCategory.Middlegames, remainingReqs) || 0,
            'Endgame Dojo Points': getCategoryScore(user, user.dojoCohort, RequirementCategory.Endgame, remainingReqs) || 0,
            'Opening Dojo Points': getCategoryScore(user, user.dojoCohort, RequirementCategory.Opening, remainingReqs) || 0,
        });

        console.log('JSON ', rows)

        // Recompute remaining requirements
        remainingReqs = reqs.filter(req => !isComplete(user.dojoCohort, req, user.progress[req.id]));
    }

    console.log('Finished!')

    //Save JSON to file
    try {
        const csv = json2csv(rows);
        fs.writeFileSync('output.json', JSON.stringify(rows, null, 2), 'utf-8');
        console.log('JSON file has been written to output.json');
        fs.writeFileSync('output.csv', csv, 'utf-8');
        console.log('CSV file has been written.');
    } catch (error) {
        console.error('Error writing JSON file:', error);
    }
}

interface ListRequirementsResponse {
    requirements: Requirement[];
    lastEvaluatedKey: string;
}

const BASE_URL: string = "https://c2qamdaw08.execute-api.us-east-1.amazonaws.com";

/**
 * listRequirements returns a list of requirements matching the provided cohort.
 * @param idToken The id token of the current signed-in user.
 * @param cohort The cohort to search for when matching requirements.
 * @param scoreboardOnly Whether to exclude results that are hidden from the scoreboard.
 * @param startKey The optional startKey to use when searching.
 * @returns A list of requirements matching the provided cohort.
 */
export async function listRequirements(
    idToken: string,
    cohort: string,
    scoreboardOnly: boolean,
    startKey?: string,
) {
    const params = { scoreboardOnly, startKey };
    const result: Requirement[] = [];
    
    console.log('MAKING API CALL TO BACKEND')
    //console.log(idToken);

    do {
        const resp = await axios.get<ListRequirementsResponse>(
            BASE_URL + `/requirements/${cohort}`,
            {
                params,
                headers: {
                    Authorization: 'Bearer ' + idToken,
                },
            },
        );
        
        result.push(...resp.data.requirements);
        params.startKey = resp.data.lastEvaluatedKey;
    } while (params.startKey);

    return result;
}

/**
 * getUser returns the current signed-in user.
 * @param idToken The id token of the current signed-in user.
 * @returns An AxiosResponse containing the current user in the data field.
 */
export function getUser(idToken: string) {
    return axios.get<User>(BASE_URL + '/user', {
        headers: {
            Authorization: 'Bearer ' + idToken,
        },
    });
}

async function main(): Promise<void>{
    const res = await getUser(apiToken);
    const mockUser: User = res.data;
    const reqRes = await listRequirements(apiToken, mockUser.dojoCohort, false);
    await simulateTrainingPlan(reqRes, mockUser);
}

main().catch((err) => {
    console.error("Unhandled error:", err);
});