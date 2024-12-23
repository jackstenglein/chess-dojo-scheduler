package com.serverless.playerdata;

/**
 * This class represents a player data that will be used for registration in OOP manner
 */
public class PlayerData {

    private final String dojoUsername;
    private final String Lichessname;
    private final String Chesscomname;
    private final String Discordid;
    private final int cohort;
    private final String Discordname;

    public PlayerData(int cohort, String discordid, String Discordname, String chesscomname, String lichessname, String dojoUsername) {
        this.cohort = cohort;
        this.Discordid = discordid;
        this.Discordname = Discordname;
        this.Chesscomname = chesscomname;
        this.Lichessname = lichessname;
        this.dojoUsername = dojoUsername;
    }

    public String getDiscordname() {
        return Discordname;
    }

    public int getCohort() {
        return cohort;
    }

    public String getDojoUsername() {
        return dojoUsername;
    }

    @Override
    public String toString() {
        return "PlayerData{" +
                "dojoUsername='" + dojoUsername + '\'' +
                ", Lichessname='" + Lichessname + '\'' +
                ", Chesscomname='" + Chesscomname + '\'' +
                ", Discordid='" + Discordid + '\'' +
                ", cohort=" + cohort +
                ", Discordname='" + Discordname + '\'' +
                '}';
    }

    public String getLichessname() {
        return Lichessname;
    }

    public String getChesscomname() {
        return Chesscomname;
    }

    public String getDiscordid() {
        return Discordid;
    }
}
