package com.serverless.register;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.*;
import com.serverless.playerdata.PlayerData;
import com.serverless.playerdata.SampleData;
import com.serverless.roundrobin.CohortRange;
import com.serverless.roundrobin.CreateRoundRobin;
import com.serverless.roundrobin.RoundRobinException;
import static org.junit.jupiter.api.Assertions.*;
import io.github.cdimascio.dotenv.Dotenv;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

class RegisterHandlerTest {

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

        if(RRcollection.countDocuments() > 1 && RRplayercollection.countDocuments() > 1){
            System.out.println("Data loaded");
        }else{

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

    /**
     * Create test sample test tournament
     * @throws IOException
     * @throws RoundRobinException
     */
    @Test
    void registertest1() throws IOException, RoundRobinException {
        CreateRoundRobin createRoundRobin = new CreateRoundRobin(10);
        CohortRange cohort = CohortRange.COHORT_1900_2000;

        createRoundRobin.createNewRoundRobinTournament(cohort, false, RRcollection);

        for(int i = 0; i < 10; i++){
            PlayerData playern = data.getRandomPlayerAllDifferent(cohort.getStart());
            System.out.println(playern);
            RegisterHandler registerDesk = new RegisterHandler(RRplayercollection, RRcollection);
            String mesg = registerDesk.playerRegister(playern.getDiscordid(), playern.getDiscordname(), playern.getCohort(), playern.getLichessname(), playern.getChesscomname(), playern.getDojoUsername());
            System.out.println(mesg);
            assertTrue(mesg.toLowerCase().contains("success"));
        }

        PlayerData playern = data.getRandomPlayerAllDifferent(cohort.getStart());
        System.out.println(playern);
        RegisterHandler registerDesk = new RegisterHandler(RRplayercollection, RRcollection);
        String mesg = registerDesk.playerRegister(playern.getDiscordid(), playern.getDiscordname(), playern.getCohort(), playern.getLichessname(), playern.getChesscomname(), playern.getDojoUsername());
        System.out.println(mesg);
        assertTrue(mesg.toLowerCase().contains("success"));

    }

    /**
     * Test null string data should get IO exception
     * @throws IOException
     * @throws RoundRobinException
     */
    @Test
    void registertest2() throws IOException, RoundRobinException {
        try{
            CreateRoundRobin createRoundRobin = new CreateRoundRobin(10);
            CohortRange cohort = CohortRange.COHORT_700_800;

            createRoundRobin.createNewRoundRobinTournament(cohort, false, RRcollection);
            for(int i = 0; i < 10; i++){
                PlayerData playern = data.getRandomPlayerNullData(cohort.getStart());
                System.out.println(playern);
                RegisterHandler registerDesk = new RegisterHandler(RRplayercollection, RRcollection);
                String message = registerDesk.playerRegister(playern.getDiscordid(), playern.getDiscordname(), playern.getCohort(), playern.getLichessname(), playern.getChesscomname(), playern.getDojoUsername());

            }
        } catch (Exception e) {
            assertEquals("Lichess or Chess.com account name must be provided", e.getMessage());
        }
    }

    /**
     * Test empty data should get IO exception
     * @throws IOException
     * @throws RoundRobinException
     */
    @Test
    void registertest3() throws IOException, RoundRobinException {
        try{
            CreateRoundRobin createRoundRobin = new CreateRoundRobin(10);
            CohortRange cohort = CohortRange.COHORT_700_800;

            createRoundRobin.createNewRoundRobinTournament(cohort, false, RRcollection);
            for(int i = 0; i < 10; i++){
                PlayerData playern = data.getRandomPlayerEmptyData(cohort.getStart());
                System.out.println(playern);
                RegisterHandler registerDesk = new RegisterHandler(RRplayercollection, RRcollection);
                String message = registerDesk.playerRegister(playern.getDiscordid(), playern.getDiscordname(), playern.getCohort(), playern.getLichessname(), playern.getChesscomname(), playern.getDojoUsername());
                //assertTrue(message.contains("success"));
            }
        }catch (IOException e){
            assertEquals("Lichess or Chess.com account name must be provided", e.getMessage());
        }
    }

    /**
     * Create half of running tournament
     * @throws IOException
     * @throws RoundRobinException
     */
    @Test
    void registertest4() throws IOException, RoundRobinException {
        try{
            CreateRoundRobin createRoundRobin = new CreateRoundRobin(10);
            CohortRange cohort = CohortRange.COHORT_2200_2300;
            RegisterHandler registerDesk = new RegisterHandler(RRplayercollection, RRcollection);

            //createRoundRobin.createNewRoundRobinTournament(cohort, false, RRcollection);
            for(int i = 0; i < 7; i++){
                PlayerData playern = data.getRandomPartialCCNullData(cohort.getStart());
                System.out.println(playern);
                String mesg = registerDesk.playerRegister(playern.getDiscordid(), playern.getDiscordname(), playern.getCohort(), playern.getLichessname(), playern.getChesscomname(), playern.getDojoUsername());
                assertTrue(mesg.contains("success"));
            }
        }catch (Exception e){
            assertEquals("The following cohort ranges [2200, 2300, 2100] Round Robin tournaments is filled", e.getMessage());
        }
    }

    /**
     * Should get tournament is filled up exception
     * @throws IOException
     * @throws RoundRobinException
     */
    @Test
    void registertest5() throws IOException, RoundRobinException {
        try{
            CohortRange cohort = CohortRange.COHORT_1900_2000;

            RegisterHandler registerDesk = new RegisterHandler(RRplayercollection, RRcollection);

            PlayerData playerweak = data.getRandomPlayerAllDifferent(cohort.getStart()-300);

            String message = registerDesk.playerRegister(playerweak.getDiscordid(), playerweak.getDiscordname(), playerweak.getCohort(), playerweak.getLichessname(), playerweak.getChesscomname(), playerweak.getDojoUsername());

            System.out.println(message);

            PlayerData playerStrong = data.getRandomPartialLichessNullData(cohort.getStart()+300);

            String message2 = registerDesk.playerRegister(playerStrong.getDiscordid(), playerStrong.getDiscordname(), playerStrong.getCohort(), playerStrong.getLichessname(), playerStrong.getChesscomname(), playerweak.getDojoUsername());

            System.out.println(message2);
        }catch (Exception e){
            assertEquals("The following cohort ranges [1600, 1700, 1500] Round Robin tournaments is filled", e.getMessage());
        }
    }

    @AfterAll
    static void tearDown(){
        RRplayercollection.deleteMany(new Document());
        RRcollection.deleteMany(new Document());
    }





}