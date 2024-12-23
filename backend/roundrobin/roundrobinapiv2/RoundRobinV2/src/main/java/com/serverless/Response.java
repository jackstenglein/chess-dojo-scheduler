package com.serverless;

/**
 * This class represents the response object for the API Gateway.
 */
public class Response {
	// The message of the response.
	private String message;

	/**
	 * Gets the message of the response.
	 * @return
	 */
	public String getMessage() {
		return message;
	}

	/**
	 * Sets the message of the response.
	 * @param message The message to set.
	 */
	public void setMessage(String message) {
		this.message = message;
	}
}
