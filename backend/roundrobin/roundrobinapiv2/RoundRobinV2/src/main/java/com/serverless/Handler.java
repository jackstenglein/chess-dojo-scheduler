package com.serverless;

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
import com.serverless.game.GameHandler;
import com.serverless.register.RegisterHandler;
import com.serverless.withdraw.WithdrawHandler;
import org.bson.Document;

import java.util.Map;

public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private static final String CONNECTION_STRING = System.getenv("CONNECTION_STRING");
    private static final boolean IS_BETA = System.getenv("ENV").equalsIgnoreCase("beta");

    private final MongoClient mongoClient;
    private final MongoCollection<Document> RRcollection;
    private final MongoCollection<Document> RRplayercollection;

    public Handler() {
        ServerApi serverApi = ServerApi.builder().version(ServerApiVersion.V1).build();
        MongoClientSettings settings = MongoClientSettings.builder()
                .applyConnectionString(new ConnectionString(CONNECTION_STRING))
                .serverApi(serverApi)
                .build();
        this.mongoClient = MongoClients.create(settings);
        MongoDatabase database = mongoClient.getDatabase("Lisebot-database");
        this.RRcollection = database.getCollection(IS_BETA ? "rr-tournaments-beta" : "rr-tournaments");
        this.RRplayercollection = database.getCollection(IS_BETA ? "rr-players-beta" : "rr-players");
    }

    /**
     * Handles the incoming request and routes it to the appropriate handler based
     * on the mode.
     * 
     * @param requestEvent The incoming request event.
     * @param context      The Lambda context.
     * @return The response event.
     */
    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent requestEvent, Context context) {
        Map<String, String> queryParams = requestEvent.getQueryStringParameters();
        String mode = queryParams.get("mode");
        String responseMessage;

        try {
            switch (mode) {
                case "register":
                    responseMessage = handleRegister(queryParams);
                    break;
                case "withdraw":
                    responseMessage = handleWithdraw(queryParams);
                    break;
                case "game":
                    responseMessage = handleGame(queryParams);
                    break;
                default:
                    return createErrorResponse("Invalid mode");
            }
        } catch (Exception e) {
            return createErrorResponse(e.getMessage());
        }

        return createSuccessResponse(responseMessage);
    }

    /**
     * Handles the registration of a player.
     * 
     * @param queryParams The query parameters from the request.
     * @return The registration status message.
     * @throws Exception If an error occurs during registration.
     */
    private String handleRegister(Map<String, String> queryParams) throws Exception {
        RegisterHandler handler = new RegisterHandler(RRplayercollection, RRcollection);
        return handler.playerRegister(
                queryParams.get("discordid"),
                queryParams.get("discordname"),
                Integer.parseInt(queryParams.get("cohortstart")),
                queryParams.get("lichessname"),
                queryParams.get("chesscomname"),
                queryParams.get("dojousername"));
    }

    /**
     * Handles the withdrawal of a player.
     * 
     * @param queryParams The query parameters from the request.
     * @return The withdrawal status message.
     * @throws Exception If an error occurs during withdrawal.
     */
    private String handleWithdraw(Map<String, String> queryParams) throws Exception {
        WithdrawHandler handler = new WithdrawHandler(RRplayercollection, RRcollection, queryParams.get("discordname"),
                queryParams.get("dojousername"));
        return handler.playerWithdraw();
    }

    /**
     * Handles the submission of a game.
     * 
     * @param queryParams The query parameters from the request.
     * @return The game submission status message.
     * @throws Exception If an error occurs during game submission.
     */
    private String handleGame(Map<String, String> queryParams) throws Exception {
        GameHandler handler = new GameHandler(RRplayercollection, RRcollection, queryParams.get("discordname"),
                queryParams.get("dojousername"), queryParams.get("gameurl"));
        return handler.handleGameRequest();
    }

    /**
     * Creates a successful response event.
     * 
     * @param message The message to include in the response.
     * @return The response event.
     */
    private APIGatewayProxyResponseEvent createSuccessResponse(String message) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(200);
        response.setBody("{\"message\": \"" + message + "\"}");
        response.setHeaders(Map.of(
                "Content-Type", "application/json",
                "Access-Control-Allow-Origin", "*"));
        return response;
    }

    /**
     * Creates an error response event.
     * 
     * @param errorMessage The error message to include in the response.
     * @return The response event.
     */
    private APIGatewayProxyResponseEvent createErrorResponse(String errorMessage) {
        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent();
        response.setStatusCode(400);
        response.setBody("{\"message\": \"" + errorMessage + "\"}");
        response.setHeaders(Map.of(
                "Content-Type", "application/json",
                "Access-Control-Allow-Origin", "*"));
        return response;
    }
}