package com.serverless.register;

import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import com.serverless.roundrobin.*;
import org.bson.Document;

import java.util.HashMap;
import java.util.List;

public class RegisterManager {

    private final int MAX_PLAYER_SIZE = 10;
    private final CreateRoundRobin create = new CreateRoundRobin(MAX_PLAYER_SIZE);
    private final RoundRobinManager manager = new RoundRobinManager();

    /**
     * Checks if the player is already registered in a tournament.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param Discordname The Discord name of the player.
     * @return True if the player is already registered in a tournament, false otherwise.
     */
    public boolean alreadyRegisteredInTournament(MongoCollection<Document> RRcollection, String Discordname){
       return manager.getRegisteredPlayerTournamentID(RRcollection, Discordname) != null;
    }

    /**
     * Adds a player to the player database.
     * @param DiscordID The Discord ID of the player.
     * @param DiscordName The Discord name of the player.
     * @param Lichessname The Lichess account name of the player.
     * @param Chesscomname The Chess.com account name of the player.
     * @param RRplayerCollection The MongoDB collection for player data.
     */
    public void addPlayerToDB(String DiscordID, String DiscordName, String Lichessname, String Chesscomname, MongoCollection<Document> RRplayerCollection){
        createNewPlayer(Lichessname, Chesscomname, DiscordName, DiscordID, 0.0, RRplayerCollection);
    }

    /**
     * Creates a new player in the player database.
     * @param Lichessname The Lichess account name of the player.
     * @param Chesscomname The Chess.com account name of the player.
     * @param DiscordName The Discord name of the player.
     * @param DiscordID The Discord ID of the player.
     * @param score The score of the player.
     * @param RRplayercollection The MongoDB collection for player data.
     */
    private void createNewPlayer(String Lichessname, String Chesscomname, String DiscordName, String DiscordID, double score, MongoCollection<Document> RRplayercollection){
        Document document = new Document("Lichessname", Lichessname)
                .append("Chesscomname", Chesscomname)
                .append("Discordid", DiscordID)
                .append("Discordname", DiscordName)
                .append("score", score);
        Document checker = manager.performGeneralSearch(RRplayercollection, "Discordname", DiscordName);

        if(checker == null){
            RRplayercollection.insertOne(document);
            System.out.println("Successfully added Player into Round Robin Collection");
        }else{
            System.out.println("This document is already present");
        }
    }


    /**
     * Retrieves the tournament document for a given start cohort.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param startCohort The starting cohort of the tournament.
     * @param tarUsername The username of the player.
     * @return The document representing the tournament.
     */
    private Document getTournamentDocInternal(MongoCollection<Document> RRcollection, int startCohort, String tarUsername){
        Document query = new Document("cohort-start", startCohort);
        FindIterable<Document> finder = RRcollection.find(query);

        for(Document doc: finder){

            if(doc.getList("players", String.class).contains(tarUsername)){
                continue;
            }

            if(!doc.getBoolean("waiting")){
                continue;
            }

            if(doc.getList("players", String.class).isEmpty()){
                return doc;
            }

            if(doc.getList("players", String.class).size() < MAX_PLAYER_SIZE){
                return doc;
            }
        }

        return null;
    }


    /**
     * Retrieves the tournament document for a given start cohort.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param startCohort The starting cohort of the tournament.
     * @param tarUsername The username of the player.
     * @return The document representing the tournament.
     */
    public Document getTournamentDocForStartCohort(MongoCollection<Document> RRcollection, int startCohort, String tarUsername){
        Document targetDoc = getTournamentDocInternal(RRcollection, startCohort, tarUsername);
        Document targetDown = getTournamentDocInternal(RRcollection, startCohort - 100, tarUsername);
        Document targetUp = getTournamentDocInternal(RRcollection, startCohort + 100, tarUsername);
        if(targetDoc != null){
            return targetDoc;
        }
        else if(targetDown != null){
            return targetDown;
        }

        return targetUp;
    }

    /**
     * Retrieves the tournament ID for a given start cohort.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param cohortRange The cohort range of the tournament.
     * @param tarUsername The username of the player.
     * @return The ID of the tournament.
     * @throws RoundRobinException If the tournament is filled.
     */
    public String getTournamentIDForStartCohort(MongoCollection<Document> RRcollection, CohortRange cohortRange, String tarUsername) throws RoundRobinException{
        Document eligibleDoc = getTournamentDocForStartCohort(RRcollection, cohortRange.getStart(), tarUsername);

        if(eligibleDoc != null){
            return eligibleDoc.getString("tournamentId");
        }else{
            throw new RoundRobinException("The following cohort ranges [" + cohortRange.getStart() + ", " + (cohortRange.getStart()+100) + ", " + (cohortRange.getStart()-100) + "] Round Robin tournaments is filled");
        }
    }

    /**
     * Pushes the pairings for a running tournament.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param pairings The pairings for the tournament.
     * @param tournamentID The ID of the tournament.
     * @throws RoundRobinException If an error occurs during pairing.
     */
    public void pushPairingForRunningTournament(MongoCollection<Document> RRcollection, String pairings, String tournamentID) throws RoundRobinException{
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("pairing-data", Parser.splitStringList(Parser.getPairingsInListFormat(pairings)))
        );
    }

    /**
     * Generates the pairings for a tournament.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param RRplayercollection The MongoDB collection for player data.
     * @param tournamentID The ID of the tournament.
     * @return The status message.
     * @throws RoundRobinException  If an error occurs during pairing.
     */
    public String getRoundRobinPairingsInternally(MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection, String tournamentID) throws RoundRobinException {

        Document tournamentDoc = manager.getTournamentIDDoc(RRcollection, tournamentID);

        if(tournamentDoc != null){
            try{

                RoundRobin roundRobin = new RoundRobin(tournamentDoc.getList("players", String.class), tournamentDoc.getString("name"),
                        tournamentDoc.getString("desc"));

                String pairings = roundRobin.createTournamentPairings();

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
     * Opens a tournament for calculation.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param tournamentID The ID of the tournament.
     * @throws RoundRobinException If an error occurs during opening the tournament
     */
    public void openTournamentToCalculation(MongoCollection<Document> RRcollection, String tournamentID) throws RoundRobinException {

        Document openTourney = manager.getTournamentIDDoc(RRcollection, tournamentID);

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
     * Adds a player to a tournament via simple algo
     * @param tourneyID The document representing the tournament.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param RRplayercollection The MongoDB collection for player data.
     * @param tournamentID The ID of the tournament.
     * @param username The username of the player.
     * @throws RoundRobinException If an error occurs during player addition.
     */
    public void addPlayerToTournamentSimpleAlgo(Document tourneyID, MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection,String tournamentID, String username) throws RoundRobinException {
        List<String> currentPlayerCount = tourneyID.getList("players", String.class);
        if(!(currentPlayerCount.size() <= MAX_PLAYER_SIZE)) {
            throw new RoundRobinException("Player can not sign up due to hitting registration limit");
        } else if (currentPlayerCount.contains(username)) {
            throw new RoundRobinException("Same player can't be added in the tournament!");
        }

        RoundRobinCrosstable crosstable = new RoundRobinCrosstable(RRcollection, RRplayercollection, tournamentID);
        LeaderboardCalculator calculator = new LeaderboardCalculator(RRcollection);

        UpdateResult result = RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.push("players", username)
        );

        if(!tourneyID.getBoolean("waiting")){
            String pairs = getRoundRobinPairingsInternally(RRcollection, RRplayercollection,tournamentID);
            crosstable.registerPlayer();
            calculator.addPlayer(tournamentID, username, 0.0);
            calculator.calculateAndUpdateLeaderboard(tournamentID);
        }

        if(currentPlayerCount.size() + 1 == MAX_PLAYER_SIZE && tourneyID.getBoolean("waiting")){

            openTournamentToCalculation(RRcollection, tournamentID);

            String pairs = getRoundRobinPairingsInternally(RRcollection, RRplayercollection,tournamentID);

            crosstable.createCrossTable();

            calculator.calculateAndUpdateLeaderboard(tournamentID);

            RRcollection.updateOne(
                    new Document("tournamentId", tournamentID),
                    Updates.set("waiting", false)
            );

            Document curr = RRcollection.find(new Document("tournamentId", tournamentID)).first();

            HashMap<String, Double> scoreMap = new HashMap<>();

            assert curr != null;
            for(String players: curr.getList("players", String.class)){
                scoreMap.put(players, 0.0);
            }

            System.out.println(scoreMap);

            System.out.println("entering updating");
            RRcollection.updateOne(
                    new Document("tournamentId", tournamentID),
                    Updates.set("scoremap", new Document(scoreMap))
            );

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
     * Adds a player to a running tournament with safety net
     * @param playerUsername The username of the player.
     * @param RRcollection The MongoDB collection for tournament data.
     * @param RRplayercollection The MongoDB collection for player data.
     * @param tournamentID The ID of the tournament.
     * @throws RoundRobinException If an error occurs during player addition.
     */
    public void addPlayerToRunningTournament(String playerUsername, MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection ,String tournamentID) throws RoundRobinException {

        Document firstActiveTournament = manager.getTournamentIDDoc(RRcollection, tournamentID);

        if (firstActiveTournament != null) {
            String tournamentId = firstActiveTournament.getString("tournamentId");
            System.out.println("First Active Eligible Tournament ID: " + tournamentId);
            System.out.println("Incoming ID: " + tournamentID);
            addPlayerToTournamentSimpleAlgo(firstActiveTournament, RRcollection, RRplayercollection ,tournamentID, playerUsername);
        } else {
            throw new RoundRobinException("No Round Robin found internal error!");
        }
    }



}
