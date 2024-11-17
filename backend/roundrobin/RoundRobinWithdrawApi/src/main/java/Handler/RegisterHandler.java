package Handler;

import com.mongodb.client.MongoCollection;
import org.bson.Document;

/**
 * The type Register handler.
 */
public class RegisterHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final WithdrawManager actions = new WithdrawManager();
    private final String Discordname;
    private final String dojoUsername;


    /**
     * Instantiates a new Register handler.
     *
     * @param rRplayerCollection the r rplayer collection
     * @param rRcollection       the r rcollection
     * @param discordname        the discordname
     * @param dojoUsername       the dojo username
     */
    public RegisterHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection, String discordname, String dojoUsername) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;
        Discordname = discordname;
        this.dojoUsername = dojoUsername;
    }


    /**
     * Player withdraw string.
     *
     * @return the string
     */
    public String playerWithdraw(){

        try{
            String nonDiscordUser = Discordname.equalsIgnoreCase("null") ? dojoUsername : Discordname;
            Document getTournamentId = actions.getRegisteredPlayerTournamentID(RRcollection, nonDiscordUser);
            if(getTournamentId != null) {
                String tournamentId = getTournamentId.getString("tournamentId");
                actions.removePlayerToRunningTournament(nonDiscordUser, RRcollection, RRplayerCollection, tournamentId);
                return "Successfully withdrew the player: " + nonDiscordUser;
            }else{
                return "Player not found in active tournaments!";
            }

        } catch (Exception e) {
            return e.getMessage();
        }

    }





}
