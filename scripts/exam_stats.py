import boto3
import csv

db = boto3.resource('dynamodb')
table = db.Table('prod-exams')

examType = 'TACTICS_EXAM'
examId = 'da75f432-30b5-4e27-bf9a-dc2e43ebfca7'


def writeCsv():
    exam = table.get_item(Key={'type': examType, 'id': examId})['Item']
    answers = exam['answers']

    with open('exam1500-4.csv', 'w') as f:
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
