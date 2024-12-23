package com.serverless.roundrobin;


/**
 * This enum represents the range of ratings for a cohort.
 */
public enum CohortRange {
    COHORT_0_300(0, 300, 0, 1250),
    COHORT_300_400(300, 400, 1250, 1310),
    COHORT_400_500(400, 500, 1310, 1370),
    COHORT_500_600(500, 600, 1370, 1435),
    COHORT_600_700(600, 700, 1435, 1500),
    COHORT_700_800(700, 800, 1500, 1550),
    COHORT_800_900(800, 900, 1550, 1665),
    COHORT_900_1000(900, 1000, 1665, 1730),
    COHORT_1000_1100(1000, 1100, 1730, 1795),
    COHORT_1100_1200(1100, 1200, 1795, 1850),
    COHORT_1200_1300(1200, 1300, 1850, 1910),
    COHORT_1300_1400(1300, 1400, 1910, 1970),
    COHORT_1400_1500(1400, 1500, 1970, 2030),
    COHORT_1500_1600(1500, 1600, 2030, 2090),
    COHORT_1600_1700(1600, 1700, 2090, 2150),
    COHORT_1700_1800(1700, 1800, 2150, 2225),
    COHORT_1800_1900(1800, 1900, 2225, 2310),
    COHORT_1900_2000(1900, 2000, 2310, 2370),
    COHORT_2000_2100(2000, 2100, 2370, 2410),
    COHORT_2100_2200(2100, 2200, 2410, 2440),
    COHORT_2200_2300(2200, 2300, 2440, 2500),
    COHORT_2300_2400(2300, 2400, 2500, 2640),
    COHORT_2400_MAX(2400, 4000, 2600, 4000);

    private final int start;
    private final int end;

    private final int LichessConvertStart;
    private final int LichessConvertEnd;

    /**
     * Constructor for CohortRange.
     * @param start The start of the cohort range.
     * @param end The end of the cohort range.
     * @param LiStart The start of the Lichess conversion range.
     * @param LiEnd The end of the Lichess conversion range.
     */
    CohortRange(int start, int end, int LiStart, int LiEnd) {
        this.start = start;
        this.end = end;
        this.LichessConvertStart = LiStart;
        this.LichessConvertEnd = LiEnd;

    }


    /**
     * Gets the start of the cohort range.
     * @return The start of the cohort range.
     */
    public int getStart() {
        return start;
    }

    /**
     * Gets the end of the cohort range.
     * @return The end of the cohort range.
     */
    public int getEnd() {
        return end;
    }

    /**
     * Checks if a target is within a given range.
     * @param lowerBound The lower bound of the range.
     * @param upperBound The upper
     * @param target The target value.
     * @return True if the target is within the range, false otherwise.
     */

    public static boolean isInRange(int lowerBound, int upperBound, int target) {
        return target >= lowerBound && target <= upperBound;
    }


    /**
     * Gets the time control of a tournament for this cohort
     * @return The time control of the tournament.
     */
    public int getTimeControl(){
        if(getStart() <= 700){
            return 30;
        } else if(isInRange(800, 1100, start)){
            return 30;
        } else if(isInRange(1200, 1500, start)){
            return 45;
        } else if(isInRange(1600, 1900, start)){
            return 60;
        } else if (isInRange(2000, 2300, start)){
            return 90;
        }

        return -1;
    }

    /**
     * Gets the time increment of a tournament for this cohort
     * @return The time increment of the tournament.
     */
    public int getTimeIncrement(){
        if(getStart() <= 700){
            return 0;
        } else if(isInRange(800, 1200, start)){
            return 30;
        } else if(isInRange(1200, 1600, start)){
            return 30;
        } else if(isInRange(1600, 2300, start)){
            return 30;
        }

        return -1;
    }

    /**
     * gets the String representation of the cohort range.
     * @return The string representation of the cohort range.
     */
    @Override
    public String toString() {
        return String.format("COHORT_%d_%d", start, end);
    }


    /**
     * Finds the cohort range given the start and end values.
     * @param start The start of the cohort range.
     * @param end The end of the cohort range.
     * @return The cohort range.
     */
    public static CohortRange findCohortRange(int start, int end) {
        for (CohortRange cohort : CohortRange.values()) {
            if (cohort.getStart() == start && cohort.getEnd() == end) {
                return cohort;
            }
        }
        return null;
    }


}