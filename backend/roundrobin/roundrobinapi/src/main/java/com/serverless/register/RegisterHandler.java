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
    private final VerificationManager verification = new VerificationManager();
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

        if(DiscordName.equalsIgnoreCase("null") && DiscordID.equalsIgnoreCase("null") && dojoUsername.equalsIgnoreCase("null")){
            throw new IOException("Invalid params, at least 1 paramter must be valid");
        }

        String nonDiscordUserName = DiscordName.equalsIgnoreCase("null") ? dojoUsername : DiscordName;
        String nonDiscordUserID = DiscordID.equalsIgnoreCase("null") ? dojoUsername : DiscordID;


        if(actions.alreadyRegisteredInTournament(RRcollection, nonDiscordUserName)){
            return "You have already registered in a tournament!";
        }

        boolean addSuccess = actions.addPlayerToDB(nonDiscordUserID,nonDiscordUserName, this.RRplayerCollection, this.Lichesscollection, this.chessComCollection);

        if(!addSuccess){
            StringBuilder res = new StringBuilder();
            if(verification.verificationStatus(lichessName, nonDiscordUserID)){
                Document document = new Document("Lichessname", lichessName)
                        .append("Discordid", nonDiscordUserID)
                        .append("blitz_score", 0) // blitz_score // rapid_score // blitz_score_gp // rapid_score_gp
                        .append("rapid_score", 0) // blitz_score_swiss 0.0 rapid_score_swiss 0.0
                        .append("classical_score", 0) // blitz_score_swiss_gp // rapid_score_swiss_gp
                        .append("blitz_rating", 0).append("classical_rating", 0) // blitz_comb_total // rapid_comb_total
                        .append("rapid_rating", 0).append("blitz_score_gp", 0)  // blitz_comb_total_gp rapid_comb_total_gp
                        .append("rapid_score_gp", 0).append("classical_score_gp", 0) // sp_score // eg_score //sp_rating // eg_rating
                        .append("blitz_score_swiss", 0.0).append("rapid_score_swiss", 0.0)
                        .append("classical_score_swiss", 0.0).append("blitz_score_swiss_gp", 0)
                        .append("rapid_score_swiss_gp", 0).append("classical_score_swiss_gp", 0)
                        .append("blitz_comb_total", 0).append("blitz_comb_total_gp", 0)
                        .append("rapid_comb_total", 0).append("rapid_comb_total_gp", 0)
                        .append("classical_comb_total", 0).append("classical_comb_total_gp", 0).append("sp_score", 0.0)
                        .append("sparring_rating", 0).append("eg_score", 0.0)
                        .append("eg_rating", 0);
                Lichesscollection.insertOne(document);
                res.append("Successfully verified Lichess account ");
            }

            if(verification.verificationStatusChesscom(chessComName, nonDiscordUserID)){
                Document document = new Document("Chesscomname", chessComName)
                        .append("Discordid", nonDiscordUserID)
                        .append("blitz_score", 0)
                        .append("rapid_score", 0)
                        .append("blitz_rating", 0)
                        .append("rapid_rating", 0).append("blitz_score_gp", 0)
                        .append("rapid_score_gp", 0)
                        .append("blitz_score_swiss", 0.0).append("rapid_score_swiss", 0.0)
                        .append("blitz_score_swiss_gp", 0)
                        .append("rapid_score_swiss_gp", 0)
                        .append("blitz_comb_total", 0).append("blitz_comb_total_gp", 0)
                        .append("rapid_comb_total", 0).append("rapid_comb_total_gp", 0)
                        .append("sp_score", 0.0)
                        .append("sparring_rating", 0).append("eg_score", 0.0)
                        .append("eg_rating", 0);
                chessComCollection.insertOne(document);
                res.append("Successfully verified Chess.com account ");
            }

            res.append("Error! Please verify your Lichess/Chess.com account");
            return res.toString();
        }else{
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
}
