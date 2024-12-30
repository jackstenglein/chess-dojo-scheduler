package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import com.serverless.game.GameState;
import com.serverless.game.Platform;
import org.bson.Document;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * This class manages the round-robin cross table for a tournament.
 */
public class RoundRobinCrosstable {

    private final RoundRobinManager actions = new RoundRobinManager();
    private final MongoCollection<Document> RRtournament;
    private final MongoCollection<Document> RRplayercollection;
    private final String tournamentID;
    private static final int COLUMN_WIDTH = 12;

    /**
     * Constructor for RoundRobinCrosstable.
     *
     * @param RRtournament       MongoDB collection for the tournament.
     * @param RRplayercollection MongoDB collection for the players.
     * @param tournamentID       ID of the tournament.
     */
    public RoundRobinCrosstable(MongoCollection<Document> RRtournament, MongoCollection<Document> RRplayercollection,
            String tournamentID) {
        this.RRtournament = RRtournament;
        this.RRplayercollection = RRplayercollection;
        this.tournamentID = tournamentID;
    }

    /**
     * Builds the header of the cross table.
     *
     * @param builder StringBuilder to append the header.
     * @param players List of player names.
     */
    private void buildCrossTableHeader(StringBuilder builder, List<String> players) {
        builder.append(String.format("%-" + COLUMN_WIDTH + "s", ""));
        for (int i = 1; i <= players.size(); i++) {
            builder.append(String.format("%-" + COLUMN_WIDTH + "s", "|" + i + "|"));
        }
        builder.append("\n");
    }

    /**
     * Builds the body of the cross table.
     *
     * @param builder    StringBuilder to append the body.
     * @param players    List of player names.
     * @param crosstable 2D array representing the cross table.
     */
    private void buildCrossTableBody(StringBuilder builder, List<String> players, String[][] crosstable) {
        for (int i = 0; i < players.size(); i++) {
            builder.append(String.format("%-" + COLUMN_WIDTH + "s", players.get(i)));
            for (int j = 0; j < players.size(); j++) {
                crosstable[i][j] = (i == j) ? "X" : "-";
                builder.append(String.format("%-" + COLUMN_WIDTH + "s", crosstable[i][j]));
            }
            builder.append("\n");
        }
    }

    /**
     * Builds the body of the cross table using an ArrayList.
     *
     * @param builder    StringBuilder to append the body.
     * @param players    List of player names.
     * @param actualList List of ArrayLists representing the cross table.
     */
    private void buildCrossTableBodyArrayList(StringBuilder builder, List<String> players,
            List<ArrayList<String>> actualList) {
        for (int i = 0; i < players.size(); i++) {
            builder.append(String.format("%-" + COLUMN_WIDTH + "s", players.get(i)));
            for (int j = 0; j < players.size(); j++) {
                builder.append(String.format("%-" + COLUMN_WIDTH + "s", (i == j) ? "X" : actualList.get(i).get(j)));
            }
            builder.append("\n");
        }
    }

    /**
     * Creates the cross table for the tournament.
     */
    public void createCrossTable() {
        List<String> players = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("players", String.class);

        if (players.size() >= 3) {
            String[][] crosstable = new String[players.size()][players.size()];
            StringBuilder builder = new StringBuilder();
            buildCrossTableHeader(builder, players);
            buildCrossTableBody(builder, players, crosstable);

            ArrayList<ArrayList<String>> crosstableList = new ArrayList<>();
            for (String[] row : crosstable) {
                crosstableList.add(new ArrayList<>(Arrays.asList(row)));
            }
            System.out.println(builder.toString());
            actions.pushCrossTableList(RRtournament, crosstableList, tournamentID);
        } else {
            System.out.println("Cross table can't be generated!");
        }
    }

    /**
     * Retrieves the cross table for the tournament.
     *
     * @return List of ArrayLists representing the cross table.
     */
    private List<ArrayList<String>> getTournamentCrosstable() {
        List<?> rawList = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("crosstable-data",
                ArrayList.class);
        List<ArrayList<String>> tournamentCrosstable = new ArrayList<>();

        for (Object obj : rawList) {
            ArrayList<String> innerList = new ArrayList<>();
            for (Object innerObj : (ArrayList<?>) obj) {
                innerList.add((String) innerObj);
            }
            tournamentCrosstable.add(innerList);
        }

        return tournamentCrosstable;
    }

    /**
     * Updates the scores in the cross table based on the game state.
     *
     * @param player1  Name of the first player.
     * @param player2  Name of the second player.
     * @param state    State of the game.
     * @param platform Platform on which the game was played.
     */
    public void updateCrossTableScores(String player1, String player2, GameState state, Platform platform) {
        List<ArrayList<String>> actualList = getTournamentCrosstable();
        String player1Discord = actions.performGeneralSearch(RRplayercollection, platform.getPlayerField(), player1)
                .getString("Discordname");
        String player2Discord = actions.performGeneralSearch(RRplayercollection, platform.getPlayerField(), player2)
                .getString("Discordname");
        List<String> players = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("players", String.class);

        if (!players.contains(player1Discord) || !players.contains(player2Discord) || state == null
                || player1.equalsIgnoreCase(player2)) {
            System.out.println("Invalid player names! Can't update the cross table!");
            return;
        }

        if (players.size() >= 3) {
            int player1Index = players.indexOf(player1Discord);
            int player2Index = players.indexOf(player2Discord);

            switch (state) {
                case DRAW -> {
                    actualList.get(player1Index).set(player2Index, "1/2");
                    actualList.get(player2Index).set(player1Index, "1/2");
                }
                case WHITE_WON, BLACK_LOST -> {
                    actualList.get(player1Index).set(player2Index, "1");
                    actualList.get(player2Index).set(player1Index, "0");
                }
                case BLACK_WON, WHITE_LOST -> {
                    actualList.get(player1Index).set(player2Index, "0");
                    actualList.get(player2Index).set(player1Index, "1");
                }
            }

            StringBuilder builder = new StringBuilder();
            buildCrossTableHeader(builder, players);
            buildCrossTableBodyArrayList(builder, players, actualList);

            for (int i = 0; i < players.size(); i++) {
                builder.append(String.format("%-" + COLUMN_WIDTH + "s", players.get(i)));
                for (int j = 0; j < players.size(); j++) {
                    builder.append(String.format("%-" + COLUMN_WIDTH + "s", (i == j) ? "X" : actualList.get(i).get(j)));
                }
                builder.append("\n");
            }

            System.out.println(builder.toString());
            actions.pushCrossTableList(RRtournament, (ArrayList<ArrayList<String>>) actualList, tournamentID);
        } else {
            System.out.println("Can't update the player scores on crosstable!");
        }
    }

    /**
     * Withdraws a player from the tournament.
     *
     * @param currentSize Current number of players.
     * @param playerIndex Index of the player to withdraw.
     * @throws RoundRobinException if the base limit of players is reached.
     */
    public void withdrawPlayer(int currentSize, int playerIndex) throws RoundRobinException {
        if (currentSize <= 3) {
            throw new RoundRobinException(
                    "Can't withdraw player as base limit is reached, please withdraw after a while");
        }

        List<ArrayList<String>> actualList = getTournamentCrosstable();
        actualList.remove(playerIndex);
        for (ArrayList<String> sublist : actualList) {
            sublist.remove(playerIndex);
        }

        actions.pushCrossTableList(RRtournament, (ArrayList<ArrayList<String>>) actualList, tournamentID);
    }

    /**
     * Registers a new player in the tournament.
     */
    public void registerPlayer() {
        List<ArrayList<String>> actualList = getTournamentCrosstable();
        actualList.add(new ArrayList<>());

        for (ArrayList<String> sublist : actualList) {
            sublist.add("-");
        }

        actions.pushCrossTableList(RRtournament, (ArrayList<ArrayList<String>>) actualList, tournamentID);
    }
}