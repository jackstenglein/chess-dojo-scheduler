package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import com.serverless.game.GameState;
import com.serverless.game.Platform;
import org.bson.Document;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class RoundRobinCrosstable {

    private final RoundRobinManager actions = new RoundRobinManager();
    private final MongoCollection<Document> RRtournament;
    private MongoCollection<Document> RRplayercollection;

    private final String tournamentID;

    public RoundRobinCrosstable(MongoCollection<Document> RRtournament, MongoCollection<Document> RRplayercollection, String tournamentID) {
        this.RRtournament = RRtournament;
        this.RRplayercollection = RRplayercollection;
        this.tournamentID = tournamentID;
    }


    public void createCrossTable() {
        List<String> players = actions.getTournamentIDDoc(RRtournament, tournamentID).getList("players", String.class);

        if (!players.isEmpty() && !(players.size() < 3)) {
            final int columnWidth = 12;
            String[][] crosstable = new String[players.size()][players.size()];
            StringBuilder builder = new StringBuilder();

            builder.append(String.format("%-" + columnWidth + "s", ""));
            for (int i = 1; i <= players.size(); i++) {
                builder.append(String.format("%-" + columnWidth + "s", "|" + i + "|"));
            }
            builder.append("\n");

            for (int i = 0; i < players.size(); i++) {
                builder.append(String.format("%-" + columnWidth + "s", players.get(i)));
                for (int j = 0; j < players.size(); j++) {
                    if (i == j) {
                        crosstable[i][j] = "X";
                    } else {
                        crosstable[i][j] = "-";
                    }
                    builder.append(String.format("%-" + columnWidth + "s", crosstable[i][j]));
                }
                builder.append("\n");
            }

            ArrayList<ArrayList<String>> crosstableList = new ArrayList<>();
            for (String[] strings : crosstable) {
                ArrayList<String> rowList = new ArrayList<>(Arrays.asList(strings));
                crosstableList.add(rowList);
            }

            System.out.println(builder.toString());

            actions.pushCrosstableString(RRtournament, builder.toString(), tournamentID);
            actions.pushCrossTableList(RRtournament, crosstableList, tournamentID);
        } else {
            System.out.println("Cross table can't be generated!");
        }
    }

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
                case WHITE_WON, BLACK_LOST -> {
                    actualList.get(player1Index).set(player2Index, "1");
                    actualList.get(player2Index).set(player1Index, "0");
                }

                case BLACK_WON , WHITE_LOST -> {
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

