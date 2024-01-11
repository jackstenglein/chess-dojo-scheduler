package main

import (
	"log"

	payment "github.com/jackstenglein/chess-dojo-scheduler/backend/paymentService"
)

func main() {
	err := payment.DeleteConnectedAccount("")
	if err != nil {
		log.Fatalf("Failed to delete Stripe account: %#v\n", err)
	}
	log.Println("Account Deleted")
}
