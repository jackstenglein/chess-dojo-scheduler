package Handler;

import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * The type Withdraw manager.
 */
public class GameManager {


    /**
     * Get tournament id doc document.
     *
     * @param RRcollection the r rcollection
     * @param tournamentID the tournament id
     * @return the document
     */
    public Document getTournamentIDDoc (MongoCollection<Document> RRcollection, String tournamentID){
        Document query = new Document("tournamentId", tournamentID);
        return RRcollection.find(query).first();
    }

    /**
     * Perform general search document.
     *
     * @param collection the collection
     * @param key        the key
     * @param val        the val
     * @return the document
     */
    public Document performGeneralSearch( MongoCollection<Document> collection, String key, String val){
        Document query = new Document(key, val);
        return collection.find(query).first();
    }


    /**
     * Get registered player tournament id document.
     *
     * @param RRcollection the r rcollection
     * @param playerName   the player name
     * @return the document
     */
    public Document getRegisteredPlayerTournamentID(MongoCollection<Document> RRcollection, String playerName){
        Document query = null;

        query = new Document("players", playerName);
        return RRcollection.find(query).first();
    }

    /**
     * Search the ambiguous username boolean.
     *
     * @param username           the username
     * @param platform           the platform
     * @param RRplayercollection the r rplayercollection
     * @return the boolean
     */
    public boolean searchTheAmbiguousUsername(String username, Platform platform, MongoCollection<Document> RRplayercollection){

        switch (platform){
            case LICHESS -> {
                return performGeneralSearch(RRplayercollection, "Lichessname", username) != null;
            }
            case CHESSCOM -> {
                return performGeneralSearch(RRplayercollection, "Chesscomname", username) != null;
            }
            case DISCORD -> {
                return performGeneralSearch(RRplayercollection, "Discordname", username) != null;
            }
        }

        return false;
    }

    /**
     * Push game submission for running tournament.
     *
     * @param RRcollection the r rcollection
     * @param gameInfo     the game info
     * @param tournamentID the tournament id
     */
    public void pushGameSubmissionForRunningTournament(MongoCollection<Document> RRcollection, String gameInfo, String tournamentID){

        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.push("game-submissions", gameInfo)
        );


    }

    /**
     * Gets game submissions from running tournament.
     *
     * @param RRcollection the r rcollection
     * @param tournamentID the tournament id
     * @return the game submissions from running tournament
     * @throws RoundRobinException the round robin exception
     */
    public List<String> getGameSubmissionsFromRunningTournament(MongoCollection<Document> RRcollection, String tournamentID) throws RoundRobinException {

        Document tournamentDoc = getTournamentIDDoc(RRcollection, tournamentID);

        if (tournamentDoc != null) {
            String tournamentId = tournamentDoc.getString("tournamentId");
            System.out.println("First Active Tournament ID: " + tournamentId);

            return tournamentDoc.getList("game-submissions", String.class);


        } else {
            throw new RoundRobinException("Invalid Tournament ID!");
        }
    }


    /**
     * Push player score.
     *
     * @param username           the username
     * @param RRplayercollection the r rplayercollection
     * @param platform           the platform
     * @param newScore           the new score
     */
    public void pushPlayerScore(String username, MongoCollection<Document> RRplayercollection, Platform platform, double newScore){

        Document searchAmb = null;

        switch (platform){
            case LICHESS -> searchAmb = performGeneralSearch(RRplayercollection, "Lichessname", username);
            case CHESSCOM -> searchAmb = performGeneralSearch(RRplayercollection, "Chesscomname", username);
            case DISCORD -> searchAmb = performGeneralSearch(RRplayercollection, "Discordname", username);
        }

        RRplayercollection.updateOne(searchAmb, Updates.inc("score", newScore));
        System.out.println("Successfully updated the player " + username + " Score by: " + newScore);

    }


    /**
     * Push crosstable string.
     *
     * @param RRcollection the r rcollection
     * @param crosstable   the crosstable
     * @param tournamentID the tournament id
     */
    public void pushCrosstableString(MongoCollection<Document> RRcollection, String crosstable, String tournamentID){
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("crosstable", crosstable)
        );
    }

    /**
     * Push cross table list.
     *
     * @param RRcollection   the rrcollection
     * @param crosstableList the crosstable list
     * @param tournamentID   the tournament id
     */
    public void pushCrossTableList(MongoCollection<Document> RRcollection, ArrayList<ArrayList<String>> crosstableList, String tournamentID){
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("crosstable-data", crosstableList)
        );
    }

    /**
     * checks if crosstable scores are present
     * @param username the players username
     * @param crosstableManager the reference to crosstable
     * @param currPlayers the list of players
     * @return true or false if crosstable is present or not
     * @throws RoundRobinException when round robin error occur
     */

    private boolean isScoresSheetPresent(String username, RoundRobinCrosstable crosstableManager, List<String> currPlayers) throws RoundRobinException {
        List<ArrayList<String>> crosstable = crosstableManager.getTournamentCrosstable();

        boolean scoresSheetPresent = false;

        if(!currPlayers.contains(username)){
            throw new RoundRobinException("Player not found and can't be withdrawn!");
        }


        for(ArrayList<String> scoresheet: crosstable){
            for(String sheet: scoresheet){
                if (sheet.equalsIgnoreCase("1/2") || sheet.equalsIgnoreCase("1") || sheet.equalsIgnoreCase("0")) {
                    scoresSheetPresent = true;
                    break;
                }
            }
        }
        return scoresSheetPresent;
    }


}
