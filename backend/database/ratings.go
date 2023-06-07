package database

func getCohort(ratingSystem RatingSystem, currentRating int) DojoCohort {
	switch ratingSystem {

	case Fide:
	case Ecf:
	case Dwz:
		switch {
		case currentRating < 300:
			return "0-300"
		case currentRating < 400:
			return "300-400"
		case currentRating < 500:
			return "400-500"
		case currentRating < 600:
			return "500-600"
		case currentRating < 700:
			return "600-700"
		case currentRating < 800:
			return "700-800"
		case currentRating < 900:
			return "800-900"
		case currentRating < 1000:
			return "900-1000"
		case currentRating < 1100:
			return "1000-1100"
		case currentRating < 1200:
			return "1100-1200"
		case currentRating < 1300:
			return "1200-1300"
		case currentRating < 1400:
			return "1300-1400"
		case currentRating < 1500:
			return "1400-1500"
		case currentRating < 1600:
			return "1500-1600"
		case currentRating < 1700:
			return "1600-1700"
		case currentRating < 1800:
			return "1700-1800"
		case currentRating < 1900:
			return "1800-1900"
		case currentRating < 2000:
			return "1900-2000"
		case currentRating < 2100:
			return "2000-2100"
		case currentRating < 2200:
			return "2100-2200"
		case currentRating < 2300:
			return "2200-2300"
		case currentRating < 2400:
			return "2300-2400"
		default:
			return "2400+"
		}

	case Chesscom:
		switch {
		case currentRating < 500:
			return "0-300"
		case currentRating < 650:
			return "300-400"
		case currentRating < 750:
			return "400-500"
		case currentRating < 850:
			return "500-600"
		case currentRating < 950:
			return "600-700"
		case currentRating < 1050:
			return "700-800"
		case currentRating < 1150:
			return "800-900"
		case currentRating < 1250:
			return "900-1000"
		case currentRating < 1350:
			return "1000-1100"
		case currentRating < 1450:
			return "1100-1200"
		case currentRating < 1550:
			return "1200-1300"
		case currentRating < 1650:
			return "1300-1400"
		case currentRating < 1750:
			return "1400-1500"
		case currentRating < 1850:
			return "1500-1600"
		case currentRating < 1950:
			return "1600-1700"
		case currentRating < 2050:
			return "1700-1800"
		case currentRating < 2150:
			return "1800-1900"
		case currentRating < 2250:
			return "1900-2000"
		case currentRating < 2350:
			return "2000-2100"
		case currentRating < 2425:
			return "2100-2200"
		case currentRating < 2525:
			return "2200-2300"
		case currentRating < 2600:
			return "2300-2400"
		default:
			return "2400+"
		}

	case Lichess:
		switch {
		case currentRating < 1035:
			return "0-300"
		case currentRating < 1100:
			return "300-400"
		case currentRating < 1165:
			return "400-500"
		case currentRating < 1225:
			return "500-600"
		case currentRating < 1290:
			return "600-700"
		case currentRating < 1350:
			return "700-800"
		case currentRating < 1415:
			return "800-900"
		case currentRating < 1475:
			return "900-1000"
		case currentRating < 1575:
			return "1000-1100"
		case currentRating < 1675:
			return "1100-1200"
		case currentRating < 1750:
			return "1200-1300"
		case currentRating < 1825:
			return "1300-1400"
		case currentRating < 1900:
			return "1400-1500"
		case currentRating < 2000:
			return "1500-1600"
		case currentRating < 2075:
			return "1600-1700"
		case currentRating < 2150:
			return "1700-1800"
		case currentRating < 2225:
			return "1800-1900"
		case currentRating < 2300:
			return "1900-2000"
		case currentRating < 2375:
			return "2000-2100"
		case currentRating < 2450:
			return "2100-2200"
		case currentRating < 2525:
			return "2200-2300"
		case currentRating < 2600:
			return "2300-2400"
		default:
			return "2400+"
		}

	case Uscf:
		switch {
		case currentRating < 350:
			return "0-300"
		case currentRating < 450:
			return "300-400"
		case currentRating < 550:
			return "400-500"
		case currentRating < 650:
			return "500-600"
		case currentRating < 750:
			return "600-700"
		case currentRating < 850:
			return "700-800"
		case currentRating < 950:
			return "800-900"
		case currentRating < 1050:
			return "900-1000"
		case currentRating < 1150:
			return "1000-1100"
		case currentRating < 1250:
			return "1100-1200"
		case currentRating < 1350:
			return "1200-1300"
		case currentRating < 1450:
			return "1300-1400"
		case currentRating < 1550:
			return "1400-1500"
		case currentRating < 1650:
			return "1500-1600"
		case currentRating < 1775:
			return "1600-1700"
		case currentRating < 1875:
			return "1700-1800"
		case currentRating < 1975:
			return "1800-1900"
		case currentRating < 2100:
			return "1900-2000"
		case currentRating < 2200:
			return "2000-2100"
		case currentRating < 2300:
			return "2100-2200"
		case currentRating < 2400:
			return "2200-2300"
		case currentRating < 2500:
			return "2300-2400"
		default:
			return "2400+"
		}

	case Cfc:
		switch {
		case currentRating < 425:
			return "0-300"
		case currentRating < 525:
			return "300-400"
		case currentRating < 625:
			return "400-500"
		case currentRating < 725:
			return "500-600"
		case currentRating < 825:
			return "600-700"
		case currentRating < 925:
			return "700-800"
		case currentRating < 1025:
			return "800-900"
		case currentRating < 1125:
			return "900-1000"
		case currentRating < 1225:
			return "1000-1100"
		case currentRating < 1325:
			return "1100-1200"
		case currentRating < 1425:
			return "1200-1300"
		case currentRating < 1525:
			return "1300-1400"
		case currentRating < 1625:
			return "1400-1500"
		case currentRating < 1725:
			return "1500-1600"
		case currentRating < 1825:
			return "1600-1700"
		case currentRating < 1925:
			return "1700-1800"
		case currentRating < 2025:
			return "1800-1900"
		case currentRating < 2125:
			return "1900-2000"
		case currentRating < 2225:
			return "2000-2100"
		case currentRating < 2325:
			return "2100-2200"
		case currentRating < 2425:
			return "2200-2300"
		case currentRating < 2525:
			return "2300-2400"
		default:
			return "2400+"
		}
	}

	return NoCohort
}
