package Handler;

import java.util.List;


/**
 * The enum Cohort range.
 */
public enum CohortRange {
    /**
     * Cohort 0 300 cohort range.
     */
    COHORT_0_300(0, 300, 0, 1250),
    /**
     * Cohort 300 400 cohort range.
     */
    COHORT_300_400(300, 400, 1250, 1310),
    /**
     * Cohort 400 500 cohort range.
     */
    COHORT_400_500(400, 500, 1310, 1370),
    /**
     * Cohort 500 600 cohort range.
     */
    COHORT_500_600(500, 600, 1370, 1435),
    /**
     * Cohort 600 700 cohort range.
     */
    COHORT_600_700(600, 700, 1435, 1500),
    /**
     * Cohort 700 800 cohort range.
     */
    COHORT_700_800(700, 800, 1500, 1550),
    /**
     * Cohort 800 900 cohort range.
     */
    COHORT_800_900(800, 900, 1550, 1665),
    /**
     * Cohort 900 1000 cohort range.
     */
    COHORT_900_1000(900, 1000, 1665, 1730),
    /**
     * Cohort 1000 1100 cohort range.
     */
    COHORT_1000_1100(1000, 1100, 1730, 1795),
    /**
     * Cohort 1100 1200 cohort range.
     */
    COHORT_1100_1200(1100, 1200, 1795, 1850),
    /**
     * Cohort 1200 1300 cohort range.
     */
    COHORT_1200_1300(1200, 1300, 1850, 1910),
    /**
     * Cohort 1300 1400 cohort range.
     */
    COHORT_1300_1400(1300, 1400, 1910, 1970),
    /**
     * Cohort 1400 1500 cohort range.
     */
    COHORT_1400_1500(1400, 1500, 1970, 2030),
    /**
     * Cohort 1500 1600 cohort range.
     */
    COHORT_1500_1600(1500, 1600, 2030, 2090),
    /**
     * Cohort 1600 1700 cohort range.
     */
    COHORT_1600_1700(1600, 1700, 2090, 2150),
    /**
     * Cohort 1700 1800 cohort range.
     */
    COHORT_1700_1800(1700, 1800, 2150, 2225),
    /**
     * Cohort 1800 1900 cohort range.
     */
    COHORT_1800_1900(1800, 1900, 2225, 2310),
    /**
     * Cohort 1900 2000 cohort range.
     */
    COHORT_1900_2000(1900, 2000, 2310, 2370),
    /**
     * Cohort 2000 2100 cohort range.
     */
    COHORT_2000_2100(2000, 2100, 2370, 2410),
    /**
     * Cohort 2100 2200 cohort range.
     */
    COHORT_2100_2200(2100, 2200, 2410, 2440),
    /**
     * Cohort 2200 2300 cohort range.
     */
    COHORT_2200_2300(2200, 2300, 2440, 2500),
    /**
     * Cohort 2300 2400 cohort range.
     */
    COHORT_2300_2400(2300, 2400, 2500, 2640),
    /**
     * Cohort 2400 max cohort range.
     */
    COHORT_2400_MAX(2400, 4000, 2600, 4000);

    private final int start;
    private final int end;

    private final int LichessConvertStart;
    private final int LichessConvertEnd;


    CohortRange(int start, int end, int LiStart, int LiEnd) {
        this.start = start;
        this.end = end;
        this.LichessConvertStart = LiStart;
        this.LichessConvertEnd = LiEnd;

    }


    /**
     * Gets start.
     *
     * @return the start
     */
    public int getStart() {
        return start;
    }

    /**
     * Gets end.
     *
     * @return the end
     */
    public int getEnd() {
        return end;
    }


    /**
     * Is in range boolean.
     *
     * @param lowerBound the lower bound
     * @param upperBound the upper bound
     * @param target     the target
     * @return the boolean
     */
    public boolean isInRange(int lowerBound, int upperBound, int target) {
        return target >= lowerBound && target <= upperBound;
    }


    /**
     * Get chess com rapid conversion start int.
     *
     * @return the int
     */
    public int getChessComRapidConversionStart(){
        switch(getStart()){
            case 0 -> {
                return 0;
            }
            case 1900 -> {
                return 2165;
            }
            case 2000 -> {
                return 2275;
            }
            case 2100 -> {
                return 2360;
            }
            case 2200 -> {
                return 2425;
            }
            case 2300 -> {
                return 2485;
            }
            case 2400 -> {
                return 2550;
            }
            default -> {
                return getStart() + 250;
            }
        }
    }


    /**
     * Get chess com rapid conversion end int.
     *
     * @return the int
     */
    public int getChessComRapidConversionEnd(){
        switch (getStart()){
            case 0 -> {
                return 550;
            }
            case 1800 -> {
                return 2165;
            }
            case 1900 -> {
                return 2275;
            }
            case 2000 -> {
                return 2360;
            }
            case 2100 -> {
                return 2425;
            }
            case 2200 -> {
                return 2485;
            }
            case 2300 -> {
                return 2550;
            }
            default -> {
                return getChessComRapidConversionStart() + 100;
            }
        }
    }


    /**
     * Get lichess classical conversion start int.
     *
     * @return the int
     */
    public int getLichessClassicalConversionStart(){
        return LichessConvertStart;

    }

    /**
     * Get lichess classical conversion end int.
     *
     * @return the int
     */
    public int getLichessClassicalConversionEnd(){
        return LichessConvertEnd;
    }


    /**
     * Get time control int.
     *
     * @return the int
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
     * Get time increment int.
     *
     * @return the int
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

    @Override
    public String toString() {
        return String.format("COHORT_%d_%d", start, end);
    }


    /**
     * Find cohort range cohort range.
     *
     * @param start the start
     * @param end   the end
     * @return the cohort range
     */
    public static CohortRange findCohortRange(int start, int end) {
        for (CohortRange cohort : CohortRange.values()) {
            if (cohort.getStart() == start && cohort.getEnd() == end) {
                return cohort;
            }
        }
        return null;
    }

    /**
     * Get cohort range for lichess rating cohort range.
     *
     * @param LichessRating the lichess rating
     * @return the cohort range
     */
    public static CohortRange getCohortRangeForLichessRating(int LichessRating){
        for(CohortRange cohort: CohortRange.values()){
            if(cohort.isLichessClassicalCohortRatingInRange(LichessRating)){
                return cohort;
            }
        }
        return null;
    }

    /**
     * Get cohort range for chess com rating cohort range.
     *
     * @param ChessComRating the chess com rating
     * @return the cohort range
     */
    public static CohortRange getCohortRangeForChessComRating(int ChessComRating){
        for(CohortRange cohort: CohortRange.values()){
            if(cohort.isChessComRapidCohortRatingInRange(ChessComRating)){
                return cohort;
            }
        }

        return null;
    }


    /**
     * Get discord cohort name string.
     *
     * @return the string
     */
    public String getDiscordCohortName(){
        if(this == COHORT_2400_MAX){
            return "2400+";
        }else{
            return start + "-" + end;
        }
    }




    /**
     * Get max cohort per platform cohort range.
     *
     * @param ChessComRating the chess com rating
     * @param LichessRating  the lichess rating
     * @return the cohort range
     */
    public static CohortRange getMaxCohortPerPlatform(int ChessComRating, int LichessRating){

        CohortRange LichessCohort = getCohortRangeForLichessRating(LichessRating);
        CohortRange ChessComCohort = getCohortRangeForChessComRating(ChessComRating);

        if(LichessCohort != null && ChessComCohort != null){
            if(LichessCohort.getStart() == ChessComCohort.getStart() && LichessCohort.getEnd() == ChessComCohort.getEnd()){
                return LichessCohort;
            }else if(LichessCohort.getStart() > ChessComCohort.getStart() && LichessCohort.getEnd() > ChessComCohort.getEnd()){
                return LichessCohort;
            }else if(ChessComCohort.getStart() > LichessCohort.getStart() && ChessComCohort.getEnd() > LichessCohort.getEnd()){
                return ChessComCohort;
            }
        }

        return null;

    }


    /**
     * Is lichess classical cohort rating in range boolean.
     *
     * @param LichessRating the lichess rating
     * @return the boolean
     */
    public boolean isLichessClassicalCohortRatingInRange(int LichessRating){
        return isInRange(getLichessClassicalConversionStart(), getLichessClassicalConversionEnd(), LichessRating);
    }


    /**
     * Is chess com rapid cohort rating in range boolean.
     *
     * @param ChessComRating the chess com rating
     * @return the boolean
     */
    public boolean isChessComRapidCohortRatingInRange(int ChessComRating){
        return isInRange(getChessComRapidConversionStart(), getChessComRapidConversionEnd(), ChessComRating);
    }


}