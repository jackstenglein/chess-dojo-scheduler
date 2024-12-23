import { Collection, Document } from 'mongodb';
import { RoundRobinModel } from './RoundRobinModel';

/**
 * This class represents logic to find a tournament and fetch the info for it in 1 go
 */
export class RoundRobinIdFinder {

    /**
     * gets the tournament info for given cohort and builds tournament json list that contain info for that tournament
     * @param collection MongoDb collection that contain tournament data
     * @param startCohort the target cohort that user is trying to fetch
     * @returns Promise of list of tournament objects
     */
    async getTournamentIdForStartCohort(collection: Collection<Document>, startCohort: number): Promise<RoundRobinModel[]> {
        console.log("inside the func");
        const query = { 'cohort-start': startCohort};
        const cursor = collection.find(query);
        const tournaments: RoundRobinModel[] = [];
        
        await cursor.forEach((doc) => {
            if (doc.tournamentId) {
                const tournament: RoundRobinModel = {
                    id: doc.tournamentId,
                    name: doc.name,
                    desc: doc.desc,
                    status: doc.status,
                    tc: doc.tc,
                    inc: doc.inc,
                    fen: doc.fen,
                    players: doc.players,
                    crosstabledata: doc["crosstable-data"], // we doing this cuz of - in middle
                    gameSub: doc["game-submissions"],
                    pairingdata: doc["pairing-data"],
                    waiting: doc.waiting,
                    startdate: doc.startdate,
                    enddate: doc.enddate,
                    scoremap: doc.scoremap
                }

                tournaments.push(tournament);
            }
        });

        return tournaments;
    }
}
