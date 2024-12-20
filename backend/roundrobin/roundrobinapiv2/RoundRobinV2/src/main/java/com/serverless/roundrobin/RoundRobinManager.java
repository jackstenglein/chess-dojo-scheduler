package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.serverless.game.Platform;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;


public class RoundRobinManager {


    public Document getTournamentIDDoc (MongoCollection<Document> RRcollection, String tournamentID){
        Document query = new Document("tournamentId", tournamentID);
        return RRcollection.find(query).first();
    }

    public Document performGeneralSearch( MongoCollection<Document> collection, String key, String val){
        Document query = new Document(key, val);
        return collection.find(query).first();
    }

    public Document getRegisteredPlayerTournamentID(MongoCollection<Document> RRcollection, String playerName){
        Document query = null;

        query = new Document("players", playerName);
        return RRcollection.find(query).first();
    }

    public boolean searchTheAmbiguousUsername(String username, Platform platform, MongoCollection<Document> RRplayercollection){

        switch (platform){
            case LICHESS -> {
                return performGeneralSearch(RRplayercollection, "Lichessname", username) != null;
            }
            case CHESSCOM -> {
                return performGeneralSearch(RRplayercollection, "Chesscomname", username) != null;
            }
            case DISCORD -> {
                return performGeneralSearch(RRplayercollection, "Discordname", username) != null;
            }
        }

        return false;
    }

    public void pushGameSubmissionForRunningTournament(MongoCollection<Document> RRcollection, String gameInfo, String tournamentID){

        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.push("game-submissions", gameInfo)
        );


    }

    public List<String> getGameSubmissionsFromRunningTournament(MongoCollection<Document> RRcollection, String tournamentID) throws RoundRobinException {

        Document tournamentDoc = getTournamentIDDoc(RRcollection, tournamentID);

        if (tournamentDoc != null) {
            String tournamentId = tournamentDoc.getString("tournamentId");
            System.out.println("First Active Tournament ID: " + tournamentId);

            return tournamentDoc.getList("game-submissions", String.class);


        } else {
            throw new RoundRobinException("Invalid Tournament ID!");
        }
    }


    public void pushPlayerScore(String username, MongoCollection<Document> RRplayercollection, MongoCollection<Document> RRcollection, Platform platform, double newScore, String tid){

        Document searchAmb = null;
        LeaderboardCalculator calculator = new LeaderboardCalculator(RRcollection, RRplayercollection);
        // this is wrong this only works for 1 tournament not for N tournaments
        switch (platform){
            case LICHESS -> searchAmb = performGeneralSearch(RRplayercollection, "Lichessname", username);
            case CHESSCOM -> searchAmb = performGeneralSearch(RRplayercollection, "Chesscomname", username);
            case DISCORD -> searchAmb = performGeneralSearch(RRplayercollection, "Discordname", username);
        }

        calculator.updatePlayerScore(tid, searchAmb.getString("Discordname"), newScore);
        System.out.println("Successfully updated the player " + username + " Score by: " + newScore);

    }


    public void pushCrossTableList(MongoCollection<Document> RRcollection, ArrayList<ArrayList<String>> crosstableList, String tournamentID){
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("crosstable-data", crosstableList)
        );
    }



}
