package com.serverless.register;

import com.mongodb.client.MongoCollection;
import com.serverless.roundrobin.CohortRange;
import com.serverless.roundrobin.RoundRobinException;
import io.github.sornerol.chess.pubapi.exception.ChessComPubApiException;
import org.bson.Document;
import java.io.IOException;


public class RegisterHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final MongoCollection<Document> Lichesscollection;
    private final MongoCollection<Document> chessComCollection;
    private final RegisterManager actions = new RegisterManager();
    private final String DiscordID;
    private final String DiscordName;
    private final int startCohort;
    private final String lichessName;
    private final String chessComName;
    private final String dojoUsername;


    public RegisterHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection, MongoCollection<Document> lichesscollection, MongoCollection<Document> chessComCollection, String discordID, String discordName, int startCohort, String lichessName, String chessComName, String dojoUsername) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;
        this.Lichesscollection = lichesscollection;
        this.chessComCollection = chessComCollection;
        this.DiscordID = discordID;
        this.DiscordName = discordName;
        this.startCohort = startCohort;
        this.lichessName = lichessName;
        this.chessComName = chessComName;
        this.dojoUsername = dojoUsername;
    }


    public String playerRegister() throws ChessComPubApiException, IOException {

        if(DiscordName.equalsIgnoreCase("null") || DiscordName.equalsIgnoreCase("")) && (DiscordID.equalsIgnoreCase("null") || DiscordID.equalsIgnoreCase("")) && (dojoUsername.equalsIgnoreCase("null") || dojoUsername.equalsIgnoreCase("")){
            throw new IOException("Invalid params, at least 1 paramter must be valid");
        }

        if((lichessName.equalsIgnoreCase("null") || lichessName.equalsIgnoreCase("")) && (chessComName.equalsIgnoreCase("null") || chessComName.equalsIgnoreCase(""))){
            throw new IOException("Lichess or Chess.com account name must be provided");
        }

        String nonDiscordUserName = DiscordName.equalsIgnoreCase("null") || DiscordName.equalsIgnoreCase("") ? dojoUsername : DiscordName;
        String nonDiscordUserID = DiscordID.equalsIgnoreCase("null") || DiscordID.equalsIgnoreCase("") ? dojoUsername : DiscordID;


        if(actions.alreadyRegisteredInTournament(RRcollection, nonDiscordUserName)){
            return "You have already registered in a tournament!";
        }

        actions.addPlayerToDB(nonDiscordUserID, nonDiscordUserName, lichessname, chessComName, this.RRplayerCollection);

            try{
                CohortRange userCohort = CohortRange.findCohortRange(startCohort, startCohort + 100);
                if(userCohort != null){
                    String eligibleID = actions.getTournamentIDForStartCohort(this.RRcollection, userCohort);

                    actions.addPlayerToRunningTournament(nonDiscordUserName, RRcollection, RRplayerCollection, eligibleID);

                    return "Registration Successful! You be notified when the Round Robin starts!";
                }else{
                    throw new RoundRobinException("Invalid cohort!");
                }

            }catch (RoundRobinException e){
                return e.getMessage();
            }
    }
}
