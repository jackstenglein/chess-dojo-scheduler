package com.serverless.roundrobin;

/**
 * This class manages the round-robin tournament exception.
 */
public class RoundRobinException extends Exception {

    /**
     * Constructor for RoundRobinException.
     *
     * @param mesg The message to display.
     */
    public RoundRobinException(String mesg) {
        super(mesg);
    }

}