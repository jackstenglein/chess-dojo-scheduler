import { Directory, DirectoryAccessRole } from "@jackstenglein/chess-dojo-common/src/database/directory";
import { getPerformanceRating } from "./rating";
import { RatingSystem } from "./ratingtypes";

export const mockDirectory: Directory = {
  owner: '642dc91f-955e-4f19-b170-39195cb449e1',
  id: 'home',
  parent: '00000000-0000-0000-0000-000000000000',
  name: 'Home',
  visibility: 'PUBLIC',
  createdAt: '2025-05-06T23:00:00.000Z',
  updatedAt: '2025-05-06T23:00:00.000Z',
  items: {},
  itemIds: [],
  access: {
    '642dc91f-955e-4f19-b170-39195cb449e1': DirectoryAccessRole.Owner,
  },
};

const highResults = [
  { opponent: 'GM_One', elo: 2700, result: '1-0' },
  { opponent: 'GM_Two', elo: 2680, result: '1-0' },
  { opponent: 'GM_Three', elo: 2650, result: '1-0' },
  { opponent: 'GM_Four', elo: 2720, result: '1-0' },
  { opponent: 'GM_Five', elo: 2750, result: '1-0' },
  { opponent: 'GM_Six', elo: 2730, result: '1/2-1/2' },
  { opponent: 'GM_Seven', elo: 2760, result: '1/2-1/2' },
  { opponent: 'GM_Eight', elo: 2780, result: '1/2-1/2' },
  { opponent: 'GM_Nine', elo: 2800, result: '1/2-1/2' },
  { opponent: 'GM_Ten', elo: 2820, result: '0-1' },
];

highResults.forEach((game, index) => {
  const id = `2025.05.06_high_${index}`;
  const itemId = `2000-2100/${id}`;
  mockDirectory.items[itemId] = {
    type: 'OWNED_GAME',
    id: itemId,
    metadata: {
      cohort: '2000-2100',
      id,
      owner: '642dc91f-955e-4f19-b170-39195cb449e1',
      ownerDisplayName: 'Palp p',
      createdAt: new Date().toISOString(),
      white: index % 2 === 0 ? 'Gukesh_D' : game.opponent,
      black: index % 2 === 0 ? game.opponent : 'Gukesh_D',
      whiteElo: index % 2 === 0 ? '2750' : game.elo.toString(),
      blackElo: index % 2 === 0 ? game.elo.toString() : '2750',
      result: game.result,
      unlisted: false,
    },
  };
  mockDirectory.itemIds.push(itemId);
});

function testPerformanceRatingHigh() {
  console.log("== HIGH RATED OPPONENTS ==");
  const metric = getPerformanceRating("Gukesh_D", mockDirectory, RatingSystem.Chesscom, '1900-2000');
  console.log(metric);
}

testPerformanceRatingHigh();

const lowerResults = [
  { opponent: 'GM_LowOne', elo: 2100, result: '1-0' },
  { opponent: 'GM_LowTwo', elo: 1980, result: '1-0' },
  { opponent: 'GM_LowThree', elo: 1300, result: '1/2-1/2' },
  { opponent: 'GM_LowFour', elo: 1800, result: '1-0' },
  { opponent: 'GM_LowFive', elo: 1750, result: '1-0' },
  { opponent: 'GM_LowSix', elo: 1730, result: '1/2-1/2' },
  { opponent: 'GM_LowSeven', elo: 1760, result: '1/2-1/2' },
  { opponent: 'GM_LowEight', elo: 1780, result: '1/2-1/2' },
  { opponent: 'GM_LowNine', elo: 1800, result: '1/2-1/2' },
  { opponent: 'GM_LowTen', elo: 1820, result: '0-1' },
];

lowerResults.forEach((game, index) => {
  const id = `2025.05.06_low_${index}`;
  const itemId = `2000-2100/${id}`;
  mockDirectory.items[itemId] = {
    type: 'OWNED_GAME',
    id: itemId,
    metadata: {
      cohort: '2000-2100',
      id,
      owner: '642dc91f-955e-4f19-b170-39195cb449e1',
      ownerDisplayName: 'Palp p',
      createdAt: new Date().toISOString(),
      white: index % 2 === 0 ? 'Gukesh_D' : game.opponent,
      black: index % 2 === 0 ? game.opponent : 'Gukesh_D',
      whiteElo: index % 2 === 0 ? '2750' : game.elo.toString(),
      blackElo: index % 2 === 0 ? game.elo.toString() : '2750',
      result: game.result,
      unlisted: false,
    },
  };
  mockDirectory.itemIds.push(itemId);
});

function testPerformanceRatingLow() {
  console.log("== LOWER RATED OPPONENTS ==");
  const metric = getPerformanceRating("Gukesh_D", mockDirectory, RatingSystem.Chesscom, '1900-2000');
  console.log(metric);
}

testPerformanceRatingLow();
