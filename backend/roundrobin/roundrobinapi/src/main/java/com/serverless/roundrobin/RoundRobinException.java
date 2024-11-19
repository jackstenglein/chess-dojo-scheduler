package com.serverless.roundrobin;


public class RoundRobinException extends Exception{

    public RoundRobinException(String mesg){
        super(mesg);
    }

}