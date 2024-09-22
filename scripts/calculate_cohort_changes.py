import csv


cohorts = ['0-300', '300-400', '400-500', '500-600', '600-700', '700-800', '800-900', '900-1000', '1000-1100', '1100-1200', '1200-1300', '1300-1400', '1400-1500', '1500-1600', '1600-1700', '1700-1800', '1800-1900', '1900-2000', '2000-2100', '2100-2200', '2200-2300', '2300-2400', '2400+']

chesscom = [550, 650, 750, 850, 950, 1050, 1150, 1250, 1350, 1450, 1550, 1650, 1750, 1850, 1950, 2050, 2165, 2275, 2360, 2425, 2485, 2550]
lichess = [1250, 1310, 1370, 1435, 1500, 1550, 1600, 1665, 1730, 1795, 1850, 1910, 1970, 2030, 2090, 2150, 2225, 2310, 2370, 2410, 2440, 2470]
uscf = [350 , 460 , 570 , 680 , 790 , 900 , 1010, 1120, 1230, 1330, 1420, 1510, 1600, 1675, 1750, 1825, 1930, 2055, 2185, 2290, 2395, 2500]
fide = [1400, 1400, 1400, 1400, 1400, 1400, 1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1910, 2000, 2100, 2200, 2300, 2400]
ecf = [400 , 625 , 850 , 1000, 1080, 1160, 1240, 1320, 1400, 1480, 1550, 1620, 1690, 1760, 1835, 1900, 1960, 2050, 2150, 2250, 2350, 2450]
cfc = [350 , 460 , 570 , 680 , 780 , 880 , 980 , 1090, 1200, 1300, 1390, 1480, 1570, 1645, 1730, 1825, 1925, 2060, 2185, 2290, 2395, 2500]
dwz = [450 , 540 , 630 , 720 , 810 , 900 , 1000, 1100, 1200, 1300, 1400, 1500, 1575, 1650, 1725, 1800, 1885, 1990, 2085, 2175, 2270, 2370]
knsb = [400 , 600 , 800 , 1000, 1140, 1280, 1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1910, 2000, 2100, 2200, 2300, 2400]
acf = [300 , 395 , 490 , 585 , 680 , 775 , 870 , 990 , 1100, 1210, 1320, 1415, 1510, 1605, 1700, 1790, 1900, 2000, 2105, 2215, 2330, 2450]

oldChesscom = [550, 650, 750, 850, 950, 1050, 1150, 1250, 1350, 1450, 1550, 1650, 1750, 1850, 1950, 2050, 2150, 2250, 2350, 2425, 2525, 2600]
oldLichess = [1035, 1100, 1165, 1225, 1290, 1350, 1415, 1475, 1575, 1675, 1750, 1825, 1900, 2000, 2075, 2150, 2225, 2300, 2375, 2450, 2525, 2600]
oldUscf = [350 , 450 , 550 , 650 , 750 , 850 , 950, 1050, 1150, 1250, 1350, 1450, 1550, 1650, 1775, 1875, 1975, 2100, 2200, 2300, 2400, 2500]
oldFide = [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400]
oldEcf = [300 , 400 , 500 , 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400]
oldCfc = [425 , 525 , 625 , 725 , 825 , 925 , 1025 , 1125, 1225, 1325, 1425, 1525, 1625, 1725, 1825, 1925, 2025, 2125, 2225, 2325, 2425, 2525]
oldDwz = [300 , 400 , 500 , 600 , 700 , 800 , 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400]
oldKnsb = [300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400]
oldAcf = [105 , 105 , 105 , 240 , 370 , 500 , 630 , 760 , 890, 1015, 1145, 1270, 1400, 1525, 1650, 1775, 1900, 2020, 2145, 2265, 2390, 2510]

systemToBoundaries = {
    'CHESSCOM': chesscom,
    'LICHESS': lichess,
    'USCF': uscf,
    'FIDE': fide,
    'ECF': ecf,
    'CFC': cfc,
    'DWZ': dwz,
    'KNSB': knsb,
    'ACF': acf,
}

systemToOldBoundaries = {
    'CHESSCOM': oldChesscom,
    'LICHESS': oldLichess,
    'USCF': oldUscf,
    'FIDE': oldFide,
    'ECF': oldEcf,
    'CFC': oldCfc,
    'DWZ': oldDwz,
    'KNSB': oldKnsb,
    'ACF': oldAcf,
}


def verifyBoundaries():
    for boundaries in [chesscom, lichess, uscf, fide, ecf, cfc, dwz, knsb, acf, oldChesscom, oldLichess, oldUscf, oldFide, oldEcf, oldCfc, oldDwz, oldKnsb, oldAcf]:
        if len(boundaries) != len(cohorts) - 1:
            raise Exception('Incorrect boundaries: ', boundaries)


def getCohortByRating(rating, boundaries):
    i = 0
    while i < len(boundaries):
        if rating < boundaries[i]:
            return cohorts[i]
        i += 1    
    return '2400+'


def getCohorts(user):
    system = user['preferredRating']
    boundaries = systemToBoundaries.get(system, None)
    oldBoundaries = systemToOldBoundaries.get(system, None)
    if boundaries is None or oldBoundaries is None:
        return (None, None)
    
    rating = int(user[system.lower()])
    return (getCohortByRating(rating, oldBoundaries), getCohortByRating(rating, boundaries))


def getUserData():
    with open('user-ratings.csv') as csvfile:
        reader = csv.DictReader(csvfile)
        return [row for row in reader]


def main():
    verifyBoundaries()

    with open('new-cohorts.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(['Username', 'Rating System', 'Rating', 'Current Cohort', 'Current Expected Cohort', 'New Expected Cohort', 'Expected Cohort Change'])
    
        users = getUserData()
        for user in users:
            oldCohort, newCohort = getCohorts(user)
            if oldCohort is None or newCohort is None or oldCohort == newCohort:
                continue

            writer.writerow([
                user['username'],
                user['preferredRating'],
                user[user['preferredRating'].lower()],
                user['cohort'],
                oldCohort,
                newCohort,
                cohorts.index(newCohort) - cohorts.index(oldCohort),
            ])







if __name__ == '__main__':
    main()
