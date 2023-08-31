import boto3
import time

db = boto3.resource('dynamodb')
table = db.Table('prod-users')

def update_users(users):
    updated = 0
    with table.batch_writer() as batch:
        for user in users:
            ratings = {}

            chesscomUsername = user.get('chesscomUsername', '')
            if chesscomUsername is not None and len(chesscomUsername) > 0:
                ratings['CHESSCOM'] = {
                    'username': chesscomUsername,
                    'hideUsername': user.get('hideChesscomUsername', False),
                    'startRating': user.get('startChesscomRating', 0),
                    'currentRating': user.get('currentChesscomRating', 0),
                }

            lichessUsername = user.get('lichessUsername', '')
            if lichessUsername is not None and len(lichessUsername) > 0:
                ratings['LICHESS'] = {
                    'username': lichessUsername,
                    'hideUsername': user.get('hideLichessUsername', False),
                    'startRating': user.get('startLichessRating', 0),
                    'currentRating': user.get('currentLichessRating', 0),
                }

            fideId = user.get('fideId', '')
            if fideId is not None and len(fideId) > 0:
                ratings['FIDE'] = {
                    'username': fideId,
                    'hideUsername': user.get('hideFideId', False),
                    'startRating': user.get('startFideRating', 0),
                    'currentRating': user.get('currentFideRating', 0),
                }

            uscfId = user.get('uscfId', '')
            if uscfId is not None and len(uscfId) > 0:
                ratings['USCF'] = {
                    'username': uscfId,
                    'hideUsername': user.get('hideUscfId', False),
                    'startRating': user.get('startUscfRating', 0),
                    'currentRating': user.get('currentUscfRating', 0),
                }

            ecfId = user.get('ecfId', '')
            if ecfId is not None and len(ecfId) > 0:
                ratings['ECF'] = {
                    'username': ecfId,
                    'hideUsername': user.get('hideEcfId', False),
                    'startRating': user.get('startEcfRating', 0),
                    'currentRating': user.get('currentEcfRating', 0),
                }

            cfcId = user.get('cfcId', '')
            if cfcId is not None and len(cfcId) > 0:
                ratings['CFC'] = {
                    'username': cfcId,
                    'hideUsername': user.get('hideCfcId', False),
                    'startRating': user.get('startCfcRating', 0),
                    'currentRating': user.get('currentCfcRating', 0),
                }

            dwzId = user.get('dwzId', '')
            if dwzId is not None and len(dwzId) > 0:
                ratings['DWZ'] = {
                    'username': dwzId,
                    'hideUsername': user.get('hideDwzId', False),
                    'startRating': user.get('startDwzRating', 0),
                    'currentRating': user.get('currentDwzRating', 0),
                }

            startCustom = user.get('startCustomRating', 0)
            currentCustom = user.get('currentCustomRating', 0)
            if (startCustom is not None and startCustom > 0) or (currentCustom is not None and currentCustom > 0):
                ratings['CUSTOM'] = {
                    'startRating': startCustom,
                    'currentRating': currentCustom,
                }

            if len(ratings) == 0: continue
            
            user['ratings'] = ratings
            batch.put_item(Item=user)
            updated += 1
            time.sleep(2)

    return updated

def main():
    try:
        updated = 0

        res = table.scan()
        lastKey = res.get('LastEvaluatedKey', None)
        items = res.get('Items', [])
        updated += update_users(items)

        while lastKey != None:
            time.sleep(5)
            print(lastKey)
            res = table.scan(ExclusiveStartKey=lastKey)
            lastKey = res.get('LastEvaluatedKey', None)
            items = res.get('Items', [])
            updated += update_users(items)

    except Exception as e:
        print(e)

    print("Updated: ", updated)


if __name__ == '__main__':
    main()
