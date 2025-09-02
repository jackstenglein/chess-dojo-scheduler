import boto3
import requests
import csv

db = boto3.resource('dynamodb')
table = db.Table('prod-users')


def record_block(reason, user, csvwriter):
    email = user['email']
    name = user.get('name', '')
    username = user.get('username', '')
    discord = user.get('discordUsername', '')
    cohort = user.get('dojoCohort', '')
    updatedAt = user.get('updatedAt', '')

    print(f'{reason}: ({username}, {email}, {discord})')
    csvwriter.writerow([username, name, email, discord, cohort, updatedAt, reason])


def check_users(users, csvwriter):
    blocked = 0

    for user in users:
        try:
            email = user['email']
            
            r = requests.get(f'https://chessdojo.club/_functions/user/{email}', headers={'Auth': ''})
            if r.status_code == 404:
                record_block('User Not Found', user, csvwriter)
                blocked += 1
                continue

            body = r.json()
            if len(body.get('subscriptions', [])) == 0:
                record_block('No Active Subscription', user, csvwriter)
                blocked += 1
                continue

        except Exception as e:
            print(e)
            print('Exception on user: ', user)

    return blocked


def main():
    blocked = 0
    scanned_users = 0

    f = open('blocked_users_private.csv', 'w', newline='')
    csvwriter = csv.writer(f)
    csvwriter.writerow(['Username', 'Name', 'Email', 'Discord', 'Cohort', 'Updated At', 'Block Reason'])

    try:
        lastKey = None
        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        users = res.get('Items', [])
        scanned_users += len(users)
        blocked += check_users(users, csvwriter)

        while lastKey != None:
            print('Scanned users: ', scanned_users)
            res = table.scan(ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            users = res.get('Items', [])
            scanned_users += len(users)
            blocked += check_users(users, csvwriter)

    except Exception as e:
        print(e)

    f.close()
    print("Blocked users: ", blocked)
    print("Scanned users: ", scanned_users)

if __name__ == '__main__':
    main()
