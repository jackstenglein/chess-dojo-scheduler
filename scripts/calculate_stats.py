import boto3
import csv
import datetime
from decimal import Decimal
from dynamodb_json import json_util as json 

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


def getStartCount(row: dict):
    for cohort in cohorts:
        if row[cohort] is None:
            continue

        count = row[cohort]
        if "-" in count:
            return int(count[: count.find("-")]) - 1

    return 0


def getUnitScoreOverride(row: dict):
    result = {}
    for cohort in cohorts:
        uso_name = "USO " + cohort
        value = row.get(uso_name, None)
        if value is None or value == '':
            continue

        result[cohort] = Decimal(value)

    return result


def getPositions(row: dict):
    if not row['FENs']:
        return None

    positions = []
    fens = row['FENs'].split(',')
    
    limitSeconds = int(row['Limit Seconds'])
    incrementSeconds = int(row['Increment Seconds']) if row['Increment Seconds'] else 0
    result = row['Expected Result']
    title = row['Position Title']

    index = 1
    for fen in fens:
        ptitle = title
        if len(fens) > 1:
            ptitle = f'{title} #{index}'
        elif len(title) == 0:
            ptitle = f'#{index}'

        position = {
            'title': ptitle,
            'fen': fen,
            'limitSeconds': limitSeconds,
            'incrementSeconds': incrementSeconds,
            'result': result,
        }
        positions.append(position)
        index += 1
    return positions

def getRequirements():
    items = {}
    updatedAt = datetime.datetime.utcnow().isoformat('T') + 'Z'

    with open('requirements.csv', newline='', encoding='utf8') as infile:
        reader = csv.DictReader(infile)

        for row in reader:
            if row['Requirement Name'] is None or row['Requirement Name'] == '':
                continue

            counts = getCounts(row)
            startCount = getStartCount(row)
            unitScoreOverride = getUnitScoreOverride(row)
            positions = getPositions(row)

            if not row['ID'] or row['ID'] == '':
                raise Exception('Row missing ID: ', row)

            item = {
                'id': row['ID'],
                'status': 'ACTIVE',
                'category': row['Category'],
                'name': row['Requirement Name'],
                'description': row['Description'] if row['Description'] else '',
                'freeDescription': row['Free Description'] if row['Free Description'] else '',
                'counts': counts,
                'startCount': startCount,
                'numberOfCohorts': int(row['# of Cohorts']) if row['# of Cohorts'] else 1,
                'unitScore': Decimal(row['Unit Score']) if row['Unit Score'] else 0,
                'unitScoreOverride': unitScoreOverride,
                'totalScore': Decimal(row['Total Score']) if row['Total Score'] else 0,
                'videoUrls': row['Videos'].split(',') if row['Videos'] else [],
                'positions': positions,
                'scoreboardDisplay': row['Scoreboard Display'],
                'updatedAt': updatedAt,
                'sortPriority': row['Sort Priority'],
                'progressBarSuffix': row['Progress Bar Suffix'] if row['Progress Bar Suffix'] else '',
                'expirationDays': int(row['Expiration Days']) if row['Expiration Days'] else -1,
                'isFree': row['Free?'] == '1',
            }

            items[item['id']] = item
    return items

ratingSystems = [
    'CHESSCOM',
    'LICHESS',
    'FIDE',
    'USCF',
    'ECF',
    'CFC',
    'DWZ',
    'ACF',
    'CUSTOM'
]

categories = [
    'Welcome to the Dojo',
    'Games + Analysis',
    'Tactics',
    'Middlegames + Strategy',
    'Endgame',
    'Opening',
    'Non-Dojo'
]

def getCohortScore(cohort, progress, requirement):
    if requirement['scoreboardDisplay'] == 'NON_DOJO':
        return 0
    
    if requirement['counts'].get(cohort, 0) == 0:
        return 0

    numCohorts = requirement['numberOfCohorts']
    count = 0
    if numCohorts == 1 or numCohorts == 0:
        count = progress['counts']['ALL_COHORTS']
    elif numCohorts > 1 and len(progress['counts']) >= numCohorts:
        if progress['counts'].get(cohort, 0) != 0:
            count = progress['counts'][cohort]
        else:
            for k, v in progress['counts'].items():
                if v > count:
                    count = v
    else:
        count = progress['counts'].get(cohort, 0)
    
    if requirement['totalScore'] > 0:
        if count >= requirement['counts'][cohort]:
            return requirement['totalScore']
        return 0
    
    unitScore = requirement['unitScore']
    if requirement['unitScoreOverride'].get(cohort, 0) != 0:
        unitScore = requirement['unitScoreOverride'][cohort]

    count = max(min(count, requirement['counts'][cohort]), requirement.get('startCount', 0))
    return max(count - requirement.get('startCount', 0), 0) * unitScore
    

def getDojoPoints(userCohort, progress, requirement):
    score = 0

    for cohort in progress['counts'].keys():
        if cohort == 'ALL_COHORTS':
            score += getCohortScore(userCohort, progress, requirement)
        else:
            score += getCohortScore(cohort, progress, requirement)

    return score

def processUser(user, requirements):
    if user.get('ratingSystem', None) == None:
        return None

    row = {
        'username': user['username'],
        'cohort': user['dojoCohort'],
        'preferredRatingSystem': user['ratingSystem'],
    }

    ratings = user.get('ratings', {})
    for ratingSystem in ratingSystems:
        rating = ratings.get(ratingSystem, {})
        row[f'{ratingSystem}_startRating'] = rating.get('startRating', 'N/A')
        row[f'{ratingSystem}_currentRating'] = rating.get('currentRating', 'N/A')

    progress = user.get('progress', None)
    if progress == None:
        return row
    
    for requirementId, requirementProgress in progress.items():
        requirement = requirements.get(requirementId, None)
        if requirement == None:
            continue

        requirement_name = requirement['name']
        total_minutes = 0
        for minutes in requirementProgress.get('minutesSpent', {}).values():
            total_minutes += minutes

        points = getDojoPoints(user['dojoCohort'], requirementProgress, requirement)
        row[f'{requirement_name} Points'] = points
        row[f'{requirement_name} Minutes'] = minutes

    return row

def getFieldNames(requirements):
    fieldnames = ['username', 'cohort', 'preferredRatingSystem']
    for ratingSystem in ratingSystems:
        fieldnames.append(f'{ratingSystem}_startRating')
        fieldnames.append(f'{ratingSystem}_currentRating')

    requirements = list(requirements.values())
    requirements.sort(key=lambda r: r['sortPriority'])
    for requirement in requirements:
        requirement_name = requirement['name']
        fieldnames.append(f'{requirement_name} Minutes')
        fieldnames.append(f'{requirement_name} Points')

    return fieldnames

def main():
    requirements = getRequirements()
    print(f'Got {len(requirements)} requirements')

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
        writer = csv.DictWriter(csvfile, fieldnames=getFieldNames(requirements))
        writer.writeheader()
        writer.writerows(rows)


if __name__ == '__main__':
    main()
