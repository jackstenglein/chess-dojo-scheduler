import { Collection, Document } from 'mongodb';
import { RoundRobinModel } from './RoundRobinModel';

export class RoundRobinIdFinder {

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
