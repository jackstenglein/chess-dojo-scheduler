package com.serverless.game;

import com.mongodb.client.MongoCollection;
import com.serverless.roundrobin.RoundRobinCrosstable;
import com.serverless.roundrobin.UpdatePlayerScores;
import io.github.sornerol.chess.pubapi.client.PlayerClient;
import io.github.sornerol.chess.pubapi.domain.game.ArchiveGame;
import org.bson.Document;

import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * This class implements the strategy for calculating the result of a game
 * played on Chess.com.
 */
public class ChessComStrategy implements CalculateResultStrategy {

    private final Platform platform = Platform.CHESSCOM;
    private final String gameURL;
    private final String player;
    private final UpdatePlayerScores updateAction;
    private final MongoCollection<Document> RRplayercollection;
    private final MongoCollection<Document> RRcollection;
    private final RoundRobinCrosstable crosstableGen;
    private final String tournamentID;
    private final Date startDate;
    private final Date endDate;

    /**
     * Creates a new ChessComStrategy object.
     * 
     * @param gameURL            The URL of the game.
     * @param player             The player name.
     * @param rRplayercollection The MongoDB collection for player data.
     * @param rRcollection       The MongoDB collection for tournament data.
     * @param tournamentID       The ID of the tournament.
     * @param start              The start date of the tournament.
     * @param end                The end date of the tournament.
     */
    public ChessComStrategy(String gameURL, String player, MongoCollection<Document> rRplayercollection,
            MongoCollection<Document> rRcollection, String tournamentID, Date start, Date end) {
        this.gameURL = gameURL;
        this.player = player;
        this.updateAction = new UpdatePlayerScores();
        this.RRplayercollection = rRplayercollection;
        this.RRcollection = rRcollection;
        this.tournamentID = tournamentID;
        this.startDate = start;
        this.endDate = end;
        this.crosstableGen = new RoundRobinCrosstable(RRcollection, RRplayercollection, tournamentID);
    }

    /**
     * Calculates the result of the game played on Chess.com.
     * This method retrieves the game result from the Chess.com API and updates the
     * player scores accordingly
     */
    @Override
    public void calculateGameResult() {
        PlayerClient client = new PlayerClient();
        Calendar calendar = Calendar.getInstance();
        calendar.setTime(startDate);
        calendar.add(Calendar.MONTH, 1);
        Date futureDate = calendar.getTime();
        Date[] duration = { startDate, futureDate, endDate };

        for (Date gameDate : duration) {
            try {
                Calendar cal = Calendar.getInstance();
                cal.setTime(gameDate);
                List<ArchiveGame> games = client
                        .getMonthlyArchiveForPlayer(player, cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1)
                        .getGames().stream().filter(s -> s.getUrl().equalsIgnoreCase(gameURL)).toList();

                if (!games.isEmpty()) {
                    ArchiveGame game = games.getFirst();
                    String gameResult = game.getPgn();
                    String player1 = game.getWhite().getUsername().toLowerCase().trim();
                    String player2 = game.getBlack().getUsername().toLowerCase().trim();
                    GameState gameState = switch (extractResult(gameResult)) {
                        case "1-0" -> GameState.WHITE_WON;
                        case "0-1" -> GameState.BLACK_WON;
                        case "1/2-1/2" -> GameState.DRAW;
                        default -> null;
                    };

                    updateAction.updatePlayerScore(player1, player2, platform, gameState, RRplayercollection,
                            RRcollection, tournamentID);
                    crosstableGen.updateCrossTableScores(player1, player2, gameState, platform);
                    updateAction.submitGameURL(RRcollection, gameURL, tournamentID);
                    break;
                }
            } catch (Exception e) {
                System.out.println(e.getMessage());
            }
        }
    }

    /**
     * Extracts the result of the game from the PGN.
     * 
     * @param pgn The PGN of the game.
     * @return The result of the game.
     */
    public String extractResult(String pgn) {
        Matcher matcher = Pattern.compile("\\[Result \"([^\"]+)\"\\]").matcher(pgn);
        return matcher.find() ? matcher.group(1) : null;
    }
}
