package com.serverless.game;

import chariot.Client;

import java.time.Duration;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;


public class PairGame {


    public PairGame() {

    }

    public String generatePairURL(int min, int sec, Client client, String tournamentName, String player1, String player2) {

        List<String> randomized = new ArrayList<>();

        randomized.add(player1);
        randomized.add(player2);

        for( String player: randomized){
            if(player.equalsIgnoreCase("No One (Bye given)")){
                return "-";
            }
        }

        AtomicReference<String> URL = new AtomicReference<>("");

        int clock = min * 60;
        var result = client.challenges().challengeOpenEnded(conf -> conf.clock(clock, sec).name(tournamentName).rated(true).users(player1, player2).expiresIn(getExpireRoundsForOneWeeks()));
        result.ifPresent(play -> URL.updateAndGet(v -> v + play.challenge().url()));
        System.out.println(URL.get());
        return URL.get();
    }

    private List<String> getRandomWhitesAndBlacks(String player1, String player2){
        List<String> normal = new ArrayList<>();

        normal.add(player1);
        normal.add(player2);

        Collections.shuffle(normal);

        return normal;
    }

    private Duration getExpireRoundsForOneWeeks(){

        LocalDate today = LocalDate.now();

        LocalDate twoWeeksFromToday = today.plus(1, ChronoUnit.WEEKS);

        return Duration.between(today.atStartOfDay(), twoWeeksFromToday.atStartOfDay());

    }




}