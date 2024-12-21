package com.serverless.register;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
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

    /**
     * Split string list array list.
     *
     * @param input the input
     * @return the array list
     */
    public static ArrayList<ArrayList<String>> splitStringList(List<String> input) {
        ArrayList<ArrayList<String>> result = new ArrayList<>();

        for (String s : input) {
            // Split by comma and trim each element
            String[] splitArray = s.split(",\\s*");

            // Convert the array to an ArrayList and add it to the result list
            ArrayList<String> splitList = new ArrayList<>(Arrays.asList(splitArray));
            result.add(splitList);
        }

        return result;
    }



}
