package com.serverless.game;

import com.serverless.roundrobin.RoundRobinException;

public class SubmitGameContext {


    public void submitGame(CalculateResultStrategy strategy) throws RoundRobinException {
        strategy.calculateGameResult();
    }

}
