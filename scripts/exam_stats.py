import boto3
import csv

db = boto3.resource('dynamodb')
table = db.Table('prod-exams')

examType = 'TACTICS_EXAM'
examId = 'e6ab227e-586f-4cef-b770-b840e82f1823'


def writeCsv():
    exam = table.get_item(Key={'type': examType, 'id': examId})['Item']
    answers = exam['answers']

    with open('exam_answers.csv', 'w') as f:
        writer = csv.writer(f)
        writer.writerow(['Username', 'Rating', 'Cohort', 'Time', 'Score'])
        for username, answer in answers.items():
            userAnswer = table.get_item(Key={'type': username, 'id': examId})['Item']
            writer.writerow([username, answer['rating'], answer['cohort'], userAnswer['attempts'][0]['timeUsedSeconds'], answer['score']])


def readCsv():
    with open('exam_answers.csv', 'r') as f:
        reader = csv.DictReader(f)
        return [row for row in reader]

def main():
    writeCsv()

if __name__ == '__main__':
    main()
