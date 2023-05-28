import boto3
import csv
import time

db = boto3.resource('dynamodb')
table = db.Table('prod-users')


def write_users(users, csvwriter):
    for user in users:
        email = user.get('email', '')
        if email == '':
            continue

        username = user.get('username', '')
        name = user.get('name', '')
        wix_email = user.get('wixEmail', '')
        discord = user.get('discordUsername', '')
        cohort = user.get('dojoCohort', '')
        rating_system = user.get('ratingSystem', '')
        updatedAt = user.get('updatedAt', '')

        csvwriter.writerow([username, name, email, wix_email, discord, cohort, rating_system, updatedAt])


def main():
    f = open('users.csv', 'w', newline='')
    csvwriter = csv.writer(f)
    csvwriter.writerow(['Username', 'Name', 'Email', 'Wix Email', 'Discord', 'Cohort', 'Rating System', 'Updated At'])

    try:
        lastKey = None
        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        users = res.get('Items', [])
        write_users(users, csvwriter)

        while lastKey != None:
            time.sleep(5) # Avoids exceeding the table's provisioned throughput capacity
            print(lastKey)
            res = table.scan(ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            users = res.get('Items', [])
            write_users(users, csvwriter)

    except Exception as e:
        print(e)

    f.close()


if __name__ == '__main__':
    main()
