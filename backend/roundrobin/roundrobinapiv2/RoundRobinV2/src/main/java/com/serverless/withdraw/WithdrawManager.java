package com.serverless.withdraw;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import com.serverless.game.Platform;
import com.serverless.register.RegisterManager;
import com.serverless.roundrobin.LeaderboardCalculator;
import com.serverless.roundrobin.RoundRobinCrosstable;
import com.serverless.roundrobin.RoundRobinException;
import com.serverless.roundrobin.RoundRobinManager;
import org.bson.Document;

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
        LeaderboardCalculator leaderboardManager = new LeaderboardCalculator(RRcollection, RRplayercollection);
        RegisterManager registerManager = new RegisterManager();


        if(!tourneyID.getBoolean("waiting")){
            crosstableManager.withdrawPlayer(currPlayers.size(), currPlayers.indexOf(username));
            leaderboardManager.removePlayer(tournamentID, username);
            currPlayers.remove(username);
            leaderboardManager.giveFreeByesOnWithdraw(tournamentID);
            leaderboardManager.calculateAndUpdateLeaderboard(tournamentID);
        }


        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.pull("players", username)
        );

        UpdateResult result1 = RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.pull("leaderboard", username)
        );

        if(!tourneyID.getBoolean("waiting")){
            String pairs = registerManager.getRoundRobinPairingsInternally(RRcollection, RRplayercollection, tournamentID);
            System.out.println(pairs);
        }


    }



}

