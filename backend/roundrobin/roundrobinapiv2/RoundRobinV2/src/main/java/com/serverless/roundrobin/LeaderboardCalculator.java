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
      
        Document foundDocument = RRcollection.find(new Document("tournamentId", tid)).first();

        if (foundDocument != null) {
           
            Document scoreMap = foundDocument.get("scoremap", Document.class);

            if (scoreMap != null) {
               
                List<Map.Entry<String, Double>> leaderboard = scoreMap.entrySet()
                        .stream()
                        .map(entry -> new AbstractMap.SimpleEntry<>(entry.getKey(), getDoubleValue(entry.getValue())))
                        .sorted((entry1, entry2) -> Double.compare(entry2.getValue(), entry1.getValue())) // Sort descending
                        .collect(Collectors.toList());

               
                Document newScoreMap = new Document();
                for (Map.Entry<String, Double> entry : leaderboard) {
                    newScoreMap.append(entry.getKey(), entry.getValue());
                }

            
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
            return ((Number) value).doubleValue(); 
        }
        return 0.0; 
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
