package main

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"strings"

	"gopkg.in/gomail.v2"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/ses"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/api/errors"
	"github.com/jackstenglein/chess-dojo-scheduler/backend/database"
)

var media = database.S3

func main() {
	sess, err := session.NewSession()
	if err != nil {
		log.Fatalln("Failed to create AWS session", err)
	}
	svc := ses.New(sess)

	f, err := os.Create("/tmp/email.html")
	if err != nil {
		log.Fatalln("Failed to create html file: ", errors.Wrap(500, "Temporary server error", "Failed to create file for service account key", err))
	}

	if err = media.Download("chess-dojo-email-templates", "dojoDigest20Minified.html", f); err != nil {
		log.Fatalln("Failed to download html", err)
	}
	f.Close()

	b, err := os.ReadFile("/tmp/email.html")
	if err != nil {
		log.Fatalln("Failed to read email file", err)
	}
	content := string(b)

	unsubcribers := getUnsubscribers()

	data, err := os.Open("subscribers.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer data.Close()
	csvReader := csv.NewReader(data)

	total := 0
	success := 0
	failed := 0
	skipped := 0

	for {
		if total%100 == 0 {
			log.Printf("Success: %d, Failed: %d, Skipped: %d\n", success, failed, skipped)
		}

		rec, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}
		total++

		email := strings.ToLower(strings.TrimSpace(rec[2]))
		if unsubcribers[email] {
			skipped++
			continue
		}

		msg := gomail.NewMessage()
		msg.SetHeader("From", "ChessDojo Digest <digest@mail.chessdojo.club>")
		msg.SetHeader("To", email)
		msg.SetHeader("Subject", "Annotation Workshop, New Database Explorer & more! | Digest Vol. 20")
		msg.SetHeader("List-Unsubscribe-Post", "List-Unsubscribe=One-Click")
		msg.SetHeader("List-Unsubscribe", fmt.Sprintf("<https://g4shdaq6ug.execute-api.us-east-1.amazonaws.com/public/dojodigest/unsubscribe?email=%s>", email))
		msg.SetBody("text/html", content)

		var rawEmail bytes.Buffer
		_, err = msg.WriteTo(&rawEmail)
		if err != nil {
			log.Printf("Failed to dump email: %v\n", err)
			failed++
			continue
		}

		input := &ses.SendRawEmailInput{
			Destinations: []*string{aws.String(email)},
			Source:       aws.String("digest@mail.chessdojo.club"),
			RawMessage:   &ses.RawMessage{Data: rawEmail.Bytes()},
		}

		_, err = svc.SendRawEmail(input)
		if err != nil {
			log.Printf("Failed to send to %q: %v\n", email, err)
			failed++
		} else {
			success++
		}
	}

	log.Printf("Finished. Success: %d, Failed: %d, Unsubscribed: %d\n", success, failed, skipped)
}

func getUnsubscribers() map[string]bool {
	unsubscribers, err := os.Open("unsubscribers.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer unsubscribers.Close()

	csvReader := csv.NewReader(unsubscribers)
	result := make(map[string]bool)

	for {
		rec, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}

		email := strings.ToLower(strings.TrimSpace(rec[1]))
		result[email] = true
	}

	return result
}
