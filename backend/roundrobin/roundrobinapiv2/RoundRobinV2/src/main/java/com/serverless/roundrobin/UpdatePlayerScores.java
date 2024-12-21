package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import com.serverless.game.GameState;
import com.serverless.game.Platform;
import org.bson.Document;

public class UpdatePlayerScores {

    private final RoundRobinManager actions = new RoundRobinManager();

    public UpdatePlayerScores(){

    }


    public void updatePlayerScore(String player1username, String player2username, Platform platform, GameState state, MongoCollection<Document> RRplayercollection, MongoCollection<Document> RRcollection, String tournamentID) throws RoundRobinException {

        Document activeTournament = actions.getTournamentIDDoc(RRcollection, tournamentID);

        if(activeTournament == null){
            throw new RoundRobinException("Invalid Tournament ID!");
        }

        boolean foundPlayer1 = actions.searchTheAmbiguousUsername(player1username, platform, RRplayercollection);
        boolean foundPlayer2 = actions.searchTheAmbiguousUsername(player2username, platform, RRplayercollection);

        if(!foundPlayer1){
            String format = actions.performGeneralSearch(RRplayercollection, platform.toString(), player1username).getString("Discordid");
            throw new RoundRobinException("Player: " + "<@" + format + ">" + "on Platform: " + platform.getName() + " has not verified their account, thus I abort this request sorry.");
        }

        if(!foundPlayer2){
            String format = actions.performGeneralSearch(RRplayercollection, platform.toString(), player1username).getString("Discordid");
            throw new RoundRobinException("Player: " + "<@" + format + ">"  + "on Platform: " + platform.getName() + " has not verified their account, thus I abort this request sorry.");
        }

        switch (state){
            case WHITE_WON , BLACK_LOST -> {
                actions.pushPlayerScore(player1username, RRplayercollection, RRcollection, platform, 1.0, tournamentID);
                actions.pushPlayerScore(player2username, RRplayercollection, RRcollection, platform, 0.0, tournamentID);
            }
            case WHITE_LOST, BLACK_WON -> {
                actions.pushPlayerScore(player1username, RRplayercollection, RRcollection, platform, 0.0, tournamentID);
                actions.pushPlayerScore(player2username, RRplayercollection, RRcollection , platform, 1.0, tournamentID);
            }
            case DRAW -> {
                actions.pushPlayerScore(player1username, RRplayercollection, RRcollection ,platform, 0.5, tournamentID);
                actions.pushPlayerScore(player2username, RRplayercollection, RRcollection,platform, 0.5, tournamentID);
            }
        }



    }



    public void submitGameURL(MongoCollection<Document> RRcollection, String gameURL, String tournamentID){
        actions.pushGameSubmissionForRunningTournament(RRcollection, gameURL, tournamentID);
    }


}
