package com.serverless.register;


import java.util.ArrayList;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * The type Parser.
 */
public class Parser {

    /**
     * Gets pairings in list format.
     *
     * @param pair the pair
     * @return the pairings in list format
     */
    public static ArrayList<String> getPairingsInListFormat(String pair)  {

        Pattern pattern = Pattern.compile("\\*\\*Round \\d+:\\*\\* \\[(.*?)\\]", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(pair);

        ArrayList<String> roundsList = new ArrayList<>();

        while (matcher.find()) {
            String roundContent = matcher.group(1).trim();
            roundsList.add(roundContent);
        }

        return roundsList;
    }



}

