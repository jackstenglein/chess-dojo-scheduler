package com.serverless.game;

/**
 * This enum represents the platforms that the game can be played on.
 */
public enum Platform {


    LICHESS,
    CHESSCOM,
    DISCORD;

    /**
     * Returns the platform based on the URL.
     * @param url The URL of the game.
     * @return The platform of the game.
     */
    public static Platform fromURL(String url){
        if(url.contains("https://lichess.org/")){
            return LICHESS;
        }else if(url.contains("https://www.chess.com/game/live/")){
            return CHESSCOM;
        }

        return null;
    }

    /**
     * Returns the name of the platform.
     * @return The name of the platform.
     */
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


    /**
     * Returns the MongoDB field name for the player based on the platform.
     * @return The field name for the player.
     */
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
