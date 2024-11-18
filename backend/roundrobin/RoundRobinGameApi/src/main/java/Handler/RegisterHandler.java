package Handler;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

import java.io.IOException;

/**
 * The type Register handler.
 */
public class RegisterHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final GameManager actions = new GameManager();
    private final SubmitGameContext context = new SubmitGameContext();
    private final String Discordname;
    private final String dojoUsername;
    private final String gameURL;


    /**
     * Instantiates a new Register handler.
     *
     * @param rRplayerCollection the r rplayer collection
     * @param rRcollection       the r rcollection
     * @param discordname        the discordname
     * @param dojoUsername       the dojo username
     * @param gameURL            the game url
     */
    public RegisterHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection, String discordname, String dojoUsername, String gameURL) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;
        Discordname = discordname;
        this.dojoUsername = dojoUsername;
        this.gameURL = gameURL;
    }


    /**
     * Handle game request string.
     *
     * @return the string
     */
    public String handleGameRequest(){

        try{

            String player1;
            String discord1 = Discordname.equalsIgnoreCase("null") ? dojoUsername : Discordname;
            Platform platform = Platform.fromURL(gameURL);

            if(platform == Platform.CHESSCOM){
                player1 = actions.performGeneralSearch(RRplayerCollection, "Discordname", discord1).getString(platform.toString());
            }else if (platform == Platform.LICHESS){
                player1 = actions.performGeneralSearch(RRplayerCollection, "Discordname", discord1).getString(platform.toString());
            }else {
                return "Invalid Game URL!";
            }

            Document getRegisteredTournamentID = actions.getRegisteredPlayerTournamentID(RRcollection, player1.toLowerCase().trim());

            if(getRegisteredTournamentID != null){

                String tournamentID = getRegisteredTournamentID.getString("tournamentId");

                System.out.println(tournamentID);

                if(actions.getGameSubmissionsFromRunningTournament(RRcollection, tournamentID).contains(gameURL)){
                    return "This game has already been submitted to the system! Please play other games of rounds and submit those!";
                }

                switch (platform){
                    case LICHESS -> context.submitGame(new LichessStrategy(gameURL, RRplayerCollection, RRcollection, tournamentID));

                    case CHESSCOM -> context.submitGame(new ChessComStrategy(gameURL, player1.toLowerCase().trim(), RRplayerCollection, RRcollection, tournamentID));
                }

                LeaderboardCalculator calculator = new LeaderboardCalculator(RRcollection, RRplayerCollection);
                calculator.calculateLeaderboard(tournamentID);

                return  "Successfully computed the scores for the game URL: " + gameURL;

            }else{
                return "The player registration not found! You can not submit a game if you have not registered!";
            }

        }catch (RoundRobinException e){
            return e.getMessage();
        }
    }














}
