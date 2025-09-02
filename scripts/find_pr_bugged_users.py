import boto3
import csv
import datetime
from decimal import Decimal
from dynamodb_json import json_util as json 

PUZZLE_RUSH_5_MIN = '42804d40-3651-438c-a8ae-e2200fe23b4c'
PUZZLE_SURVIVAL = 'fa98ad32-219a-4ee9-ae02-2cda69efce06'

db = boto3.resource('dynamodb')
table = db.Table('dev-requirements')

cohorts = [
    "0-300",
    "300-400",
    "400-500",
    "500-600",
    "600-700",
    "700-800",
    "800-900",
    "900-1000",
    "1000-1100",
    "1100-1200",
    "1200-1300",
    "1300-1400",
    "1400-1500",
    "1500-1600",
    "1600-1700",
    "1700-1800",
    "1800-1900",
    "1900-2000",
    "2000-2100",
    "2100-2200",
    "2200-2300",
    "2300-2400",
    "2400+",
]


def getCounts(row: dict):
    result = {}
    for cohort in cohorts:
        if row[cohort] is None or row[cohort] == '':
            continue

        count = row[cohort]
        if "-" in count:
            count = count[count.find("-") + 1:]
        result[cohort] = int(count)

    return result


def getRequirements():
    items = {}

    with open('requirements.csv', newline='', encoding='utf8') as infile:
        reader = csv.DictReader(infile)

        for row in reader:
            if row['ID'] != PUZZLE_RUSH_5_MIN and row['ID'] != PUZZLE_SURVIVAL:
                continue

            counts = getCounts(row)
            item = {
                'id': row['ID'],
                'counts': counts,
            }
            items[item['id']] = item

    return items



def processUser(user, requirements):
    if user.get('progress', None) == None or user.get('dojoCohort', None) == None:
        return None

    row = {
        'username': user['username'],
        'displayName': user.get('displayName', ''),
        'cohort': user['dojoCohort'],
    }

    isBugged = False

    progress = user['progress']

    for requirementId, requirement in requirements.items():
        expectedCount = requirement.get('counts', {}).get(user['dojoCohort'], 0)
        if expectedCount == 0:
            continue

        reqProgress = progress.get(requirementId, None)
        if reqProgress == None:
            continue

        count = reqProgress.get('counts', {}).get('ALL_COHORTS', 0)
        if count > expectedCount:
            isBugged = True
            row[f'{requirementId} Count'] = count
            row[f'{requirementId} Expected'] = expectedCount
    
    if isBugged:
        return row

    return None

def getFieldNames():
    return [
        'username',
        'cohort',
        'displayName',
        f'{PUZZLE_RUSH_5_MIN} Count',
        f'{PUZZLE_RUSH_5_MIN} Expected',
        f'{PUZZLE_SURVIVAL} Count',
        f'{PUZZLE_SURVIVAL} Expected',
    ]

def main():
    requirements = getRequirements()
    print(requirements)

    rows = []

    for i in range(3):
        with open(f'users{i}.json', 'r') as file:
            lines = file.readlines()
            for line in lines:
                user = json.loads(line)['Item']
                row = processUser(user, requirements)
                if row != None:
                    rows.append(row)

    with open('result.csv', 'w') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=getFieldNames())
        writer.writeheader()
        writer.writerows(rows)


if __name__ == '__main__':
    main()
