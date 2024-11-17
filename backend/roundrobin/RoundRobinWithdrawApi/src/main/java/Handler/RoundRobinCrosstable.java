package Handler;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * The type Round robin crosstable.
 */
public class RoundRobinCrosstable {

    private final WithdrawManager actions = new WithdrawManager();
    private final MongoCollection<Document> RRtournament;
    private MongoCollection<Document> RRplayercollection;

    private final String tournamentID;

    /**
     * Instantiates a new Round robin crosstable.
     *
     * @param RRtournament       the r rtournament
     * @param RRplayercollection the r rplayercollection
     * @param tournamentID       the tournament id
     */
    public RoundRobinCrosstable(MongoCollection<Document> RRtournament, MongoCollection<Document> RRplayercollection, String tournamentID) {
        this.RRtournament = RRtournament;
        this.RRplayercollection = RRplayercollection;
        this.tournamentID = tournamentID;
    }


    /**
     * Get tournament crosstable list.
     *
     * @return the list
     */
    public List<ArrayList<String>> getTournamentCrosstable(){

        List<?> rawList = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("crosstable-data", ArrayList.class);
        List<ArrayList<String>> tournamentCrosstable = new ArrayList<>();

        for (Object obj : rawList) {
            if (obj instanceof ArrayList<?>) {
                ArrayList<String> innerList = new ArrayList<>();
                for (Object innerObj : (ArrayList<?>) obj) {
                    if (innerObj instanceof String) {
                        innerList.add((String) innerObj);
                    } else {
                        throw new IllegalArgumentException("Expected inner list of strings but found: " + innerObj.getClass().getName());
                    }
                }
                tournamentCrosstable.add(innerList);
            } else {
                throw new IllegalArgumentException("Expected list of lists but found: " + obj.getClass().getName());
            }
        }

        return tournamentCrosstable;
    }


    /**
     * Update cross table scores.
     *
     * @param player1  the player 1
     * @param player2  the player 2
     * @param state    the state
     * @param platform the platform
     */
    public void updateCrossTableScores(String player1, String player2, GameState state, Platform platform){
        List<ArrayList<String>> actualList = getTournamentCrosstable();
        String player1Discord;
        String player2Discord;


        player1Discord = actions.performGeneralSearch(this.RRplayercollection, platform.toString(), player1).getString("Discordname");
        player2Discord = actions.performGeneralSearch(this.RRplayercollection, platform.toString(), player2).getString("Discordname");

        List<String> players = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("players", String.class);

        if(!players.contains(player1Discord) || !players.contains(player2Discord) || state == null || (player1.equalsIgnoreCase(player2))){
            System.out.println("Invalid player names! Can't update the cross table!");
            return;
        }

        if(!(players.size() < 3)){

            int player1Index = players.indexOf(player1Discord);
            int player2Index = players.indexOf(player2Discord);

            switch (state){
                case DRAW -> {
                    actualList.get(player1Index).set(player2Index, "1/2");
                    actualList.get(player2Index).set(player1Index, "1/2");
                }
                case PLAYER_ONE_WON, PLAYER_TWO_LOST -> {
                    actualList.get(player1Index).set(player2Index, "1");
                    actualList.get(player2Index).set(player1Index, "0");
                }

                case PLAYER_ONE_LOST, PLAYER_TWO_WON -> {
                    actualList.get(player1Index).set(player2Index, "0");
                    actualList.get(player2Index).set(player1Index, "1");
                }
            }


            StringBuilder builder = new StringBuilder();
            final int columnWidth = 12;

            builder.append(String.format("%-" + columnWidth + "s", ""));
            for (int i = 1; i <= players.size(); i++) {
                builder.append(String.format("%-" + columnWidth + "s", "|" + i + "|"));
            }
            builder.append("\n");

            // Add rows for each player
            for (int i = 0; i < players.size(); i++) {
                builder.append(String.format("%-" + columnWidth + "s", players.get(i)));
                for (int j = 0; j < players.size(); j++) {
                    if (i == j) {
                        builder.append(String.format("%-" + columnWidth + "s", "X"));
                    } else {
                        builder.append(String.format("%-" + columnWidth + "s", actualList.get(i).get(j)));
                    }
                }
                builder.append("\n");
            }

            System.out.println(builder.toString());
            actions.pushCrosstableString(RRtournament, builder.toString() , tournamentID);
            actions.pushCrossTableList(RRtournament, (ArrayList<ArrayList<String>>) actualList, tournamentID);


        }else{
            System.out.println("Can't update the player scores on crosstable!");

        }



    }



}

