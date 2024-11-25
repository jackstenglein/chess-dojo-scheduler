package com.serverless.game;

import com.serverless.roundrobin.RoundRobinException;

/**
 * The interface Calculate result strategy.
 */
public interface CalculateResultStrategy {
    /**
     * Calculate game result.
     *
     * @throws RoundRobinException the round robin exception
     */
    public void calculateGameResult() throws RoundRobinException;


}