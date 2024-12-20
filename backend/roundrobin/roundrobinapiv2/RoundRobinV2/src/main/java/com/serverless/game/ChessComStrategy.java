package com.serverless.game;

import com.mongodb.client.MongoCollection;
import com.serverless.roundrobin.RoundRobinCrosstable;
import com.serverless.roundrobin.RoundRobinException;
import com.serverless.roundrobin.UpdatePlayerScores;
import io.github.sornerol.chess.pubapi.client.PlayerClient;
import io.github.sornerol.chess.pubapi.domain.game.ArchiveGame;
import org.bson.Document;

import java.time.LocalDate;
import java.util.Calendar;
import java.util.Date;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ChessComStrategy implements CalculateResultStrategy {

    private final Platform platform = Platform.CHESSCOM;
    private final String gameURL;
    private final String player;
    private final UpdatePlayerScores updateAction;
    private final MongoCollection<Document> RRplayercollection;
    private final MongoCollection<Document> RRcollection;
    private final RoundRobinCrosstable crosstableGen;
    private final String tournamentID;
    private final Date startDate;
    private final Date endDate;


    public ChessComStrategy(String gameURL, String player, MongoCollection<Document> rRplayercollection, MongoCollection<Document> rRcollection, String tournamentID, Date start, Date end){
        this.gameURL = gameURL;
        this.player = player;
        this.updateAction = new UpdatePlayerScores();
        this.RRplayercollection = rRplayercollection;
        this.RRcollection = rRcollection;
        this.tournamentID = tournamentID;
        this.startDate = start;
        this.endDate = end;
        this.crosstableGen = new RoundRobinCrosstable(RRcollection, RRplayercollection, tournamentID);
    }


    @Override
    public void calculateGameResult() throws RoundRobinException {

        PlayerClient client = new PlayerClient();

        Calendar calendar = Calendar.getInstance();

        calendar.setTime(startDate);

        calendar.add(Calendar.MONTH, 1);

        Date futureDate = calendar.getTime();

        Date[] duration = new Date[]{startDate, futureDate ,endDate};

        for(Date gameDate: duration){
            try {
                Calendar calendar1 = Calendar.getInstance();
                calendar1.setTime(gameDate);
                List<ArchiveGame> list = client.getMonthlyArchiveForPlayer(player, calendar1.get(Calendar.YEAR), calendar1.get(Calendar.MONTH) + 1).getGames().stream().filter(s -> s.getUrl().equalsIgnoreCase(gameURL)).toList();
               System.out.println(list);

                if(list.isEmpty()){
                    System.out.println("URL not computed");
                }else{
                    ArchiveGame game = list.getFirst();
                    String gameresult = (game.getPgn());

                    System.out.println(gameresult + " |||RESULT");


                    String player1 = game.getWhite().getUsername().toLowerCase().trim();
                    String player2 = game.getBlack().getUsername().toLowerCase().trim();
                    GameState gameState = null;


                    switch (extractResult(gameresult)) {
                        case "1-0" -> gameState = GameState.WHITE_WON;
                        case "0-1" -> gameState = GameState.BLACK_WON;
                        case "1/2-1/2" -> gameState = GameState.DRAW;

                    }

                    updateAction.updatePlayerScore(player1.toLowerCase(), player2.toLowerCase(), platform, gameState, RRplayercollection, RRcollection, tournamentID);
                    crosstableGen.updateCrossTableScores(player1.toLowerCase(), player2.toLowerCase(), gameState, platform);
                    updateAction.submitGameURL(RRcollection, gameURL, tournamentID);
                    break;
                }

            } catch (Exception e){
                System.out.println(e.getMessage());
            }
        }


    }

    public String extractResult(String pgn) {
        String result = null;
        Pattern pattern = Pattern.compile("\\[Result \"([^\"]+)\"\\]");
        Matcher matcher = pattern.matcher(pgn);
        if (matcher.find()) {
            result = matcher.group(1);
        }
        return result;
    }



}
