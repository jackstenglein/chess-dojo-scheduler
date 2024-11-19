package com.serverless.roundrobin;


public class PairingBuilder {


    public String buildPairingNormal(String white, String black){
        return "\n" + white + " **(White)** **vs** " + black + " **(Black)** \n\n";
    }

    public String buildPairingForAutomatedURL(String white, String black, String URL){
        return white + " **(White)** **vs** " + black + " **(Black)** " + URL + " \n";
    }


}

