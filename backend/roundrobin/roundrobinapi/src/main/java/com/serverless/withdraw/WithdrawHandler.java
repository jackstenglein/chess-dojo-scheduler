package com.serverless.withdraw;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

public class WithdrawHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final WithdrawManager actions = new WithdrawManager();
    private final String Discordname;
    private final String dojoUsername;


    public WithdrawHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection, String discordname, String dojoUsername) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;
        Discordname = discordname;
        this.dojoUsername = dojoUsername;
    }


    public String playerWithdraw(){

        try{
            String nonDiscordUser = Discordname.equalsIgnoreCase("null") || Discordname.equalsIgnoreCase("") ? dojoUsername : Discordname;
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
