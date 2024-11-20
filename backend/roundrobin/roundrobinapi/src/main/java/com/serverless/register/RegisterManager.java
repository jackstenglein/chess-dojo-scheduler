package com.serverless.register;

import chariot.Client;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import com.serverless.roundrobin.*;
import org.bson.Document;

import java.util.List;

public class RegisterManager {

    private final int MAX_PLAYER_SIZE = 8;
    private final CreateRoundRobin create = new CreateRoundRobin(MAX_PLAYER_SIZE);
    private final RoundRobinManager manager = new RoundRobinManager();



    public boolean alreadyRegisteredInTournament(MongoCollection<Document> RRcollection, String Discordname){
        Document finder = manager.performGeneralSearch(RRcollection, "players", Discordname);
        return finder != null;
    }


    public void addPlayerToDB(String DiscordID, String DiscordName, String Lichessname, String Chesscomname, MongoCollection<Document> RRplayerCollection){

        createNewPlayer(Lichessname, Chesscomname, DiscordName, DiscordID, 0.0, RRplayerCollection);
    }


    private void createNewPlayer(String Lichessname, String Chesscomname, String DiscordName, String DiscordID, double score, MongoCollection<Document> RRplayercollection){
        Document document = new Document("Lichessname", Lichessname)
                .append("Chesscomname", Chesscomname)
                .append("Discordid", DiscordID)
                .append("Discordname", DiscordName)
                .append("score", score);
        System.out.println("Successfully added Player into Round Robin Collection");
        RRplayercollection.insertOne(document);
    }


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

    public String getTournamentIDForStartCohort(MongoCollection<Document> RRcollection, CohortRange cohortRange) throws RoundRobinException{
        Document eligibleDoc = getTournamentDocForStartCohort(RRcollection, cohortRange.getStart());

        if(eligibleDoc != null){
            return eligibleDoc.getString("tournamentId");
        }else{
            throw new RoundRobinException("The following cohort " + cohortRange.getStart() + " tournament is filled, please consider registering 1 level up or down or contact Alex Dodd to create new tournament");
        }
    }

    public void pushPairingForRunningTournament(MongoCollection<Document> RRcollection, String pairings, String tournamentID) throws RoundRobinException{
        RRcollection.updateOne(
                new Document("tournamentId", tournamentID),
                Updates.set("pairings", pairings)
        );
    }


    public String getRoundRobinPairingsInternally(MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection, String tournamentID) throws RoundRobinException {
        Document tournamentDoc = manager.getTournamentIDDoc(RRcollection, tournamentID);

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

    public void addPlayerToRunningTournament(String playerUsername, MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection ,String tournamentID) throws RoundRobinException {

        Document firstActiveTournament = manager.getTournamentIDDoc(RRcollection, tournamentID);

        if (firstActiveTournament != null) {
            String tournamentId = firstActiveTournament.getString("tournamentId");
            System.out.println("First Active Eligible Tournament ID: " + tournamentId);
            addPlayerToTournamentSimpleAlgo(firstActiveTournament, RRcollection, RRplayercollection ,tournamentId, playerUsername);
        } else {
            throw new RoundRobinException("No Round Robin found internal error!");
        }
    }




}
