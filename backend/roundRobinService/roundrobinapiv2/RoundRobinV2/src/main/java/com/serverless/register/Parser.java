package com.serverless.register;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * This class contains methods for parsing data for crosstable and pairings
 */
public class Parser {

    /**
     * Gets the crosstable in list format.
     * 
     * @param pair The crosstable string.
     * @return The crosstable in list format.
     */
    public static ArrayList<String> getPairingsInListFormat(String pair) {

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
     * Splits a list of strings into a list of lists of strings.
     * 
     * @param input The list of strings to split.
     * @return The list of lists of strings.
     */
    public static ArrayList<ArrayList<String>> splitStringList(List<String> input) {
        ArrayList<ArrayList<String>> result = new ArrayList<>();

        for (String s : input) {

            String[] splitArray = s.split(",\\s*");

            ArrayList<String> splitList = new ArrayList<>(Arrays.asList(splitArray));
            result.add(splitList);
        }

        return result;
    }

}
