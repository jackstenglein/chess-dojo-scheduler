package com.serverless.game;

import com.mongodb.client.MongoCollection;
import com.serverless.roundrobin.LeaderboardCalculator;
import com.serverless.roundrobin.RoundRobinException;
import com.serverless.roundrobin.RoundRobinManager;
import org.bson.Document;

import java.io.IOException;

public class GameHandler {

    private final MongoCollection<Document> RRplayerCollection;
    private final MongoCollection<Document> RRcollection;
    private final RoundRobinManager actions = new RoundRobinManager();
    private final SubmitGameContext context = new SubmitGameContext();
    private final String Discordname;
    private final String dojoUsername;
    private final String gameURL;


    public GameHandler(MongoCollection<Document> rRplayerCollection, MongoCollection<Document> rRcollection, String discordname, String dojoUsername, String gameURL) {
        this.RRplayerCollection = rRplayerCollection;
        this.RRcollection = rRcollection;
        this.Discordname = discordname;
        this.dojoUsername = dojoUsername;
        this.gameURL = gameURL;
    }

    public String handleGameRequest(){
        try{

            if(dojoUsername.equalsIgnoreCase("") || dojoUsername.equalsIgnoreCase("null")){
                throw new IOException("Dojo username is a valid param");
            }

            String platformUsername;

            String dbPlayerName = Discordname.equalsIgnoreCase("null") || Discordname.equalsIgnoreCase("") ? dojoUsername : Discordname;

            Platform platform = Platform.fromURL(gameURL);

            if(platform != null){
                platformUsername = actions.performGeneralSearch(RRplayerCollection, "Discordname", dbPlayerName).getString(platform.getPlayerField());
            }else{
                return "Invalid game URL, games must be Lichess/Chess.com game";
            }

            Document getRegisteredTournamentID = actions.getRegisteredPlayerTournamentID(RRcollection, dbPlayerName);

            if(getRegisteredTournamentID != null){

                String tournamentID = getRegisteredTournamentID.getString("tournamentId");

                System.out.println(tournamentID);

                if(actions.getGameSubmissionsFromRunningTournament(RRcollection, tournamentID).contains(gameURL)){
                    return "This game has already been submitted to the system! Please play other games of rounds and submit those!";
                }

                switch (platform){
                    case LICHESS -> context.submitGame(new LichessStrategy(gameURL, RRplayerCollection, RRcollection, tournamentID));

                    case CHESSCOM -> context.submitGame(new ChessComStrategy(gameURL, platformUsername.toLowerCase().trim(), RRplayerCollection, RRcollection, tournamentID, getRegisteredTournamentID.getDate("startdate"), getRegisteredTournamentID.getDate("enddate")));
                }

                LeaderboardCalculator calculator = new LeaderboardCalculator(RRcollection, RRplayerCollection);
                calculator.calculateAndUpdateLeaderboard(tournamentID);

                return  "Successfully computed the scores for the game URL: " + gameURL;

            }else{
                return "The player registration not found! You can not submit a game if you have not registered!";
            }
        }catch (RoundRobinException | IOException e){
            return e.getMessage();
        }
    }














}
