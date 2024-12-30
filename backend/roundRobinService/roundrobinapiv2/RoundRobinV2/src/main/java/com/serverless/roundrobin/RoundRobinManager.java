package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.serverless.game.Platform;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * This class manages various operations related to the round-robin tournament.
 */
public class RoundRobinManager {

    /**
     * Retrieves the tournament document based on the tournament ID.
     *
     * @param RRcollection The MongoDB collection for tournament data.
     * @param tournamentID The ID of the tournament.
     * @return The document representing the tournament.
     */
    public Document getTournamentIDDoc(MongoCollection<Document> RRcollection, String tournamentID) {
        Document query = new Document("tournamentId", tournamentID);
        return RRcollection.find(query).first();
    }

    /**
     * Performs a general search in the specified collection based on a key-value
     * pair.
     *
     * @param collection The MongoDB collection to search in.
     * @param key        The key to search for.
     * @param val        The value to search for.
     * @return The document matching the search criteria.
     */
    public Document performGeneralSearch(MongoCollection<Document> collection, String key, String val) {
        Document query = new Document(key, val);
        return collection.find(query).first();
    }

    /**
     * Retrieves the tournament document for a registered player based on their
     * name.
     *
     * @param RRcollection The MongoDB collection for tournament data.
     * @param playerName   The name of the player.
     * @return The document representing the tournament.
     */
    public Document getRegisteredPlayerTournamentID(MongoCollection<Document> RRcollection, String playerName) {
        return performGeneralSearch(RRcollection, "players", playerName);
    }

    /**
     * Pushes game submission information for a running tournament.
     *
     * @param RRcollection The MongoDB collection for tournament data.
     * @param gameInfo     The information about the game.
     * @param tournamentID The ID of the tournament.
     */
    public void pushGameSubmissionForRunningTournament(MongoCollection<Document> RRcollection, String gameInfo,
            String tournamentID) {
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.push("game-submissions", gameInfo));
    }

    /**
     * Retrieves the game submissions for a running tournament.
     *
     * @param RRcollection The MongoDB collection for tournament data.
     * @param tournamentID The ID of the tournament.
     * @return A list of game submissions.
     * @throws RoundRobinException If the tournament ID is invalid.
     */
    public List<String> getGameSubmissionsFromRunningTournament(MongoCollection<Document> RRcollection,
            String tournamentID) throws RoundRobinException {
        Document tournamentDoc = getTournamentIDDoc(RRcollection, tournamentID);

        if (tournamentDoc != null) {
            String tournamentId = tournamentDoc.getString("tournamentId");
            System.out.println("First Active Tournament ID: " + tournamentId);
            return tournamentDoc.getList("game-submissions", String.class);
        } else {
            throw new RoundRobinException("Invalid Tournament ID!");
        }
    }

    /**
     * Pushes the player score to the leaderboard.
     *
     * @param username           The username of the player.
     * @param RRplayercollection The MongoDB collection for player data.
     * @param RRcollection       The MongoDB collection for tournament data.
     * @param platform           The platform on which the game was played.
     * @param newScore           The new score to be added.
     * @param tid                The ID of the tournament.
     */
    public void pushPlayerScore(String username, MongoCollection<Document> RRplayercollection,
            MongoCollection<Document> RRcollection, Platform platform, double newScore, String tid) {
        Document searchAmb = null;
        LeaderboardCalculator calculator = new LeaderboardCalculator(RRcollection);

        switch (platform) {
            case LICHESS -> searchAmb = performGeneralSearch(RRplayercollection, "Lichessname", username);
            case CHESSCOM -> searchAmb = performGeneralSearch(RRplayercollection, "Chesscomname", username);
            case DISCORD -> searchAmb = performGeneralSearch(RRplayercollection, "Discordname", username);
        }

        calculator.updatePlayerScore(tid, searchAmb.getString("Discordname"), newScore);
        System.out.println("Successfully updated the player " + username + " Score by: " + newScore);
    }

    /**
     * Pushes the cross table list to the tournament document.
     *
     * @param RRcollection   The MongoDB collection for tournament data.
     * @param crosstableList The cross table list to be added.
     * @param tournamentID   The ID of the tournament.
     */
    public void pushCrossTableList(MongoCollection<Document> RRcollection, ArrayList<ArrayList<String>> crosstableList,
            String tournamentID) {
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("crosstable-data", crosstableList));
    }
}
