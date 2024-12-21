package com.serverless.register;

import com.mongodb.client.MongoCollection;
import com.serverless.roundrobin.CohortRange;
import com.serverless.roundrobin.RoundRobinException;
import org.bson.Document;
import java.io.IOException;


public class RegisterHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final RegisterManager actions = new RegisterManager();



    public RegisterHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;

    }

    public String playerRegister(String discordID, String discordName, int startCohort, String lichessName, String chessComName, String dojoUsername) throws IOException, RoundRobinException {

        if(dojoUsername.equalsIgnoreCase("null") || dojoUsername.equalsIgnoreCase("")){
            throw new IOException("Invalid params, DojoUsername is mandatory");
        }

        if((lichessName.equalsIgnoreCase("null") || lichessName.equalsIgnoreCase("")) && (chessComName.equalsIgnoreCase("null") || chessComName.equalsIgnoreCase(""))){
            throw new IOException("Lichess or Chess.com account name must be provided");
        }

        String nonDiscordUserName = discordName.equalsIgnoreCase("null") || discordName.equalsIgnoreCase("") ? dojoUsername : discordName;
        String nonDiscordUserID = discordID.equalsIgnoreCase("null") || discordID.equalsIgnoreCase("") ? dojoUsername : discordID;

        if(actions.alreadyRegisteredInTournament(RRcollection, nonDiscordUserName)){
            return "You have already registered in a tournament and hit max tournament registration limit!";
        }

        actions.addPlayerToDB(nonDiscordUserID, nonDiscordUserName, lichessName, chessComName, this.RRplayerCollection);

            CohortRange userCohort = CohortRange.findCohortRange(startCohort, startCohort + 100);
            if(userCohort != null){
                String eligibleID = actions.getTournamentIDForStartCohort(this.RRcollection, userCohort, nonDiscordUserName);

                actions.addPlayerToRunningTournament(nonDiscordUserName, RRcollection, RRplayerCollection, eligibleID);

                return "Registration Successful! You be notified when the Round Robin starts!";
            }else{
                throw new RoundRobinException("Invalid cohort!");
            }


    }
}
