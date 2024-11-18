package Handler;

import chariot.Client;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;

import java.util.ArrayList;
import java.util.List;

/**
 * The type Register manager.
 */
public class RegisterManager {

    private final VerificationManager verification = new VerificationManager();
    private final int MAX_PLAYER_SIZE = 8;


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
     * Already registered in tournament boolean.
     *
     * @param RRcollection the r rcollection
     * @param Discordname  the discordname
     * @return the boolean
     */
    public boolean alreadyRegisteredInTournament(MongoCollection<Document> RRcollection, String Discordname){
        Document finder = performGeneralSearch(RRcollection, "players", Discordname);
        return finder != null;
    }

    /**
     * Perform general search document.
     *
     * @param collection the collection
     * @param key        the key
     * @param val        the val
     * @return the document
     */
    public Document performGeneralSearch(MongoCollection<Document> collection, String key, String val){
        Document query = new Document(key, val);
        return collection.find(query).first();
    }

    /**
     * Add player to db boolean.
     *
     * @param DiscordID          the discord id
     * @param DiscordName        the discord name
     * @param RRplayerCollection the r rplayer collection
     * @param lichessCollection  the lichess collection
     * @param ccCollection       the cc collection
     * @return the boolean
     */
    public boolean addPlayerToDB(String DiscordID, String DiscordName, MongoCollection<Document> RRplayerCollection, MongoCollection<Document> lichessCollection, MongoCollection<Document> ccCollection){

        if(verification.userPresentNormal(RRplayerCollection, DiscordID)){
            return true;
        }

        if(verification.userPresentNormal(lichessCollection, DiscordID) || verification.userPresentNormal(ccCollection, DiscordID)){
            String Lichessname = verification.getReletatedLichessName(DiscordID, lichessCollection);
            String Chesscomname = verification.getReletatedChessName(DiscordID, ccCollection);
            createNewPlayer(Lichessname, Chesscomname, DiscordName , DiscordID, 0.0,  RRplayerCollection);

            return true;
        }

        return false;
    }


    /**
     * Create new player.
     *
     * @param Lichessname        the lichessname
     * @param Chesscomname       the chesscomname
     * @param DiscordName        the discord name
     * @param DiscordID          the discord id
     * @param score              the score
     * @param RRplayercollection the r rplayercollection
     */
    public void createNewPlayer(String Lichessname, String Chesscomname, String DiscordName, String DiscordID, double score, MongoCollection<Document> RRplayercollection){
        Document document = new Document("Lichessname", Lichessname)
                .append("Chesscomname", Chesscomname)
                .append("Discordid", DiscordID)
                .append("Discordname", DiscordName)
                .append("score", score);
        System.out.println("Successfully added Player into Round Robin Collection");
        RRplayercollection.insertOne(document);
    }


    /**
     * Get tournament doc for start cohort document.
     *
     * @param RRcollection the r rcollection
     * @param startCohort  the start cohort
     * @return the document
     */
    public Document getTournamentDocForStartCohort (MongoCollection<Document> RRcollection, int startCohort){
        Document query = new Document("cohort-start", startCohort);
        FindIterable<Document> finder = RRcollection.find(query);

        for(Document doc: finder){
            if(doc.getList("players", String.class).size() < MAX_PLAYER_SIZE){
                return doc;
            }
        }

        return null;
    }

    /**
     * Gets tournament id for start cohort.
     *
     * @param RRcollection the r rcollection
     * @param cohortRange  the cohort range
     * @return the tournament id for start cohort
     * @throws RoundRobinException the round robin exception
     */
    public String getTournamentIDForStartCohort(MongoCollection<Document> RRcollection, CohortRange cohortRange) throws RoundRobinException{
        Document eligibleDoc = getTournamentDocForStartCohort(RRcollection, cohortRange.getStart());

        if(eligibleDoc != null){
            return eligibleDoc.getString("tournamentId");
        }else{
            throw new RoundRobinException("The following cohort " + cohortRange.getStart() + " tournament is filled, please consider registering 1 level up or down or contact Alex Dodd to create new tournament");
        }
    }

    /**
     * Push pairing for running tournament.
     *
     * @param RRcollection the r rcollection
     * @param pairings     the pairings
     * @param tournamentID the tournament id
     * @throws RoundRobinException the round robin exception
     */
    public void pushPairingForRunningTournament(MongoCollection<Document> RRcollection, String pairings, String tournamentID) throws RoundRobinException{
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("pairings", pairings)
        );
    }


    /**
     * Gets round robin pairings internally.
     *
     * @param RRcollection       the r rcollection
     * @param RRplayercollection the r rplayercollection
     * @param tournamentID       the tournament id
     * @return the round robin pairings internally
     * @throws RoundRobinException the round robin exception
     */
    public String getRoundRobinPairingsInternally(MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection, String tournamentID) throws RoundRobinException {
        Document tournamentDoc = getTournamentIDDoc(RRcollection, tournamentID);

        if(tournamentDoc != null){
            try{

                RoundRobin roundRobin = new RoundRobin(tournamentDoc.getList("players", String.class), tournamentDoc.getString("name"),
                        tournamentDoc.getString("desc"), Client.basic(), CohortRange.findCohortRange(tournamentDoc.getInteger("cohort-start"),
                        tournamentDoc.getInteger("cohort-end")), tournamentDoc.getBoolean("automode"), RRplayercollection);

                String pairings = roundRobin.createTournamentPairings();

                System.out.println(roundRobin.toString());
                System.out.println(pairings);

                pushPairingForRunningTournament(RRcollection, pairings, tournamentID);

                return "I have successfully generated the pairings!";
            }catch (RoundRobinException e){
                return e.getMessage();
            }
        }else{
            throw new RoundRobinException("Invalid Tournament ID!");
        }

    }

    /**
     * Open tournament to calculation.
     *
     * @param RRcollection the r rcollection
     * @param tournamentID the tournament id
     * @throws RoundRobinException the round robin exception
     */
    public void openTournamentToCalculation(MongoCollection<Document> RRcollection, String tournamentID) throws RoundRobinException {

        Document openTourney = getTournamentIDDoc(RRcollection, tournamentID);

        if(openTourney != null){

            if(openTourney.getList("players", String.class).size() < 3){
                throw new RoundRobinException("Tournament Can't be opened due to less than 10 players!");
            }

            UpdateResult result = RRcollection.updateOne(
                    openTourney,
                    Updates.set("status", "running")
            );
        }else{
            throw new RoundRobinException("Invalid ID, can't open unknown tournament!");
        }

    }

    /**
     * Add player to tournament simple algo.
     *
     * @param tourneyID          the tourney id
     * @param RRcollection       the r rcollection
     * @param RRplayercollection the r rplayercollection
     * @param tournamentID       the tournament id
     * @param username           the username
     * @throws RoundRobinException the round robin exception
     */
    public void addPlayerToTournamentSimpleAlgo(Document tourneyID, MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection,String tournamentID, String username) throws RoundRobinException {
        List<String> currentPlayerCount = tourneyID.getList("players", String.class);
        if(!(currentPlayerCount.size() <= MAX_PLAYER_SIZE)) {
            throw new RoundRobinException("Player can not sign up due to hitting registration limit");
        } else if (currentPlayerCount.contains(username)) {
            throw new RoundRobinException("Same player can't be added in the tournament!");
        }


        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.push("players", username)
        );

        if(currentPlayerCount.size() >= 4 && currentPlayerCount.size() <= MAX_PLAYER_SIZE){
            String pairs = getRoundRobinPairingsInternally(RRcollection, RRplayercollection,tournamentID);
            openTournamentToCalculation(RRcollection, tournamentID);
            RoundRobinCrosstable crosstable = new RoundRobinCrosstable(RRcollection, RRplayercollection, tournamentID);
            crosstable.createCrossTable();
        }

        if(currentPlayerCount.size() == MAX_PLAYER_SIZE){
            CohortRange sameRange = CohortRange.findCohortRange(tourneyID.getInteger("cohort-start"), tourneyID.getInteger("cohort-end"));
            create.createNewRoundRobinTournament(sameRange, false, RRcollection);
        }

        if (result.getModifiedCount() > 0) {
            System.out.println("Player " + username + " added successfully");
        } else {
            throw new RoundRobinException("Internal Error");
        }
    }

    /**
     * Add player to running tournament.
     *
     * @param playerUsername     the player username
     * @param RRcollection       the r rcollection
     * @param RRplayercollection the r rplayercollection
     * @param tournamentID       the tournament id
     * @throws RoundRobinException the round robin exception
     */
    public void addPlayerToRunningTournament(String playerUsername, MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection ,String tournamentID) throws RoundRobinException {

        Document firstActiveTournament = getTournamentIDDoc(RRcollection, tournamentID);

        if (firstActiveTournament != null) {
            String tournamentId = firstActiveTournament.getString("tournamentId");
            System.out.println("First Active Eligible Tournament ID: " + tournamentId);
            addPlayerToTournamentSimpleAlgo(firstActiveTournament, RRcollection, RRplayercollection ,tournamentId, playerUsername);
        } else {
            throw new RoundRobinException("No Round Robin found internal error!");
        }
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
     * @param RRcollection   the r rcollection
     * @param crosstableList the crosstable list
     * @param tournamentID   the tournament id
     */
    public void pushCrossTableList(MongoCollection<Document> RRcollection, ArrayList<ArrayList<String>> crosstableList, String tournamentID){
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("crosstable-data", crosstableList)
        );
    }



}
