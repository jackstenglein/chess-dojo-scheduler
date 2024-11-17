package Handler;


/**
 * The type Pairing builder.
 */
public class PairingBuilder {


    /**
     * Build pairing normal string.
     *
     * @param white the white
     * @param black the black
     * @return the string
     */
    public String buildPairingNormal(String white, String black){
        return "\n" + white + " **(White)** **vs** " + black + " **(Black)** \n\n";
    }

    /**
     * Build pairing for automated url string.
     *
     * @param white the white
     * @param black the black
     * @param URL   the url
     * @return the string
     */
    public String buildPairingForAutomatedURL(String white, String black, String URL){
        return white + " **(White)** **vs** " + black + " **(Black)** " + URL + " \n";
    }


}

