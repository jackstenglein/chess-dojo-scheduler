package com.serverless.Integration;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.*;
import com.mongodb.client.model.Updates;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;

import java.util.ArrayList;
import java.util.List;
import io.restassured.RestAssured;
import io.restassured.http.ContentType;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;



public class Integrationtest {

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

        RestAssured.baseURI = "http://127.0.0.1:3000";

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
    public void testRegisterPlayer() {
        given()
                .contentType(ContentType.JSON)
                .queryParam("mode", "register")
                .queryParam("discordname", "intetestuser1")
                .queryParam("discordid", "intetestuser1")
                .queryParam("lichessname", "yoyothisislichesstest")
                .queryParam("chesscomname", "yoyoyothisiscctest")
                .queryParam("cohortstart", 300)
                .queryParam("dojousername", "intetestuser1")
                .when()
                .get("/player")
                .then()
                .statusCode(200)
                .body("message", equalTo("Registration Successful! You be notified when the Round Robin starts!")); // Example assertion

    }

    @Test
    public void testRegisterPlayerEmpty() {
        given()
                .contentType(ContentType.JSON)
                .queryParam("mode", "register")
                .queryParam("discordname", "")
                .queryParam("discordid", "")
                .queryParam("lichessname", "")
                .queryParam("chesscomname", "")
                .queryParam("cohortstart", 300)
                .queryParam("dojousername", "")
                .when()
                .get("/player")
                .then()
                .statusCode(400);
    }

    @Test
    public void testRegisterPlayerNull() {
        given()
                .contentType(ContentType.JSON)
                .queryParam("mode", "register")
                .queryParam("discordname", "")
                .queryParam("discordid", "")
                .queryParam("lichessname", "")
                .queryParam("chesscomname", "")
                .queryParam("cohortstart", 300)
                .queryParam("dojousername", "null")
                .when()
                .get("/player")
                .then()
                .statusCode(400);
    }


    @Test
    public void testWithdrawPlayer() {
        given()
                .contentType(ContentType.JSON)
                .queryParam("mode", "withdraw")
                .queryParam("discordname", "intetestuser1")
                .queryParam("dojousername", "intetestuser1")
                .when()
                .get("/player")
                .then()
                .statusCode(200)
                .body("message", equalTo( "Successfully withdrew the player: " + "intetestuser1"));
    }


    @Test
    public void testSubmitGame() {
        RRcollection.updateOne(
                new Document("players", "capa_a"),
                Updates.pull("game-submissions", "https://lichess.org/u7Vmvq2N")
        );
        given()
                .contentType(ContentType.JSON)
                .queryParam("mode", "game")
                .queryParam("discordname", "capa_a")
                .queryParam("dojousername", "capa_a")
                .queryParam("gameurl", "https://lichess.org/u7Vmvq2N")
                .when()
                .get("/player")
                .then()
                .statusCode(200)
                .body("message", equalTo("Successfully computed the scores for the game URL: " + "https://lichess.org/u7Vmvq2N"));
    }

    @AfterAll
    static void tearDown(){
        RRplayercollection.deleteMany(new Document());
        RRcollection.deleteMany(new Document());
    }







}
