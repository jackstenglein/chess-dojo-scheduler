package com.serverless.game;


public enum Platform {


    LICHESS,
    CHESSCOM,
    DISCORD;


    public static Platform fromURL(String url){
        if(url.contains("https://lichess.org/")){
            return LICHESS;
        }else if(url.contains("https://www.chess.com/game/live/")){
            return CHESSCOM;
        }

        return null;
    }

    public String getName(){
        switch (this){
            case LICHESS -> {
                return "Lichess.org";
            }

            case CHESSCOM -> {
                return  "Chess.com";
            }
        }
        return null;
    }


    public String getPlayerField() {
        switch (this){
            case LICHESS -> {
                return "Lichessname";
            }
            case CHESSCOM -> {
                return "Chesscomname";
            }
            case DISCORD -> {
                return "Discordname";
            }
        }
        return null;
    }
}
