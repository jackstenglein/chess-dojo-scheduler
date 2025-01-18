import boto3
import csv


db = boto3.resource('dynamodb')
timeline_table = db.Table('dev-timeline')


def get_requirements():
    requirements = []
    with open('requirements.csv', newline='', encoding='utf8') as infile:
        reader = csv.DictReader(infile)
        for row in reader:
            if row['Requirement Name'] is None or row['Requirement Name'] == '':
                continue
            requirements.append(row['ID'])
    return requirements


requirements = get_requirements()

def process_items(batch, items):
    updated = 0
    for item in items:
        if item.get('requirementCategory', '') == 'Non-Dojo' and item['requirementId'] not in requirements:
            item['isCustomRequirement'] = True
            batch.put_item(Item=item)
            updated += 1
    return updated


def main():
    try:
        lastKey = None
        updated = 0

        res = timeline_table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])

        with timeline_table.batch_writer() as batch:
            updated += process_items(batch, items)

            while lastKey != None:
                print(lastKey)
                res = timeline_table.scan(ExclusiveStartKey=lastKey)
                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                updated += process_items(batch, items)
    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
