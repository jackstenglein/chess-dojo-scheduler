package com.serverless.withdraw;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

/**
 * This class handles the withdrawal of players from a tournament via the API
 */
public class WithdrawHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final WithdrawManager actions = new WithdrawManager();
    private final String Discordname;
    private final String dojoUsername;

    /**
     * Constructor for WithdrawHandler.
     * @param rRplayerCollection The MongoDB collection for player data.
     * @param rRcollection The MongoDB collection for tournament data.
     * @param discordname The Discord username of the player.
     * @param dojoUsername The Dojo username of the player.
     */
    public WithdrawHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection, String discordname, String dojoUsername) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;
        Discordname = discordname;
        this.dojoUsername = dojoUsername;
    }

    /**
     * Withdraws a player from a tournament via the API.
     * @return The result of the withdrawal operation.
     */
    public String playerWithdraw(){

        try{
            String nonDiscordUser = Discordname.equalsIgnoreCase("null") ? dojoUsername : Discordname;
            Document getTournamentId = actions.getRegisteredPlayerTournamentID(RRcollection, nonDiscordUser);
            if(getTournamentId != null) {
                String tournamentId = getTournamentId.getString("tournamentId");
                actions.removePlayerToRunningTournament(nonDiscordUser, RRcollection, RRplayerCollection, tournamentId);
                return "Successfully withdrew the player: " + nonDiscordUser;
            }else{
                return "Player not found in active tournaments!";
            }

        } catch (Exception e) {
            return e.getMessage();
        }

    }


}
