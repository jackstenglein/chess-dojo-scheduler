package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import com.serverless.game.GameState;
import com.serverless.game.Platform;
import org.bson.Document;

/**
 * This class handles updating player scores and submitting game URLs for a
 * round-robin tournament.
 */
public class UpdatePlayerScores {

    private final RoundRobinManager actions = new RoundRobinManager();

    /**
     * Default constructor for UpdatePlayerScores.
     */
    public UpdatePlayerScores() {
    }

    /**
     * Updates the scores of two players based on the game state.
     *
     * @param player1username    The username of the first player.
     * @param player2username    The username of the second player.
     * @param platform           The platform on which the game was played.
     * @param state              The state of the game (e.g., WHITE_WON, BLACK_WON,
     *                           DRAW).
     * @param RRplayercollection The MongoDB collection for player data.
     * @param RRcollection       The MongoDB collection for tournament data.
     * @param tournamentID       The ID of the tournament.
     * @throws RoundRobinException If the tournament ID is invalid.
     */
    public void updatePlayerScore(String player1username, String player2username, Platform platform, GameState state,
            MongoCollection<Document> RRplayercollection, MongoCollection<Document> RRcollection, String tournamentID)
            throws RoundRobinException {
        Document activeTournament = actions.getTournamentIDDoc(RRcollection, tournamentID);
        if (activeTournament == null) {
            throw new RoundRobinException("Invalid Tournament ID!");
        }

        double player1Score = 0.0, player2Score = 0.0;
        switch (state) {
            case WHITE_WON, BLACK_LOST -> player1Score = 1.0;
            case BLACK_WON, WHITE_LOST -> player2Score = 1.0;
            case DRAW -> {
                player1Score = 0.5;
                player2Score = 0.5;
            }
        }
        actions.pushPlayerScore(player1username, RRplayercollection, RRcollection, platform, player1Score,
                tournamentID);
        actions.pushPlayerScore(player2username, RRplayercollection, RRcollection, platform, player2Score,
                tournamentID);
    }

    /**
     * Submits a game URL for a running tournament.
     *
     * @param RRcollection The MongoDB collection for tournament data.
     * @param gameURL      The URL of the game to be submitted.
     * @param tournamentID The ID of the tournament.
     */
    public void submitGameURL(MongoCollection<Document> RRcollection, String gameURL, String tournamentID) {
        actions.pushGameSubmissionForRunningTournament(RRcollection, gameURL, tournamentID);
    }
}