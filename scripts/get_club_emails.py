import boto3
import csv

db = boto3.resource('dynamodb')
clubsTable = db.Table('prod-clubs')
usersTable = db.Table('prod-users')

CLUB_IDS = [
    '0b35b659-74d5-489f-82a0-01d224dd6f00',
    'f05721c7-c0f0-4dab-b77a-ab6030c0e159',
    'daedd8a9-dcfc-4c3e-b98e-2c2e5278dd80',
    '2b989e7f-6334-499c-a3ab-e489eea97023',
]

def get_club_members():
    batch_keys = {
        clubsTable.name: {
            'Keys': [{'id': id} for id in CLUB_IDS]
        }
    }
    response = db.batch_get_item(RequestItems=batch_keys)

    usernames = []
    for response_table, response_items in response['Responses'].items():
        for item in response_items:
            for username in item['members'].keys():
                usernames.append(username)
    return set(usernames)

def get_emails(usernames):
    i = 0
    emails = []
    usernames = list(usernames)

    while i < len(usernames):
        current = usernames[i : i + 100]
        batch_keys = {
            usersTable.name: {
                'Keys': [{'username': username} for username in current]
            }
        }
        response = db.batch_get_item(RequestItems=batch_keys)

        for response_table, response_items in response['Responses'].items():
            for item in response_items:
                emails.append(item['email'])
        
        i = i + 100
    
    return emails


def main():
    usernames = get_club_members()
    emails = get_emails(usernames)

    with open('club_emails.csv', 'w', newline='') as csvfile:
        writer = csv.writer(csvfile)
        for email in emails:
            writer.writerow(['', '', email])

if __name__ == '__main__':
    main()
