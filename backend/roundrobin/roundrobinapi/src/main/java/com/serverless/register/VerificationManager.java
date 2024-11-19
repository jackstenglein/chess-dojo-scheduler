package com.serverless.register;


import chariot.Client;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoCollection;
import io.github.sornerol.chess.pubapi.client.PlayerClient;
import io.github.sornerol.chess.pubapi.exception.ChessComPubApiException;
import org.bson.Document;


import java.io.IOException;
public class VerificationManager {

    private final Client client = Client.basic();

    private final PlayerClient playerClient = new PlayerClient();

    public boolean verificationStatus(String Lichessname, String DiscordId){
        boolean checkClosed = client.users().byId(Lichessname).get().disabled();
        boolean checkTOSViolation = client.users().byId(Lichessname).get().tosViolation();

        if(checkClosed || checkTOSViolation){
            return false;
        }

        String checkDiscordId =  client.users().byId(Lichessname).get().profile().location().orElse("");

        return checkDiscordId.equalsIgnoreCase(DiscordId);
    }

    public boolean verificationStatusChesscom(String ccname, String DiscordId) throws ChessComPubApiException, IOException {
        String checkDiscordId =  playerClient.getPlayerByUsername(ccname).getLocation();

        String isNotAllowed = playerClient.getPlayerByUsername(ccname).getMembershipStatus().toString().toLowerCase();


        if(isNotAllowed.contains("closed")){
            return false;
        }

        return checkDiscordId != null && checkDiscordId.equalsIgnoreCase(DiscordId);
    }

    public boolean userPresentNormal(MongoCollection<Document> collection, String discordId){
        Document query = new Document("Discordid", discordId);
        FindIterable<Document> result = collection.find(query);
        return result.iterator().hasNext();
    }

    public String getGeneralSearchBasedOnParams(String targetSearch, String targetID, MongoCollection<Document> collection, String returnId){
        Document query = new Document(targetSearch, targetID);

        Document result = collection.find(query).first();

        if(result != null){

            return result.getString(returnId);

        }else{
            return "null";
        }
    }


    public String getReletatedLichessName(String DiscordId, MongoCollection<Document> collection){

        return getGeneralSearchBasedOnParams("Discordid", DiscordId, collection, "Lichessname");

    }

    public String getReletatedChessName(String DiscordId, MongoCollection<Document> collection){

        return getGeneralSearchBasedOnParams("Discordid", DiscordId, collection, "Chesscomname");

    }



}
