package com.serverless.game;

import com.mongodb.client.MongoCollection;
import com.serverless.roundrobin.LeaderboardCalculator;
import com.serverless.roundrobin.RoundRobinException;
import com.serverless.roundrobin.RoundRobinManager;
import org.bson.Document;

import java.io.IOException;

/**
 * This class handles the submission of a game to the round-robin tournament via
 * API.
 */
public class GameHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final RoundRobinManager actions = new RoundRobinManager();
    private final SubmitGameContext context = new SubmitGameContext();
    private final String discordName;
    private final String dojoUsername;
    private final String gameURL;

    /**
     * Constructor for GameHandler.
     * 
     * @param rRplayerCollection The MongoDB collection for player data.
     * @param rRcollection       The MongoDB collection for tournament data.
     * @param discordName        The Discord username of the player.
     * @param dojoUsername       The Dojo username of the player.
     * @param gameURL            The URL of the game to be submitted.
     */
    public GameHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection,
            String discordName, String dojoUsername, String gameURL) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;
        this.discordName = discordName;
        this.dojoUsername = dojoUsername;
        this.gameURL = gameURL;
    }

    /**
     * Handles the submission of a game to the round-robin tournament via the API.
     * 
     * @return The result of the game submission operation.
     */
    public String handleGameRequest() {
        try {
            if (dojoUsername.isEmpty()) {
                throw new IOException("Dojo username is a valid param");
            }

            String dbPlayerName = discordName.isEmpty() ? dojoUsername : discordName;
            Platform platform = Platform.fromURL(gameURL);

            if (platform == null) {
                return "Invalid game URL, games must be Lichess/Chess.com game";
            }

            String platformUsername = actions.performGeneralSearch(RRplayerCollection, "Discordname", dbPlayerName)
                    .getString(platform.getPlayerField());
            Document registeredTournament = actions.getRegisteredPlayerTournamentID(RRcollection, dbPlayerName);

            if (registeredTournament == null) {
                return "The player registration not found! You can not submit a game if you have not registered!";
            }

            String tournamentID = registeredTournament.getString("tournamentId");

            if (actions.getGameSubmissionsFromRunningTournament(RRcollection, tournamentID).contains(gameURL)) {
                return "This game has already been submitted to the system! Please play other games of rounds and submit those!";
            }

            switch (platform) {
                case LICHESS ->
                    context.submitGame(new LichessStrategy(gameURL, RRplayerCollection, RRcollection, tournamentID));
                case CHESSCOM -> context.submitGame(new ChessComStrategy(gameURL, platformUsername.toLowerCase().trim(),
                        RRplayerCollection, RRcollection, tournamentID, registeredTournament.getDate("startdate"),
                        registeredTournament.getDate("enddate")));
            }

            new LeaderboardCalculator(RRcollection).calculateAndUpdateLeaderboard(tournamentID);
            return "Successfully computed the scores for the game URL: " + gameURL;

        } catch (RoundRobinException | IOException e) {
            return e.getMessage();
        }
    }
}
