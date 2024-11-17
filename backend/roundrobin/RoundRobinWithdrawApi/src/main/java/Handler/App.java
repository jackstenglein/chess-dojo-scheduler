package Handler;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.ServerApi;
import com.mongodb.ServerApiVersion;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

import java.io.IOException;
import java.util.Map;

/**
 * The type App.
 */
public class App implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * The Connection string.
     */
    String connectionString = System.getenv("CONNECTION_STRING");

    /**
     * The Server api.
     */
    ServerApi serverApi = ServerApi.builder()
            .version(ServerApiVersion.V1)
            .build();

    /**
     * The Settings.
     */
    MongoClientSettings settings = MongoClientSettings.builder()
            .applyConnectionString(new ConnectionString(connectionString))
            .serverApi(serverApi)
            .build();

    /**
     * The Mongo client.
     */
    MongoClient mongoClient = MongoClients.create(settings);
    /**
     * The Database.
     */
    MongoDatabase database = mongoClient.getDatabase("Lisebot-database");
    /**
     * The R rcollection.
     */
    MongoCollection<Document> RRcollection = database.getCollection("rr-tournaments ");

    /**
     * The R rplayercollection.
     */
    MongoCollection<Document> RRplayercollection = database.getCollection("rr-players");




    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent requestEvent, Context context) {

        Map<String, String> queryParams = requestEvent.getQueryStringParameters();

        String res = "";


        // client sends the following
        // Discordname
        String discordname = queryParams.get("discordname");
        // dojoUsername
        String dojousername = queryParams.get("dojousername");

        try{
            RegisterHandler handler = new RegisterHandler(RRplayercollection, RRcollection, discordname, dojousername);
            res = handler.playerWithdraw();
        } catch (Exception e) {
           createErrorResponse(e.getMessage());
        }


        // Construct the response
        APIGatewayProxyResponseEvent apiResponse = new APIGatewayProxyResponseEvent();

        Response response = new Response();
        response.setMessage(res);

        try {
            // Convert response object to JSON string
            String responseBody = objectMapper.writeValueAsString(response);
            apiResponse.setBody(responseBody);
            apiResponse.setStatusCode(200);
            apiResponse.setHeaders(Map.of("Content-Type", "application/json"));
            apiResponse.setHeaders(Map.of("Access-Control-Allow-Origin", "*"));

        } catch (IOException e) {
            context.getLogger().log("Error converting response to JSON: " + e.getMessage());
            apiResponse.setStatusCode(500);
            apiResponse.setBody("{\"message\": \"Internal Server Error\"}");
            apiResponse.setHeaders(Map.of("Content-Type", "application/json"));
            apiResponse.setHeaders(Map.of("Access-Control-Allow-Origin", "*"));
        }

        return apiResponse;
    }

    // Helper method to create error response
    private APIGatewayProxyResponseEvent createErrorResponse(String errorMessage) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(400); // Bad Request
        response.setBody("{\"message\": \"" + errorMessage + "\"}");
        response.setHeaders(Map.of("Content-Type", "application/json")); // Set content type header
        return response;
    }


}

