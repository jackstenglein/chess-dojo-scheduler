import boto3

db = boto3.resource('dynamodb')
table = db.Table('dev-games')

STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'


def process_game(batch, game):
    position_comments = {}
    comments = game.get('comments', [])
    if comments is None:
        comments = []
    
    existing_position_comments = game.get('positionComments', None)
    if existing_position_comments is not None:
        return 0

    for c in comments:
        new_comment = {
            'id': c['id'],
            'fen': STARTING_FEN,
            'ply': 0,
            'owner': {
                'username': c['owner'],
                'displayName': c['ownerDisplayName'],
                'cohort': c.get('ownerCohort', ''),
                'previousCohort': c.get('ownerPreviousCohort', ''),
            },
            'createdAt': c['createdAt'],
            'updatedAt': c['updatedAt'],
            'content': c['content'],
            'replies': {}
        }
        position = position_comments.get(STARTING_FEN, {})
        position[new_comment['id']] = new_comment
        position_comments[STARTING_FEN] = position

    game['positionComments'] = position_comments
    batch.put_item(Item=game)
    return 1


def main():
    try:
        lastKey = None
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])

        with table.batch_writer() as batch:
            for item in items:
                updated += process_game(batch, item)

            while lastKey != None:
                print(lastKey)
                res = table.scan(ExclusiveStartKey=lastKey)

                lastKey = res.get('LastEvaluatedKey', None)
                items = res.get('Items', [])
                for item in items:
                    updated += process_game(batch, item)

    except Exception as e:
        print(e)


    print("Updated: ", updated)

if __name__ == '__main__':
    main()
