package com.serverless.roundrobin;

import java.util.ArrayList;
import java.util.List;

/**
 * This class manages the round-robin pairing for a tournament.
 */
public class RoundRobin {
    private final List<String> players;
    private final String tournamentName;
    private final String desc;
    private final PairingBuilder builder = new PairingBuilder();

    /**
     * Constructor for RoundRobin.
     * @param players List of players.
     * @param name Name of the tournament.
     * @param desc Description of the tournament.
     */
    public RoundRobin(List<String> players, String name, String desc){
        this.players = players;
        this.tournamentName = name;
        this.desc = desc;
    }

    /**
     * Generates the round-robin pairs for the tournament.
     * @return The list of round-robin pairs.
     * @throws RoundRobinException If the number of players is less than 3.
     */
    public List<List<String>> generateRoundRobinPairs() throws RoundRobinException {

            int numPlayers = players.size();

            if (numPlayers <= 3) {
                throw new RoundRobinException("Invalid Player size! Please ask for more players to register!");
            }

            if (numPlayers % 2 != 0) {
                players.add("No One (Bye given)");
                numPlayers++;
            }

            List<List<String>> rounds = new ArrayList<>();

            for (int round = 0; round < numPlayers - 1; round++) {
                List<String> roundPairs = new ArrayList<>();
                for (int i = 0; i < numPlayers / 2; i++) {
                    int player1 = (round + i) % (numPlayers - 1);
                    int player2 = (numPlayers - 1 - i + round) % (numPlayers - 1);

                    if (i == 0) {
                        player2 = numPlayers - 1;
                    }

                    String player1Name = players.get(player1);
                    String player2Name = players.get(player2);

                    if (!player1Name.equals("No One (Bye given)") && !player2Name.equals("No One (Bye given)")) {
                        String white, black;
                        if (round % 2 == 0) {
                            white = player1Name;
                            black = player2Name;
                        } else {
                            white = player2Name;
                            black = player1Name;
                        }

                        roundPairs.add(builder.buildPairingNormal(white, black));

                    } else if (player1Name.equals("No One (Bye given)")) {
                        roundPairs.add(player2Name + " has a bye");
                    } else {
                        roundPairs.add(player1Name + " has a bye");
                    }
                }
                rounds.add(roundPairs);
            }
            return rounds;

    }

    /**
     * Generates the string representation of the round-robin pairings.
     * @return The string representation of the round-robin pairings.
     * @throws RoundRobinException If the number of players is less than 3.
     */
    private String getPairingsString() throws RoundRobinException {

        StringBuilder builder = new StringBuilder();

        List<List<String>> rds = generateRoundRobinPairs();

        builder.append("**Tournament Name:** ").append(tournamentName).append("\n\n").append("**Description:** ").append(desc).append("\n\n");

        for(int r = 0; r < rds.size(); r++){
            builder.append("**Round ").append(r + 1).append(":** ").append(rds.get(r)).append("\n\n");
        }
        return builder.toString();
    }


    /**
     * Creates the tournament pairings.
     * @return The string representation of the tournament pairings.
     * @throws RoundRobinException If the number of players is less than 3.
     */
    public String createTournamentPairings() throws RoundRobinException {
        return getPairingsString();
    }
}
