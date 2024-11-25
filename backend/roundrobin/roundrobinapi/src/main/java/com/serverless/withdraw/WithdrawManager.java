package com.serverless.withdraw;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import com.serverless.game.GameState;
import com.serverless.game.Platform;
import com.serverless.roundrobin.RoundRobinCrosstable;
import com.serverless.roundrobin.RoundRobinException;
import com.serverless.roundrobin.RoundRobinManager;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

public class WithdrawManager {


    private final RoundRobinManager manager = new RoundRobinManager();

    public Document getRegisteredPlayerTournamentID(MongoCollection<Document> RRcollection, String playerName){
        Document query = null;

        query = new Document("players", playerName);
        return RRcollection.find(query).first();
    }

    public void removePlayerToRunningTournament(String playerUsername, MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection ,String tournamentID) throws RoundRobinException {
        Document activeTournament = manager.getTournamentIDDoc(RRcollection, tournamentID);

        if (activeTournament != null) {
            String tournamentId = activeTournament.getString("tournamentId");
            System.out.println("First Active Eligible Tournament ID: " + tournamentId);
            withdrawPlayerToTournamentSimpleAlgo(activeTournament, RRcollection, RRplayercollection ,tournamentID, playerUsername);
        } else {
            throw new RoundRobinException("No Round Robin found internal error!");
        }

    }

    public void pushPlayerScore(String username, MongoCollection<Document> RRplayercollection, Platform platform, double newScore){

        Document searchAmb = null;

        switch (platform){
            case LICHESS -> searchAmb = manager.performGeneralSearch(RRplayercollection, "Lichessname", username);
            case CHESSCOM -> searchAmb = manager.performGeneralSearch(RRplayercollection, "Chesscomname", username);
            case DISCORD -> searchAmb = manager.performGeneralSearch(RRplayercollection, "Discordname", username);
        }

        RRplayercollection.updateOne(searchAmb, Updates.inc("score", newScore));
        System.out.println("Successfully updated the player " + username + " Score by: " + newScore);

    }


    public void withdrawPlayerToTournamentSimpleAlgo(Document tourneyID, MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection ,String tournamentID, String username) throws RoundRobinException {
        List<String> currPlayers = tourneyID.getList("players", String.class);
        RoundRobinCrosstable crosstableManager = new RoundRobinCrosstable(RRcollection, RRplayercollection, tournamentID);
        boolean scoresSheetPresent = isScoresSheetPresent(username, crosstableManager, currPlayers);

        if(scoresSheetPresent){
            for(String player: currPlayers){
                crosstableManager.updateCrossTableScores(player, username, GameState.WHITE_WON, Platform.DISCORD);
            }
            currPlayers.remove(username);

            for(String player: currPlayers){
                pushPlayerScore(player, RRplayercollection, Platform.DISCORD, 1);
            }
        }

        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.pull("players", username)
        );

    }



    private boolean isScoresSheetPresent(String username, RoundRobinCrosstable crosstableManager, List<String> currPlayers) throws RoundRobinException {
        List<ArrayList<String>> crosstable = crosstableManager.getTournamentCrosstable();

        boolean scoresSheetPresent = false;

        if(!currPlayers.contains(username)){
            throw new RoundRobinException("Player not found and can't be withdrawn!");
        }


        for(ArrayList<String> scoresheet: crosstable){
            for(String sheet: scoresheet){
                if (sheet.equalsIgnoreCase("1/2") || sheet.equalsIgnoreCase("1") || sheet.equalsIgnoreCase("0")) {
                    scoresSheetPresent = true;
                    break;
                }
            }
        }
        return scoresSheetPresent;
    }


}

