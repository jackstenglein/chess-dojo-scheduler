package com.serverless.roundrobin;

/**
 * This class manages the pairing for a round-robin tournament.
 */
public class PairingBuilder {
    /**
     * Builds the pairing String for a round-robin tournament.
     *
     * @param white The name of the white player.
     * @param black The name of the black player.
     * @return The pairing string.
     */
    public String buildPairingNormal(String white, String black) {
        return "\n" + white + " **(White)** **vs** " + black + " **(Black)** \n\n";
    }

}
