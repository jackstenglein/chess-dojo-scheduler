from dynamodb_json import json_util as json 
import csv
from decimal import Decimal
import datetime


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
    requirements = []
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

            requirements.append(item)

    return requirements


def getCohortCount(cohort, progress, requirement):
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

    return count


def getExpectedCount(cohort, requirement):
    if requirement['scoreboardDisplay'] == 'NON_DOJO':
        return 0
    return requirement['counts'].get(cohort, 0)


def process_cohort(cohort, graduations, requirements):
    cohortRequirements = []
    for r in requirements:
        if r.get('counts', {}).get(cohort, 0) > 0:
            cohortRequirements.append(r)
    
    print(f'Got {len(cohortRequirements)} requirements for cohort {cohort}')

    requirementInfo = {}

    cohortGraduations = []
    for g in graduations:
        if g.get('previousCohort', None) != cohort:
            continue

        progress = g.get('progress', None)
        if progress is None:
            continue

        result = [
            g.get('createdAt', ''),
            g.get('username', ''),
            g.get('displayName', '')
        ]

        for r in cohortRequirements:
            reqProgress = progress.get(r.get('id', ''), None)
            if reqProgress is None:
                result.append('')
                continue

            count = getCohortCount(cohort, reqProgress, r)
            result.append(count)

            info = requirementInfo.get(r['id'], { 'count': 0, 'touched': 0, 'expectedCount': getExpectedCount(cohort, r)})
            info['count'] += count
            info['touched'] += 1
            requirementInfo[r['id']] = info
         
        cohortGraduations.append(result)

    with open(f'{cohort}.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)

        writer.writerow(['Num Graduations', len(cohortGraduations)])
        writer.writerow([])
        writer.writerow([])

        writer.writerow(['Req ID', 'Req Category', 'Req Name', 'Req Count', '# of Attempts', 'Avg Count (All Graduations)', 'Avg Count (Attempts)'])
        for r in cohortRequirements:
            info = requirementInfo.get(r['id'], { 'count': 0, 'touched': 0, 'expectedCount': getExpectedCount(cohort, r)})
            writer.writerow([
                r['id'],
                r['category'],
                r['name'],
                info['expectedCount'],
                info['touched'],
                '{:.2f}'.format(info['count']/len(cohortGraduations)) if len(cohortGraduations) > 0 else 0,
                '{:.2f}'.format(info['count']/info['touched']) if info['touched'] > 0 else 0
            ])
        
        writer.writerow([])
        writer.writerow([])

        writer.writerow(['Graduated At', 'Username', 'Display Name'] + [r['name'] for r in cohortRequirements])
        writer.writerows(cohortGraduations)
    



def main():
    requirements = getRequirements()
    print(f'Got {len(requirements)} requirements')

    graduations = []

    with open('graduations.json', 'r') as file:
        lines = file.readlines()
        for line in lines:
            graduation = json.loads(line)['Item']
            if graduation.get('previousCohort', 'NONE') in cohorts:
                graduations.append(graduation)
    
    print(f'Got {len(graduations)} graduations')

    for cohort in cohorts:
        process_cohort(cohort, graduations, requirements)


if __name__ == '__main__':
    main()
