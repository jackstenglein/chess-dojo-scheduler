import boto3
import csv
import uuid
import datetime
from decimal import Decimal

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
            count = count[count.find("-") + 1 : ]
        result[cohort] = int(count)
    
    return result

def getStartCount(row: dict):
    for cohort in cohorts:
        if row[cohort] is None:
            continue

        count = row[cohort]
        if "-" in count:
            return int(count[ : count.find("-")]) - 1
    
    return 0

def main():
    items = []
    categories = {
        'Welcome to the Dojo': [],
        'Games + Analysis': [],
        'Tactics': [],
        'Middlegames + Strategy': [],
        'Endgame': [],
        'Opening': [],
    }
    updatedAt = datetime.datetime.utcnow().isoformat('T') + 'Z'

    with open('requirements.csv', newline='') as infile:
        with open('out_requirements.csv', 'w') as outfile:
            reader = csv.DictReader(infile)
            writer = csv.DictWriter(outfile, fieldnames=reader.fieldnames)
            writer.writeheader()

            for row in reader:
                if row['Requirement Name'] is None or row['Requirement Name'] == '':
                    writer.writerow(row)
                    continue

                counts = getCounts(row)
                startCount = getStartCount(row)

                if not row['ID']:
                    row['ID'] = str(uuid.uuid4())

                writer.writerow(row)
                item = {
                    'id': row['ID'],
                    'status': 'ACTIVE',
                    'category': row['Category'],
                    'name': row['Requirement Name'],
                    'description': row['Description'] if row['Description'] else '',
                    'counts': counts,
                    'startCount': startCount,
                    'numberOfCohorts': int(row['# of Cohorts']) if row['# of Cohorts'] else 1,
                    'unitScore': Decimal(row['Unit Score']) if row['Unit Score'] else 0,
                    'totalScore': Decimal(row['Total Score']) if row['Total Score'] else 0,
                    'videoUrls': row['Videos'].split(',') if row['Videos'] else [],
                    'positionUrls': row['Positions'].split(',') if row['Positions'] else [],
                    'scoreboardDisplay': row['Scoreboard Display'],
                    'updatedAt': updatedAt,
                    'sortPriority': row['Sort Priority'],
                }

                items.append(item)
                categories[row['Category']].append(item)

    print(f'Got {len(items)} requirements')
    print(f'Got {len(categories["Games + Analysis"])} Games + Analysis requirements')
    print(f'Got {len(categories["Tactics"])} Tactics requirements')
    print(f'Got {len(categories["Middlegames + Strategy"])} Middlegames + Strategy requirements')
    print(f'Got {len(categories["Endgame"])} Endgame requirements')
    print(f'Got {len(categories["Opening"])} Opening requirements')

    print('Uploading items')

    updated = 0
    try:
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=item)
                updated += 1
    except Exception as e:
        print(e)
    print("Updated: ", updated)


if __name__ == '__main__':
    main()
