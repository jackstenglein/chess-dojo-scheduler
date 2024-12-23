package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;

import java.util.*;
import java.util.stream.Collectors;

/**
 * This class calculates and updates the leaderboard for a round-robin
 * tournament.
 */
public class LeaderboardCalculator {

    private final MongoCollection<Document> RRcollection;

    /**
     * Constructor for LeaderboardCalculator.
     * 
     * @param RRcollection The MongoDB collection for the tournament data.
     */
    public LeaderboardCalculator(MongoCollection<Document> RRcollection) {
        this.RRcollection = RRcollection;
    }

    /**
     * Removes a player from the tournament.
     * 
     * @param tid        The ID of the tournament.
     * @param playerName The name of the player to remove.
     */
    public void removePlayer(String tid, String playerName) {
        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tid),
                new Document("$unset", new Document("scoremap." + playerName, 0)));
        System.out.println("Removed player: " + playerName + ", matched count: " + result.getMatchedCount());
    }

    /**
     * Adds a player to the tournament.
     * 
     * @param tid        The ID of the tournament.
     * @param playerName The name of the player to add.
     * @param score      The initial score of the player.
     */

    public void addPlayer(String tid, String playerName, double score) {
        System.out.println("ADD FUNCTION STARTED");
        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tid),
                new Document("$set", new Document("scoremap." + playerName, score)));
        System.out.println("Added player: " + playerName + ", matched count: " + result.getMatchedCount());
    }

    /**
     * Updates the score of a player in the tournament.
     * 
     * @param tid        The ID of the tournament.
     * @param playerName The name of the player.
     * @param increment  The amount to increment the score by.
     */

    public void updatePlayerScore(String tid, String playerName, double increment) {
        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tid),
                new Document("$inc", new Document("scoremap." + playerName, increment)));
        System.out.println("Updated score for player: " + playerName + ", matched count: " + result.getMatchedCount());
    }

    /**
     * Calculates and updates the leaderboard for the tournament.
     * 
     * @param tid The ID of the tournament.
     */
    public void calculateAndUpdateLeaderboard(String tid) {
        Document foundDocument = RRcollection.find(new Document("tournamentId", tid)).first();

        if (foundDocument != null) {

            Document scoreMap = foundDocument.get("scoremap", Document.class);

            if (scoreMap != null) {

                List<Map.Entry<String, Double>> leaderboard = scoreMap.entrySet()
                        .stream()
                        .map(entry -> new AbstractMap.SimpleEntry<>(entry.getKey(), getDoubleValue(entry.getValue())))
                        .sorted((entry1, entry2) -> Double.compare(entry2.getValue(), entry1.getValue())) // Sort
                                                                                                          // descending
                        .collect(Collectors.toList());

                Document newScoreMap = new Document();
                for (Map.Entry<String, Double> entry : leaderboard) {
                    newScoreMap.append(entry.getKey(), entry.getValue());
                }

                RRcollection.updateOne(
                        new Document("tournamentId", tid),
                        new Document("$set", new Document("scoremap", newScoreMap)));

                System.out.println("Leaderboard updated successfully.");
            }
        } else {
            System.out.println("Document with tid " + tid + " not found.");
        }
    }

    /**
     * Retrieves the double value of an object.
     * 
     * @param value The object to convert.
     * @return The double value of the object.
     */
    private Double getDoubleValue(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }

    /**
     * Gives free byes to all players in the tournament when someone withdraws from
     * the tournament.
     * 
     * @param tid The ID of the tournament.
     */
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
