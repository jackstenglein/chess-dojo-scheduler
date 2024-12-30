package com.serverless.withdraw;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.*;
import com.serverless.playerdata.SampleData;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import java.util.ArrayList;
import java.util.List;

public class WithdrawHandlerTest {

    static MongoCollection<Document> RRcollection = null;

    static MongoCollection<Document> RRplayercollection = null;

    public static final Dotenv dotenv = Dotenv.load();

    SampleData data = new SampleData();

    @BeforeAll
    static void setUp() {
        ServerApi serverApi = ServerApi.builder()
                .version(ServerApiVersion.V1)
                .build();

        String connectionString = dotenv.get("CONNECTION_STRING");

        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(connectionString))
                .serverApi(serverApi)
                .build();

        MongoClient mongoClient = MongoClients.create(settings);

        MongoDatabase database = mongoClient.getDatabase("Lisebot-database");

        RRcollection = database.getCollection("rr-tournaments-beta");

        RRplayercollection = database.getCollection("rr-players-beta");

        if (RRcollection.countDocuments() > 1 && RRplayercollection.countDocuments() > 1) {
            System.out.println("Data loaded");
        } else {

            MongoCollection<Document> sourceCollectiont = database.getCollection("rr-tournaments ");
            MongoCollection<Document> targetCollectiont = database.getCollection("rr-tournaments-beta");

            // Fetch all documents from source collection
            FindIterable<Document> documentst = sourceCollectiont.find();

            // Collect documents into a list
            List<Document> documentListt = new ArrayList<>();
            for (Document doc : documentst) {
                documentListt.add(doc);
            }

            // Insert documents into the target collection
            if (!documentListt.isEmpty()) {
                targetCollectiont.insertMany(documentListt);
                System.out.println("Data copied successfully from " + "Prod-tournaments" + " to " + "Beta-tournaments");
            } else {
                System.out.println("Source collection is empty.");
            }

            MongoCollection<Document> sourceCollection = database.getCollection("rr-players");
            MongoCollection<Document> targetCollection = database.getCollection("rr-players-beta");

            // Fetch all documents from source collection
            FindIterable<Document> documents = sourceCollection.find();

            // Collect documents into a list
            List<Document> documentList = new ArrayList<>();
            for (Document doc : documents) {
                documentList.add(doc);
            }

            // Insert documents into the target collection
            if (!documentList.isEmpty()) {
                targetCollection.insertMany(documentList);
                System.out.println("Data copied successfully from " + "Prod-players" + " to " + "Beta-players");
            } else {
                System.out.println("Source collection is empty.");
            }

        }

    }

    @Test
    void withdrawtest1() {
        WithdrawHandler withdrawHandler = new WithdrawHandler(RRplayercollection, RRcollection, "capa_a", "capa_a");
        String message = withdrawHandler.playerWithdraw();
        System.out.println(message);
        assertTrue(message.contains("capa_a") && message.toLowerCase().contains("success"));
    }

    // @Test
    // void withdrawtest2(){
    // WithdrawHandler withdrawHandler = new WithdrawHandler(RRplayercollection,
    // RRcollection, "falk312", "falk312");
    // String message = withdrawHandler.playerWithdraw();
    // System.out.println(message);
    // assertEquals("Successfully withdrew the player: falk312", message);
    //
    // }

    @AfterAll
    static void tearDown() {
        RRplayercollection.deleteMany(new Document());
        RRcollection.deleteMany(new Document());
    }

}