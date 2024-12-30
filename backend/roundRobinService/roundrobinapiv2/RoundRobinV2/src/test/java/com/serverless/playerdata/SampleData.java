package com.serverless.playerdata;

import java.util.Random;

/**
 * This class represents sample data that can be generated to test register,
 * withdraw functions by generating random real life like usernames
 */
public class SampleData {

    private static final String[] ADJECTIVES = {
            "Swift12", "Lazy21", "Brave12", "Clever21", "Mighty12", "Gentle21", "Happy12", "Shiny21", "Quiet12",
            "Fierce21"
    };

    private static final String[] NOUNS = {
            "Tiger", "Eagle", "Panda", "Wolf", "Phoenix", "Bear", "Falcon", "Shark", "Dragon", "Lion", "Elephant",
            "Hawk", "Panther", "Cheetah", "Gorilla", "Rhino", "Cobra", "Fox", "Jaguar", "Leopard", "Owl", "Raven",
            "Viper", "Badger", "Bison", "Coyote", "Crab", "Crow", "Dolphin", "Giraffe", "Horse", "Kangaroo", "Koala",
            "Lemur", "Lobster", "Moose", "Otter", "Penguin", "Polar bear", "Raccoon", "Seal", "Sloth", "Walrus",
            "Whale", "Zebra"
    };

    public static void main(String[] args) {
        // Generate and print 10 random usernames
        for (int i = 0; i < 10; i++) {
            System.out.println(generateRandomUsername());
        }
    }

    public static String generateRandomUsername() {
        Random random = new Random();

        // Pick a random adjective and noun
        String adjective = ADJECTIVES[random.nextInt(ADJECTIVES.length)];
        String noun = NOUNS[random.nextInt(NOUNS.length)];

        // Generate a random number
        int number = random.nextInt(1000); // Random number between 0 and 999

        // Combine the parts to form a username
        return adjective + noun + number;
    }

    public PlayerData getRandomPlayerAllDifferent(int cohort) {
        return new PlayerData(cohort, generateRandomUsername(), generateRandomUsername(), generateRandomUsername(),
                generateRandomUsername(), generateRandomUsername());
    }

    public PlayerData getRandomPlayerEmptyData(int cohort) {
        return new PlayerData(cohort, "", "", "", "", generateRandomUsername());
    }

    public PlayerData getRandomPlayerNullData(int cohort) {
        return new PlayerData(cohort, "null", "null", "null", "null", generateRandomUsername());
    }

    public PlayerData getRandomPartialLichessNullData(int cohort) {
        return new PlayerData(cohort, "null", "null", generateRandomUsername(), "null", generateRandomUsername());
    }

    public PlayerData getRandomPartialCCNullData(int cohort) {
        return new PlayerData(cohort, "null", "null", "null", generateRandomUsername(), generateRandomUsername());
    }

    public static void loadDate() {

    }

}
