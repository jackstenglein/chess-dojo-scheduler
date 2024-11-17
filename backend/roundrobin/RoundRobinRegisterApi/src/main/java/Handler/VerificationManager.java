package Handler;


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

    /**
     * Verifies the user's Lichess profile by checking if the provided Discord ID matches the one stored in the Lichess profile location field.
     * If the verification is successful, sends a message indicating that the user has been verified for Lichess.
     * If the verification fails, sends a message with instructions on how to add the Discord ID to the Lichess profile location field and run the /verify command again.
     *
     * @param Lichessname the Lichess username of the user to be verified
     * @param DiscordId   the Discord ID of the user to be verified
     */
    public boolean verificationStatus(String Lichessname, String DiscordId){
        boolean checkClosed = client.users().byId(Lichessname).get().disabled();
        boolean checkTOSViolation = client.users().byId(Lichessname).get().tosViolation();

        if(checkClosed || checkTOSViolation){
            return false;
        }

        String checkDiscordId =  client.users().byId(Lichessname).get().profile().location().orElse("");

        return checkDiscordId.equalsIgnoreCase(DiscordId);
    }

    /**
     * Verification status chesscom.
     *
     * @param ccname    the ccname
     * @param DiscordId the discord id
     * @throws ChessComPubApiException the chess com pub api exception
     * @throws IOException             the io exception
     */
    public boolean verificationStatusChesscom(String ccname, String DiscordId) throws ChessComPubApiException, IOException {
        String checkDiscordId =  playerClient.getPlayerByUsername(ccname).getLocation();

        String isNotAllowed = playerClient.getPlayerByUsername(ccname).getMembershipStatus().toString().toLowerCase();


        if(isNotAllowed.contains("closed")){
            return false;
        }

        return checkDiscordId != null && checkDiscordId.equalsIgnoreCase(DiscordId);
    }

    /**
     * User present normal boolean.
     *
     * @param collection the collection
     * @param discordId  the discord id
     * @return the boolean
     */
    public boolean userPresentNormal(MongoCollection<Document> collection, String discordId){
        Document query = new Document("Discordid", discordId);
        FindIterable<Document> result = collection.find(query);
        return result.iterator().hasNext();
    }

    /**
     * Get general search based on params string.
     *
     * @param targetSearch the target search
     * @param targetID     the target id
     * @param collection   the collection
     * @param returnId     the return id
     * @return the string
     */
    public String getGeneralSearchBasedOnParams(String targetSearch, String targetID, MongoCollection<Document> collection, String returnId){
        Document query = new Document(targetSearch, targetID);

        Document result = collection.find(query).first();

        if(result != null){

            return result.getString(returnId);

        }else{
            return "null";
        }
    }


    /**
     * Get reletated lichess name string.
     *
     * @param DiscordId  the discord id
     * @param collection the collection
     * @return the string
     */
    public String getReletatedLichessName(String DiscordId, MongoCollection<Document> collection){

        return getGeneralSearchBasedOnParams("Discordid", DiscordId, collection, "Lichessname");

    }

    /**
     * Get reletated chess name string.
     *
     * @param DiscordId  the discord id
     * @param collection the collection
     * @return the string
     */
    public String getReletatedChessName(String DiscordId, MongoCollection<Document> collection){

        return getGeneralSearchBasedOnParams("Discordid", DiscordId, collection, "Chesscomname");

    }



}
