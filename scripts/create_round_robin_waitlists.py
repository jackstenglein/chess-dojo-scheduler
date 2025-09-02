import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-tournaments')

cohorts = [
    '0-300', '300-400', '400-500', '500-600', '600-700', '700-800', '800-900', '900-1000',
    '1000-1100', '1100-1200', '1200-1300', '1300-1400', '1400-1500', '1500-1600', '1600-1700',
    '1700-1800', '1800-1900', '1900-2000', '2000-2100', '2100-2200', '2200-2300',
    '2300-2400', '2400+',
]

def main():
    try:
        with table.batch_writer() as batch:
            for cohort in cohorts:
                batch.put_item(Item={
                    'type': f'ROUND_ROBIN_{cohort}',
                    'startsAt': 'WAITING',
                    'cohort': cohort,
                    'players': {}
                })
    except Exception as e:
        print(e)


if __name__ == '__main__':
    main()
