import csv
import json
import boto3

db = boto3.resource('dynamodb')
table = db.Table('prod-users')


def get_requirements():
    with open('requirements.json', 'r') as file:
        return json.load(file)


def get_users():
    with open('users.csv', 'r') as file:
        reader = csv.DictReader(file)
        return [row for row in reader]
    

def find_task(task_id, requirements):
    for task in requirements:
        if task['id'] == task_id:
            return task
    return None


def process_user(csv_user, requirements):
    if not csv_user['Username']: return

    user = table.get_item(Key={'username': csv_user['Username']})['Item']
    with open(f"output/{csv_user['Name']}.csv", 'w') as file:
        writer = csv.writer(file)
        writer.writerow(['Task ID', 'Task Name', 'Cohort', 'Count', 'Minutes'])

        for task_id, progress in user['progress'].items():
            if (task := find_task(task_id, requirements)) is None: continue

            if 'ALL_COHORTS' in progress['counts']:
                minutes = sum([m for m in progress['minutesSpent'].values()])
                count = progress['counts']['ALL_COHORTS']
                writer.writerow([task_id, task['name'], 'ALL_COHORTS', count, minutes])
                continue

            for cohort, minutes in progress['minutesSpent'].items():
                writer.writerow([task_id, task['name'], cohort, progress['counts'].get(cohort, 0), minutes])


def main():
    users = get_users()
    requirements = get_requirements()

    for user in users:
        process_user(user, requirements)


if __name__ == '__main__':
    main()
