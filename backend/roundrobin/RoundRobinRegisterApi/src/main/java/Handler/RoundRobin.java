package Handler;



import chariot.Client;
import com.mongodb.client.MongoCollection;
import org.bson.Document;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Random;

/**
 * The type Round robin.
 */
public class RoundRobin {
    private final List<String> players;
    private final String tournamentName;
    private final String desc;
    private final int gameTimeControl;
    private final int gameTimeControlIncrement;
    private final PairGame pairings = new PairGame();
    private final CohortRange cohortRange;
    private final boolean ENABLE_AUTO_CHALLENGE_URL;
    private final Client client;
    private final PairingBuilder builder = new PairingBuilder();
    private final Boolean isPairingBasedOnRoundNumbers = true;
    private HashMap<String, String> mapper = new HashMap<>();
    private final MongoCollection<Document> RRplayercollection;


    /**
     * Instantiates a new Round robin.
     *
     * @param players                the players
     * @param name                   the name
     * @param desc                   the desc
     * @param client                 the client
     * @param cohort                 the cohort
     * @param enableAutoChallengeUrl the enable auto challenge url
     */
    public RoundRobin(List<String> players, String name, String desc, Client client, CohortRange cohort, boolean enableAutoChallengeUrl, MongoCollection<Document> RRplayercollection){
        this.players = players;
        this.tournamentName = name;
        this.desc = desc;
        this.gameTimeControl = cohort.getTimeControl();
        this.gameTimeControlIncrement = cohort.getTimeIncrement();
        this.client = client;
        ENABLE_AUTO_CHALLENGE_URL = enableAutoChallengeUrl;
        this.cohortRange = cohort;
        this.RRplayercollection = RRplayercollection;
    }

    /**
     * Gets tournament name.
     *
     * @return the tournament name
     */
    public String getTournamentName() {
        return tournamentName;
    }

    /**
     * Gets desc.
     *
     * @return the desc
     */
    public String getDesc() {
        return desc;
    }

    /**
     * Gets game time control.
     *
     * @return the game time control
     */
    public int getGameTimeControl() {
        return gameTimeControl;
    }

    /**
     * Gets game time control increment.
     *
     * @return the game time control increment
     */
    public int getGameTimeControlIncrement() {
        return gameTimeControlIncrement;
    }

    /**
     * Gets cohort range.
     *
     * @return the cohort range
     */
    public CohortRange getCohortRange() {
        return cohortRange;
    }

    /**
     * Get formatted time control string.
     *
     * @return the string
     */
    public String getFormattedTimeControl(){
        return getGameTimeControl() + "+" + getGameTimeControlIncrement();
    }


    /**
     * Generate round robin pairs list.
     *
     * @return the list
     * @throws RoundRobinException the round robin exception
     */
    public List<List<String>> generateRoundRobinPairs() throws RoundRobinException {
        if(isPairingBasedOnRoundNumbers){
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

                        if (ENABLE_AUTO_CHALLENGE_URL) {
                            String whiteli = "";
                            String blackli = "";

                            RegisterManager actions = new RegisterManager();
                            if(!mapper.containsKey(white) && !mapper.containsKey(black)) {
                                Document playerDoc1 = actions.performGeneralSearch(this.RRplayercollection, "Discordname", white);
                                Document playerDoc2 = actions.performGeneralSearch(this.RRplayercollection, "Discordname", black);

                                whiteli = playerDoc1.getString("Lichessname");
                                blackli = playerDoc2.getString("Lichessname");

                                mapper.put(white, whiteli);
                                mapper.put(black, blackli);
                                System.out.println(mapper);
                            }

                            if(mapper.get(white).equalsIgnoreCase("null") || mapper.get(black).equalsIgnoreCase("null")){
                                System.out.println("added");
                                roundPairs.add(builder.buildPairingForAutomatedURL(white, black, "Players must schedule games by themselves"));
                            }else{
                                System.out.println("added-normal");
                                roundPairs.add(builder.buildPairingForAutomatedURL(white, black, this.pairings.generatePairURL(gameTimeControl, gameTimeControlIncrement, client, tournamentName, mapper.get(white), mapper.get(black))));
                            }

                        } else {
                            roundPairs.add(builder.buildPairingNormal(white, black));
                        }
                    } else if (player1Name.equals("No One (Bye given)")) {
                        roundPairs.add(player2Name + " has a bye");
                    } else {
                        roundPairs.add(player1Name + " has a bye");
                    }
                }
                rounds.add(roundPairs);
            }
            return rounds;
        }else{
            return generateRandomRoundRobins();
        }
    }


    private List<List<String>> generateRandomRoundRobins() throws RoundRobinException {
        int numPlayers = players.size();

        if (numPlayers <= 3) {
            throw new RoundRobinException("Invalid Player size! Please ask for more players to register!");
        }

        if (numPlayers % 2 != 0) {
            players.add("No One (Bye given)");
            numPlayers++;
        }

        List<List<String>> rounds = new ArrayList<>();
        Random random = new Random();

        for (int round = 0; round < numPlayers - 1; round++) {
            List<String> roundPairs = new ArrayList<>();
            for (int i = 0; i < numPlayers / 2; i++) {
                int player1 = (round + i) % (numPlayers - 1);
                int player2 = (numPlayers - 1 - i + round) % (numPlayers - 1);

                if (i == 0) {
                    player2 = numPlayers - 1;
                }

                boolean player1IsWhite = random.nextBoolean();
                String white = player1IsWhite ? players.get(player1) : players.get(player2);
                String black = player1IsWhite ? players.get(player2) : players.get(player1);

                if (ENABLE_AUTO_CHALLENGE_URL) {
                    roundPairs.add(builder.buildPairingForAutomatedURL(white, black, this.pairings.generatePairURL(gameTimeControl, gameTimeControlIncrement, client, tournamentName, white, black)));
                } else {
                    roundPairs.add(builder.buildPairingNormal(white, black));
                }
            }
            rounds.add(roundPairs);
        }
        return rounds;
    }


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
     * Create tournament pairings string.
     *
     * @return the string
     * @throws RoundRobinException the round robin exception
     */
    public String createTournamentPairings() throws RoundRobinException {
        return getPairingsString();
    }
}
