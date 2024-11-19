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

import java.io.IOException;
import java.util.Map;


public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

	private static final ObjectMapper objectMapper = new ObjectMapper();


	ServerApi serverApi = ServerApi.builder()
			.version(ServerApiVersion.V1)
			.build();

	String connectionString = System.getenv("CONNECTION_STRING");

	MongoClientSettings settings = MongoClientSettings.builder()
			.applyConnectionString(new ConnectionString(connectionString))
			.serverApi(serverApi)
			.build();

	MongoClient mongoClient = MongoClients.create(settings);
	MongoDatabase database = mongoClient.getDatabase("Lisebot-database");
	MongoCollection<Document> RRcollection = database.getCollection("rr-tournaments ");

	MongoCollection<Document> RRplayercollection = database.getCollection("rr-players");

	MongoCollection<Document> Lichesscollection = database.getCollection("players");

	MongoCollection<Document> ChesscomCollection = database.getCollection("chesscom-players");


	@Override
	public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent requestEvent, Context context) {

		Map<String, String> queryParams = requestEvent.getQueryStringParameters();

		String res = "";


		switch (queryParams.get("mode")){
			case "register" -> {
				String discordname = queryParams.get("discordname");
				String discordid = queryParams.get("discordid");
				String lichessname = queryParams.get("lichessname");
				String chesscomname = queryParams.get("chesscomname");
				int cohortStart = Integer.parseInt(queryParams.get("cohortstart"));
				String dojousername = queryParams.get("dojousername");

				try{
					RegisterHandler handler = new RegisterHandler(RRplayercollection, RRcollection, Lichesscollection, ChesscomCollection, discordid,
							discordname, cohortStart, lichessname, chesscomname, dojousername);
					res = handler.playerRegister();

				} catch (Exception e) {
					return createErrorResponse(e.getMessage());
				}
			}
			case "withdraw" -> {
				String discordname = queryParams.get("discordname");
				String dojousername = queryParams.get("dojousername");

				try{
					WithdrawHandler handler = new WithdrawHandler(RRplayercollection, RRcollection, discordname, dojousername);
					res = handler.playerWithdraw();
				} catch (Exception e) {
					return createErrorResponse(e.getMessage());
				}
			}

			case "game" -> {
				String discordname = queryParams.get("discordname");
				String dojousername = queryParams.get("dojousername");
				String gameURL = queryParams.get("gameurl");

				try{
					GameHandler handler = new GameHandler(RRplayercollection, RRcollection, discordname, dojousername, gameURL);
					res = handler.handleGameRequest();
				} catch (Exception e) {
					return createErrorResponse(e.getMessage());
				}
			}

            default -> {
                return createErrorResponse("Invalid mode");
            }
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
