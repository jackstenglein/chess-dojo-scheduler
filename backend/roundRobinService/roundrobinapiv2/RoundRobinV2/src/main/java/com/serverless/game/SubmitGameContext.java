package com.serverless.game;

import com.serverless.roundrobin.RoundRobinException;

/**
 * This class manages the submission of a game to the round-robin tournament.
 */
public class SubmitGameContext {

    public void submitGame(CalculateResultStrategy strategy) throws RoundRobinException {
        strategy.calculateGameResult();
    }

}
