import boto3
import csv

db = boto3.resource('dynamodb')
table = db.Table('prod-exams')


def writeCsv():
    exam = table.get_item(Key={'type': 'POLGAR_EXAM', 'id': '29793882-9afb-4271-9ea8-c445ff1e0713'})['Item']
    answers = exam['answers']

    with open('exam_answers-polgar-0-1.csv', 'w') as f:
        writer = csv.writer(f)
        writer.writerow(['Username', 'Rating', 'Cohort', 'Score'])
        for username, answer in answers.items():
            writer.writerow([username, answer['rating'], answer['cohort'], answer['score']])


def readCsv():
    with open('exam_answers.csv', 'r') as f:
        reader = csv.DictReader(f)
        return [row for row in reader]

def main():
    writeCsv()

if __name__ == '__main__':
    main()
