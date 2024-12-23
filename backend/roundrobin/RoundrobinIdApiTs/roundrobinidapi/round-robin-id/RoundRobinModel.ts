
import { Document as doc } from "mongodb";

/**
 * This interface the structure of Round robin tournaments and all info that is needed to show on the site
 */
export interface RoundRobinModel {
    id: string; // tournament id
    name: string; // name
    pairingdata: string[][]; // pairings
    desc: string; // tournament desc
    crosstabledata: string[][]; // raw crosstable data
    players: string[]; // players
    gameSub: string[]; // game submissions
    tc: number; // time control
    inc: number; // time increment 
    fen: string; // fen yea we can run chess960 tournaments lol
    status: string; // tournament status
    startdate: Date; // start date of tournament 
    enddate: Date; // end date of tournament
    waiting: boolean; // is waiting list?
    scoremap: doc; // hashmappa for leaderboard (joma tech reference)
}

