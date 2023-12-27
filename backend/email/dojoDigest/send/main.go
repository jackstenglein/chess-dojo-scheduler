package main

import (
	"encoding/csv"
	"io"
	"log"
	"os"
	"strings"

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

	if err = media.Download("chess-dojo-email-templates", "dojoDigestMinified.html", f); err != nil {
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

		email := strings.TrimSpace(rec[2])
		if unsubcribers[email] {
			skipped++
			continue
		}

		input := &ses.SendEmailInput{
			Destination: &ses.Destination{
				ToAddresses: []*string{
					aws.String(email),
				},
			},
			Message: &ses.Message{
				Body: &ses.Body{
					Html: &ses.Content{
						Charset: aws.String("UTF-8"),
						Data:    aws.String(content),
					},
				},
				Subject: &ses.Content{
					Charset: aws.String("UTF-8"),
					Data:    aws.String("Training Program News - Dojo Digest Vol. 4"),
				},
			},
			Source: aws.String("chessdojotwitch@gmail.com"),
		}

		_, err = svc.SendEmail(input)
		if err != nil {
			log.Printf("Failed to send to %q: %v\n", email, err)
			failed++
		} else {
			success++
		}
	}

	log.Printf("Finished. Success: %d, Failed: %d, Skipped: %d\n", success, failed, skipped)
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

		email := strings.TrimSpace(rec[1])
		result[email] = true
	}

	return result
}
