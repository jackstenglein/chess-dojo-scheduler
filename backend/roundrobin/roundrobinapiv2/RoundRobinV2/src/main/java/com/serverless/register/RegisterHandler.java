package com.serverless.register;

import com.mongodb.client.MongoCollection;
import com.serverless.roundrobin.CohortRange;
import com.serverless.roundrobin.RoundRobinException;
import org.bson.Document;
import java.io.IOException;

/**
 * This class handles the registration of players for the round-robin tournament.
 */
public class RegisterHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final RegisterManager actions = new RegisterManager();

    /**
     * Initializes the handler with the required MongoDB collections.
     * @param rRplayerCollection The MongoDB collection for player data.
     * @param rRcollection The MongoDB collection for tournament data.
     */
    public RegisterHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;

    }


    /**
     * Registers a player for the round-robin tournament.
     * @param discordID The Discord ID of the player.
     * @param discordName  The Discord name of the player.
     * @param startCohort The starting cohort of the player.
     * @param lichessName The Lichess account name of the player.
     * @param chessComName The Chess.com account name of the player.
     * @param dojoUsername The Dojo username of the player.
     * @return The registration status message.
     * @throws IOException If an error occurs during registration.
     * @throws RoundRobinException If an error occurs during registration.
     */
    public String playerRegister(String discordID, String discordName, int startCohort, String lichessName, String chessComName, String dojoUsername) throws IOException, RoundRobinException {

        if(dojoUsername.equalsIgnoreCase("null") || dojoUsername.equalsIgnoreCase("")){
            throw new IOException("Invalid params, DojoUsername is mandatory");
        }

        if((lichessName.equalsIgnoreCase("null") || lichessName.equalsIgnoreCase("")) && (chessComName.equalsIgnoreCase("null") || chessComName.equalsIgnoreCase(""))){
            throw new IOException("Lichess or Chess.com account name must be provided");
        }

        String nonDiscordUserName = discordName.equalsIgnoreCase("null") || discordName.equalsIgnoreCase("") ? dojoUsername : discordName;
        String nonDiscordUserID = discordID.equalsIgnoreCase("null") || discordID.equalsIgnoreCase("") ? dojoUsername : discordID;

        actions.addPlayerToDB(nonDiscordUserID, nonDiscordUserName, lichessName, chessComName, this.RRplayerCollection);

        if(actions.alreadyRegisteredInTournament(this.RRcollection, nonDiscordUserName)){
            return "You have already registered in a tournament and hit max tournament registration limit!";
        }

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
