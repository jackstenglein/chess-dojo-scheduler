package com.serverless.roundrobin;

import com.mongodb.client.MongoCollection;
import org.bson.Document;
import java.util.Date;
import java.util.Calendar;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.UUID;

public class CreateRoundRobin {

    private final int MAX_PLAYER_SIZE;

    public CreateRoundRobin(int maxPlayerSize) {
        MAX_PLAYER_SIZE = maxPlayerSize;
    }


    public void createNewRoundRobinTournament(CohortRange cohortRange, boolean mode, MongoCollection<Document> RRcollection){

        String tournamentID = UUID.randomUUID().toString();

        Date currentDate = new Date();

        Calendar calendar = Calendar.getInstance();

        calendar.setTime(currentDate);

        calendar.add(Calendar.MONTH, 3);

        Date futureDate = calendar.getTime();

        Document document = new Document("tournamentId", tournamentID)
                .append("name", getNamePattern(tournamentID))// tournament name
                .append("desc", getNamePattern(tournamentID)) // tournament desc
                .append("status", "closed") // running or finished or closed
                .append("tc", cohortRange.getTimeControl()) // cohort tc
                .append("inc", cohortRange.getTimeIncrement()) // cohort inc
                .append("fen", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") // the tournament fen
                .append("israted", true) // check is rated
                .append("cohort-start", cohortRange.getStart()) // cohort.values()
                .append("cohort-end", cohortRange.getEnd())
                .append("leaderboard", new ArrayList<String>())
                .append("automode", mode) // auto or manual // true results in generation of lichess links false otherwise
                .append("player-size", MAX_PLAYER_SIZE) // 10
                .append("players", new ArrayList<String>()) // player list
                .append("crosstable-data", new ArrayList<ArrayList<String>>()) // raw crosstable data
                .append("pairing-data", new ArrayList<ArrayList<String>>()) // raw pairing data
                .append("startdate", currentDate) // start date ISO date
                .append("enddate", futureDate) // end date + 3 months ISO date
                .append("scores", new ArrayList<Double>()) // the scores for the leaderboard
                .append("waiting", true) // check if its waiting list or not
                .append("scoremap", new Document())
                .append("game-submissions", new ArrayList<String>()); // game list


        RRcollection.insertOne(document);
    }


    public String getNamePattern(String ID){
        ZoneId zoneId = ZoneId.of("America/Toronto");

        ZonedDateTime zonedDateTime = ZonedDateTime.now(zoneId);

        int year = zonedDateTime.getYear();
        int month = zonedDateTime.getMonthValue();

        if(isInRange(3, 5, month)){
            return "Spring " + year + " RR Series Sp" + ID.substring(0, 2);
        }else if(isInRange(6, 8, month)){
            return "Summer " + year + " RR Series Su" + ID.substring(0, 2);
        }else if(isInRange(9, 11, month)){
            return "Fall " + year + " RR Series Fa" + ID.substring(0, 2);
        }else {
            return "Winter " + year + " RR Series Wi" + ID.substring(0, 2);
        }
    }

    public boolean isInRange(int lowerBound, int upperBound, int target) {
        return target >= lowerBound && target <= upperBound;
    }

}
