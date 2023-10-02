package main

import (
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"

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

	data, err := os.Open("subscribers.csv")
	if err != nil {
		log.Fatal(err)
	}
	defer data.Close()
	csvReader := csv.NewReader(data)

	success := 0
	failed := 0

	for {
		if (success+failed)%100 == 0 {
			fmt.Printf("Success: %d, Failed: %d\n", success, failed)
		}

		rec, err := csvReader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			log.Fatal(err)
		}

		input := &ses.SendEmailInput{
			Destination: &ses.Destination{
				ToAddresses: []*string{
					aws.String(rec[4]),
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
					Data:    aws.String("Training Program News - Dojo Digest Vol. 1"),
				},
			},
			Source: aws.String("chessdojotwitch@gmail.com"),
		}

		_, err = svc.SendEmail(input)
		if err != nil {
			log.Println("Failed to send email", err)
			failed++
		} else {
			success++
		}
	}

	log.Printf("Finished. Success: %d, failed: %d", success, failed)
}
