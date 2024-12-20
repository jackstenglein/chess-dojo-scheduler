package com.serverless.game;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.*;
import com.mongodb.client.model.Updates;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import io.github.cdimascio.dotenv.Dotenv;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class GameHandlerTest {


    static MongoCollection<Document> RRcollection = null;

    static MongoCollection<Document> RRplayercollection = null;


    public static final Dotenv dotenv = Dotenv.load();

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

        if(RRcollection.countDocuments() > 1 && RRplayercollection.countDocuments() > 1){
            System.out.println("Data loaded");
        }else{

            MongoCollection<Document> sourceCollectiont = database.getCollection("rr-tournaments ");
            MongoCollection<Document> targetCollectiont = database.getCollection("rr-tournaments-beta");


            FindIterable<Document> documentst = sourceCollectiont.find();


            List<Document> documentListt = new ArrayList<>();
            for (Document doc : documentst) {
                documentListt.add(doc);
            }


            if (!documentListt.isEmpty()) {
                targetCollectiont.insertMany(documentListt);
                System.out.println("Data copied successfully from " + "Prod-tournaments" + " to " + "Beta-tournaments");
            } else {
                System.out.println("Source collection is empty.");
            }

            MongoCollection<Document> sourceCollection = database.getCollection("rr-players");
            MongoCollection<Document> targetCollection = database.getCollection("rr-players-beta");

            FindIterable<Document> documents = sourceCollection.find();


            List<Document> documentList = new ArrayList<>();
            for (Document doc : documents) {
                documentList.add(doc);
            }


            if (!documentList.isEmpty()) {
                targetCollection.insertMany(documentList);
                System.out.println("Data copied successfully from " + "Prod-players" + " to " + "Beta-players");
            } else {
                System.out.println("Source collection is empty.");
            }


        }

    }

    @Test
    void testLichessGameSubmission(){
        RRcollection.updateOne(
                new Document("players", "capa_a"),
                Updates.pull("game-submissions", "https://lichess.org/u7Vmvq2N")
        );
        GameHandler handler = new GameHandler(RRplayercollection, RRcollection, "capa_a", "capa_a", "https://lichess.org/u7Vmvq2N");
        String res = handler.handleGameRequest();
        assertEquals("Successfully computed the scores for the game URL: https://lichess.org/u7Vmvq2N", res);
    }

    @Test
    void testChessComGameSubmission(){
        RRcollection.updateOne(
                new Document("players", "capa_a"),
                Updates.pull("game-submissions", "https://www.chess.com/game/live/125540296097")
        );
        GameHandler handler = new GameHandler(RRplayercollection, RRcollection, "capa_a", "capa_a", "https://www.chess.com/game/live/125540296097");
        String res = handler.handleGameRequest();
        System.out.println(res);
        assertEquals("Successfully computed the scores for the game URL: https://www.chess.com/game/live/125540296097", res);

    }

    @Test
    void testNotWrongURL(){
        GameHandler handler = new GameHandler(RRplayercollection, RRcollection, "capa_a", "capa_a", "https://www.chessdojo.club/games/1800-1900/2024.11.17_28489435-0bf3-400f-8259-b37adcb2366f");
        String res = handler.handleGameRequest();
        assertEquals("Invalid game URL, games must be Lichess/Chess.com game", res);
    }


    @AfterAll
    static void tearDown(){
        RRplayercollection.deleteMany(new Document());
        RRcollection.deleteMany(new Document());
    }





}