package com.serverless.roundrobin;


import com.mongodb.client.MongoCollection;
import com.mongodb.client.model.Updates;
import com.mongodb.client.result.UpdateResult;
import org.bson.Document;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;

public class LeaderboardCalculator {

    private final RoundRobinManager actions = new RoundRobinManager();
    private final MongoCollection<Document> RRcollection;
    private final MongoCollection<Document> RRplayercollection;

    public LeaderboardCalculator(MongoCollection<Document> RRcollection, MongoCollection<Document> RRplayercollection) {
        this.RRcollection = RRcollection;
        this.RRplayercollection = RRplayercollection;
    }


    public void calculateLeaderboard(String tournamentId){
        Document cal = actions.getTournamentIDDoc(RRcollection, tournamentId);
        List<String> players = cal.getList("players", String.class);
        HashMap<String, Double> scoreMap = new HashMap<>();

        for(String player: players){
            Document playerdoc = actions.performGeneralSearch(RRplayercollection, "Discordname", player);
            if(playerdoc != null){
                scoreMap.put(player, playerdoc.getDouble("score"));
            }else{
                scoreMap.put(player, 0.0);
            }

        }

        List<String> sortedPlayerNames = new ArrayList<>(scoreMap.keySet());
        List<Double> sortedScores = new ArrayList<>();
        sortedPlayerNames.sort((name1, name2) -> scoreMap.get(name2).compareTo(scoreMap.get(name1)));

        for(String p: sortedPlayerNames){
            sortedScores.add(scoreMap.get(p));
        }

        UpdateResult result1 = RRcollection.updateOne(
                new Document("tournamentId", tournamentId),
                Updates.set("leaderboard", sortedPlayerNames)
        );

        UpdateResult result2 = RRcollection.updateOne(
                new Document("tournamentId", tournamentId),
                Updates.set("scores", sortedScores)
        );




    }





}
