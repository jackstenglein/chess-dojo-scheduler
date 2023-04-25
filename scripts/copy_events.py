import boto3

db = boto3.resource('dynamodb')

availabilities_table = db.Table('prod-availabilities')
events = db.Table('prod-events')

def main():
    try:
        copied = 0
        res = availabilities_table.scan()

        availabilities = res.get('Items', [])

        lastKey = res.get('LastEvaluatedKey', None)
        while lastKey != None:
            print(lastKey)
            res = availabilities_table.scan(ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            availabilities.append(res.get('Items', []))


        with events.batch_writer() as batch:
            for item in availabilities:
                if item['id'] == 'STATISTICS':
                    continue
                
                batch.put_item(Item={
                    'id': item['id'],
                    'type': 'AVAILABILITY',
                    'owner': item['owner'],
                    'ownerDisplayName': item['ownerDisplayName'],
                    'ownerCohort': item['ownerCohort'],
                    'ownerPreviousCohort': item['ownerPreviousCohort'],
                    'title': '',
                    'startTime': item['startTime'],
                    'endTime': item['endTime'],
                    'bookedStartTime': '',
                    'expirationTime': item['expirationTime'],
                    'types': item['types'],
                    'bookedType': '',
                    'cohorts': item['cohorts'],
                    'status': item['status'],
                    'location': item['location'],
                    'description': item['description'],
                    'maxParticipants': item['maxParticipants'],
                    'participants': item['participants'],
                    'discordMessageId': item['discordMessageId'],
                    'discordEventIds': [],
                })
                copied += 1

    except Exception as e:
        print(e)

    print('Copied: ', copied, ' availabilities')


if __name__ == '__main__':
    main()
