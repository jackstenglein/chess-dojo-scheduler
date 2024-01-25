import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-tournaments')

def main():
    try:
        res = table.get_item(Key={'type': 'OPEN_CLASSICAL', 'startsAt': 'CURRENT'})
        item = res['Item']

        for section in item['sections'].values():
            players = {}
            for round in section['rounds']:
                for pairing in round['pairings']:
                    players[pairing['white']['lichessUsername']] = pairing['white']
                    players[pairing['white']['lichessUsername']]['region'] = section['region']
                    players[pairing['white']['lichessUsername']]['section'] = section['section']

                    players[pairing['black']['lichessUsername']] = pairing['black']
                    players[pairing['black']['lichessUsername']]['region'] = section['region']
                    players[pairing['black']['lichessUsername']]['section'] = section['section']

            section['players'] = players

        table.put_item(Item=item)
    except Exception as e:
        print(e)

if __name__ == '__main__':
    main()
