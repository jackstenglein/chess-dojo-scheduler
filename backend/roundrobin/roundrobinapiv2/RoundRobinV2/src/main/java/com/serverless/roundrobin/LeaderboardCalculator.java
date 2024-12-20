package com.serverless.roundrobin;


import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;

import java.util.*;
import java.util.stream.Collectors;

public class LeaderboardCalculator {

    private final RoundRobinManager actions = new RoundRobinManager();
    private final MongoCollection<Document> RRcollection;
    private final MongoCollection<Document> RRplayercollection;

    public LeaderboardCalculator(MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection) {
        this.RRcollection = RRcollection;
        this.RRplayercollection = RRplayercollection;
    }


    public void calculateLeaderboard(String tournamentId){
        Document cal = actions.getTournamentIDDoc(RRcollection, tournamentId);
        List<String> players = cal.getList("players", String.class);
        HashMap<String, Double> scoreMap = new HashMap<>();
        // this is wrong only works for 1 tournament not N tournaments the user is part of
        for(String player: players){
            Document playerdoc = actions.performGeneralSearch(RRplayercollection, "Discordname", player);
            if(playerdoc != null){
                scoreMap.put(player, playerdoc.getDouble("score"));
            }else{
                scoreMap.put(player, 0.0);
            }

        }

        List<String> sortedPlayerNames = new ArrayList<>(scoreMap.keySet());
        List<Double> sortedScores = new ArrayList<>();
        sortedPlayerNames.sort((name1, name2) -> scoreMap.get(name2).compareTo(scoreMap.get(name1)));

        for(String p: sortedPlayerNames){
            sortedScores.add(scoreMap.get(p));
        }

        UpdateResult result1 = RRcollection.updateOne(
                new Document("tournamentId", tournamentId),
                Updates.set("leaderboard", sortedPlayerNames)
        );

        UpdateResult result2 = RRcollection.updateOne(
                new Document("tournamentId", tournamentId),
                Updates.set("scores", sortedScores)
        );
    }


    // Example of logging update results
    public void removePlayer(String tid, String playerName) {
        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tid),
                new Document("$unset", new Document("scoremap." + playerName, 0))
        );
        System.out.println("Removed player: " + playerName + ", matched count: " + result.getMatchedCount());
    }

    public void addPlayer(String tid, String playerName, double score){
        System.out.println("ADD FUNCTION STARTED");
        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tid),
                new Document("$set", new Document("scoremap." + playerName, score))
        );
        System.out.println("Added player: " + playerName + ", matched count: " + result.getMatchedCount());
    }

    public void updatePlayerScore(String tid, String playerName, double increment) {
        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tid),
                new Document("$inc", new Document("scoremap." + playerName, increment))
        );
        System.out.println("Updated score for player: " + playerName + ", matched count: " + result.getMatchedCount());
    }

    public void calculateAndUpdateLeaderboard(String tid) {
        // Find the document with the specified tid
        Document foundDocument = RRcollection.find(new Document("tournamentId", tid)).first();

        if (foundDocument != null) {
            // Retrieve scoremap
            Document scoreMap = foundDocument.get("scoremap", Document.class);

            if (scoreMap != null) {
                // Convert scoreMap to a list of entries and sort by score
                List<Map.Entry<String, Double>> leaderboard = scoreMap.entrySet()
                        .stream()
                        .map(entry -> new AbstractMap.SimpleEntry<>(entry.getKey(), getDoubleValue(entry.getValue())))
                        .sorted((entry1, entry2) -> Double.compare(entry2.getValue(), entry1.getValue())) // Sort descending
                        .collect(Collectors.toList());

                // Create a new scoremap for the updated leaderboard
                Document newScoreMap = new Document();
                for (Map.Entry<String, Double> entry : leaderboard) {
                    newScoreMap.append(entry.getKey(), entry.getValue());
                }

                // Update the existing document's scoremap with the new sorted scoremap
                RRcollection.updateOne(
                        new Document("tournamentId", tid),
                        new Document("$set", new Document("scoremap", newScoreMap))
                );

                System.out.println("Leaderboard updated successfully.");
            }
        } else {
            System.out.println("Document with tid " + tid + " not found.");
        }
    }

    private Double getDoubleValue(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue(); // Safely cast to double
        }
        return 0.0; // Default value if not a number
    }

    public void giveFreeByesOnWithdraw(String tid) {
        Document foundDocument = RRcollection.find(new Document("tournamentId", tid)).first();

        if (foundDocument != null) {
            Document scoreMap = foundDocument.get("scoremap", Document.class);

            if (scoreMap != null) {
                for (String player : scoreMap.keySet()) {
                    updatePlayerScore(tid, player, 1);
                }
            }
        }
    }







}
