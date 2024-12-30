package com.serverless.withdraw;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.serverless.register.RegisterManager;
import com.serverless.roundrobin.LeaderboardCalculator;
import com.serverless.roundrobin.RoundRobinCrosstable;
import com.serverless.roundrobin.RoundRobinException;
import com.serverless.roundrobin.RoundRobinManager;
import org.bson.Document;
import java.util.List;

/**
 * This class manages the withdrawal of players from a round-robin tournament.
 */
public class WithdrawManager {

    private final RoundRobinManager manager = new RoundRobinManager();

    /**
     * Retrieves the tournament document for a registered player based on their
     * name.
     *
     * @param RRcollection The MongoDB collection for tournament data.
     * @param playerName   The name of the player.
     * @return The document representing the tournament.
     */
    public Document getRegisteredPlayerTournamentID(MongoCollection<Document> RRcollection, String playerName) {
        return manager.getRegisteredPlayerTournamentID(RRcollection, playerName);
    }

    /**
     * Removes a player from a running tournament.
     *
     * @param playerUsername     The username of the player to be removed.
     * @param RRcollection       The MongoDB collection for tournament data.
     * @param RRplayercollection The MongoDB collection for player data.
     * @param tournamentID       The ID of the tournament.
     * @throws RoundRobinException If the tournament ID is invalid.
     */
    public void removePlayerToRunningTournament(String playerUsername, MongoCollection<Document> RRcollection,
            MongoCollection<Document> RRplayercollection, String tournamentID) throws RoundRobinException {
        Document activeTournament = manager.getTournamentIDDoc(RRcollection, tournamentID);

        if (activeTournament == null) {
            throw new RoundRobinException("No Round Robin found internal error!");
        }

        String tournamentId = activeTournament.getString("tournamentId");
        System.out.println("First Active Eligible Tournament ID: " + tournamentId);
        withdrawPlayerToTournamentSimpleAlgo(activeTournament, RRcollection, RRplayercollection, tournamentID,
                playerUsername);
    }

    /**
     * Withdraws a player from the tournament using a simplified algorithm.
     *
     * @param tourneyID          The document representing the tournament.
     * @param RRcollection       The MongoDB collection for tournament data.
     * @param RRplayercollection The MongoDB collection for player data.
     * @param tournamentID       The ID of the tournament.
     * @param username           The username of the player to be withdrawn.
     * @throws RoundRobinException If the tournament ID is invalid.
     */
    public void withdrawPlayerToTournamentSimpleAlgo(Document tourneyID, MongoCollection<Document> RRcollection,
            MongoCollection<Document> RRplayercollection, String tournamentID, String username)
            throws RoundRobinException {
        List<String> currPlayers = tourneyID.getList("players", String.class);
        RoundRobinCrosstable crosstableManager = new RoundRobinCrosstable(RRcollection, RRplayercollection,
                tournamentID);
        LeaderboardCalculator leaderboardManager = new LeaderboardCalculator(RRcollection);
        RegisterManager registerManager = new RegisterManager();

        if (!tourneyID.getBoolean("waiting")) {
            crosstableManager.withdrawPlayer(currPlayers.size(), currPlayers.indexOf(username));
            leaderboardManager.removePlayer(tournamentID, username);
            currPlayers.remove(username);
            leaderboardManager.giveFreeByesOnWithdraw(tournamentID);
            leaderboardManager.calculateAndUpdateLeaderboard(tournamentID);
        }

        RRcollection.updateOne(new Document("tournamentId", tournamentID), Updates.pull("players", username));
        RRcollection.updateOne(new Document("tournamentId", tournamentID), Updates.pull("leaderboard", username));

        if (!tourneyID.getBoolean("waiting")) {
            String pairs = registerManager.getRoundRobinPairingsInternally(RRcollection, RRplayercollection,
                    tournamentID);
            System.out.println(pairs);
        }
    }
}
