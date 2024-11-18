package Handler;


/**
 * The enum Platform.
 */
public enum Platform {


    /**
     * Lichess platform.
     */
    LICHESS,
    /**
     * Chesscom platform.
     */
    CHESSCOM,
    /**
     * Discord platform.
     */
    DISCORD;


    /**
     * From url platform.
     *
     * @param url the url
     * @return the platform
     */
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

    @Override
    public String toString() {
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
