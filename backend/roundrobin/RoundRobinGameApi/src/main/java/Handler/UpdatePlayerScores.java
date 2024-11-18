package Handler;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

/**
 * The type Update player scores.
 */
public class UpdatePlayerScores {

    private final GameManager actions = new GameManager();

    /**
     * Instantiates a new Update player scores.
     */
    public UpdatePlayerScores(){

    }


    /**
     * Update player score.
     *
     * @param player1username    the player 1 username
     * @param player2username    the player 2 username
     * @param platform           the platform
     * @param state              the state
     * @param RRplayercollection the r rplayercollection
     * @param RRcollection       the r rcollection
     * @param tournamentID       the tournament id
     * @throws RoundRobinException the round robin exception
     */
    public void updatePlayerScore(String player1username, String player2username, Platform platform, GameState state, MongoCollection<Document> RRplayercollection, MongoCollection<Document> RRcollection, String tournamentID) throws RoundRobinException {

        Document activeTournament = actions.getTournamentIDDoc(RRcollection, tournamentID);

        if(activeTournament == null){
            throw new RoundRobinException("Invalid Tournament ID!");
        }

        boolean foundPlayer1 = actions.searchTheAmbiguousUsername(player1username, platform, RRplayercollection);
        boolean foundPlayer2 = actions.searchTheAmbiguousUsername(player2username, platform, RRplayercollection);

        if(!foundPlayer1){
            String format = actions.performGeneralSearch(RRplayercollection, platform.toString(), player1username).getString("Discordid");
            throw new RoundRobinException("Player: " + "<@" + format + ">" + "on Platform: " + platform.getName() + " has not verified their account, thus I abort this request sorry.");
        }

        if(!foundPlayer2){
            String format = actions.performGeneralSearch(RRplayercollection, platform.toString(), player1username).getString("Discordid");
            throw new RoundRobinException("Player: " + "<@" + format + ">"  + "on Platform: " + platform.getName() + " has not verified their account, thus I abort this request sorry.");
        }

        switch (state){
            case PLAYER_ONE_WON, PLAYER_TWO_LOST -> {
                actions.pushPlayerScore(player1username, RRplayercollection, platform, 1.0);
                actions.pushPlayerScore(player2username, RRplayercollection, platform, 0.0);
            }
            case PLAYER_ONE_LOST, PLAYER_TWO_WON -> {
                actions.pushPlayerScore(player1username, RRplayercollection, platform, 0.0);
                actions.pushPlayerScore(player2username, RRplayercollection, platform, 1.0);
            }
            case DRAW -> {
                actions.pushPlayerScore(player1username, RRplayercollection, platform, 0.5);
                actions.pushPlayerScore(player2username, RRplayercollection, platform, 0.5);
            }
        }



    }



    /**
     * Submit game url.
     *
     * @param RRcollection the r rcollection
     * @param gameURL      the game url
     * @param tournamentID the tournament id
     */
    public void submitGameURL(MongoCollection<Document> RRcollection, String gameURL, String tournamentID){
        actions.pushGameSubmissionForRunningTournament(RRcollection, gameURL, tournamentID);
    }


}
