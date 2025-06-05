import { Directory, DirectoryAccessRole } from "@jackstenglein/chess-dojo-common/src/database/directory";
import { getPerformanceRating } from "./rating";
import { RatingSystem } from "./ratingtypes";

export const mockDirectory: Directory = {
  owner: "642dc91f-955e-4f19-b170-39195cb449e1",
  id: "f1a33851-fb04-468c-847c-8133a99f407a",
  parent: "bc555ca3-0788-4f95-9fa7-9642ffc7853b",
  name: "Kostya games",
  visibility: "PUBLIC",
  createdAt: "2025-05-16T16:39:50.304Z",
  updatedAt: "2025-05-16T18:02:44.144Z",
  items: {
    "14211939-2c9c-4c59-8eae-876e5a0bf006": {
      type: "DIRECTORY",
      id: "14211939-2c9c-4c59-8eae-876e5a0bf006",
      addedBy: "642dc91f-955e-4f19-b170-39195cb449e1",
      metadata: {
        createdAt: "2025-05-16T18:02:44.144Z",
        updatedAt: "2025-05-16T18:02:44.144Z",
        visibility: "PUBLIC",
        name: "kostya game part 2"
      }
    },
    "2000-2100/2025.05.16_0d939c67-48bb-4efd-8cd2-5d822b0b6319": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_0d939c67-48bb-4efd-8cd2-5d822b0b6319",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_0d939c67-48bb-4efd-8cd2-5d822b0b6319",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:48:18.094Z",
        white: "Beck, Michael",
        black: "Kavutskiy, Kostya",
        whiteElo: "2071",
        blackElo: "2328",
        result: "0-1",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_14727d64-ac69-493c-b872-d4b5d325efd9": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_14727d64-ac69-493c-b872-d4b5d325efd9",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_14727d64-ac69-493c-b872-d4b5d325efd9",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:55:44.193Z",
        white: "Kavutskiy, Kostya",
        black: "Gayon, Benoit",
        whiteElo: "2384",
        blackElo: "1938",
        result: "1-0",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_3646014c-d9b1-4d0b-8e77-673d05b6cb1d": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_3646014c-d9b1-4d0b-8e77-673d05b6cb1d",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_3646014c-d9b1-4d0b-8e77-673d05b6cb1d",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:41:04.317Z",
        white: "Sanchez Carrasco, Francisco Javier",
        black: "Kavutskiy, Kostya",
        whiteElo: "2005",
        blackElo: "2328",
        result: "0-1",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_370c976d-10df-409b-9955-73a47e3e0fcf": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_370c976d-10df-409b-9955-73a47e3e0fcf",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_370c976d-10df-409b-9955-73a47e3e0fcf",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:42:05.035Z",
        white: "Kavutskiy, Kostya",
        black: "Boulahfa, Hicham",
        whiteElo: "2328",
        blackElo: "2183",
        result: "0-1",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_4bab6536-bb3b-49b6-863d-b6bfd623b202": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_4bab6536-bb3b-49b6-863d-b6bfd623b202",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_4bab6536-bb3b-49b6-863d-b6bfd623b202",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:46:44.559Z",
        white: "Kavutskiy, Kostya",
        black: "Boeren, Jurriaan",
        whiteElo: "2328",
        blackElo: "2159",
        result: "1-0",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_578bf115-c0ad-406b-ab58-135a22483c37": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_578bf115-c0ad-406b-ab58-135a22483c37",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_578bf115-c0ad-406b-ab58-135a22483c37",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:45:48.894Z",
        white: "Davies, Nigel R",
        black: "Kavutskiy, Kostya",
        whiteElo: "2328",
        blackElo: "2328",
        result: "0-1",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_5ae25a26-cbc4-45f5-b303-a0ea1ec6b7f3": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_5ae25a26-cbc4-45f5-b303-a0ea1ec6b7f3",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_5ae25a26-cbc4-45f5-b303-a0ea1ec6b7f3",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:45:15.320Z",
        white: "Kavutskiy, Kostya",
        black: "Mikhalevski, Victor",
        whiteElo: "2328",
        blackElo: "2482",
        result: "0-1",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_99f6d83a-4af7-4be7-a3c5-64e24988c905": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_99f6d83a-4af7-4be7-a3c5-64e24988c905",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_99f6d83a-4af7-4be7-a3c5-64e24988c905",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:40:24.214Z",
        white: "Kavutskiy, Kostya",
        black: "Otero Nogueira, Brais",
        whiteElo: "2328",
        blackElo: "2134",
        result: "1/2-1/2",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_9c7f745a-77c6-4c2a-80c8-2d98322a44a5": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_9c7f745a-77c6-4c2a-80c8-2d98322a44a5",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_9c7f745a-77c6-4c2a-80c8-2d98322a44a5",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:49:13.511Z",
        white: "Kavutskiy, Kostya",
        black: "Rey Chimera, Luca",
        whiteElo: "2328",
        blackElo: "2034",
        result: "1-0",
        unlisted: false
      }
    },
    "2000-2100/2025.05.16_ec7f2bfd-6daa-4131-ab17-5491eb66f66f": {
      type: "OWNED_GAME",
      id: "2000-2100/2025.05.16_ec7f2bfd-6daa-4131-ab17-5491eb66f66f",
      metadata: {
        cohort: "2000-2100",
        id: "2025.05.16_ec7f2bfd-6daa-4131-ab17-5491eb66f66f",
        owner: "642dc91f-955e-4f19-b170-39195cb449e1",
        ownerDisplayName: "Jalp p",
        createdAt: "2025-05-16T16:42:38.636Z",
        white: "Dias, Ivo Rodrigues",
        black: "Kavutskiy, Kostya",
        whiteElo: "2106",
        blackElo: "2328",
        result: "1/2-1/2",
        unlisted: false
      }
    }
  },
  itemIds: [
    "2000-2100/2025.05.16_99f6d83a-4af7-4be7-a3c5-64e24988c905",
    "2000-2100/2025.05.16_3646014c-d9b1-4d0b-8e77-673d05b6cb1d",
    "2000-2100/2025.05.16_370c976d-10df-409b-9955-73a47e3e0fcf",
    "2000-2100/2025.05.16_ec7f2bfd-6daa-4131-ab17-5491eb66f66f",
    "2000-2100/2025.05.16_5ae25a26-cbc4-45f5-b303-a0ea1ec6b7f3",
    "2000-2100/2025.05.16_578bf115-c0ad-406b-ab58-135a22483c37",
    "2000-2100/2025.05.16_4bab6536-bb3b-49b6-863d-b6bfd623b202",
    "2000-2100/2025.05.16_0d939c67-48bb-4efd-8cd2-5d822b0b6319",
    "2000-2100/2025.05.16_9c7f745a-77c6-4c2a-80c8-2d98322a44a5",
    "2000-2100/2025.05.16_14727d64-ac69-493c-b872-d4b5d325efd9",
    "14211939-2c9c-4c59-8eae-876e5a0bf006"
  ],
  access: {
    "642dc91f-955e-4f19-b170-39195cb449e1": DirectoryAccessRole.Owner
  }
};

interface PerformanceRatingMetric {
    combinedRating: number,
    normalizedCombinedRating: number,
    avgOppRating: number,
    normalizedAvgOppRating: number,
    whiteRating: number,
    normalizedWhiteRating: number,
    avgOppWhiteRating: number,
    normalizedAvgWhiteOppRating: number
    blackRating: number,
    normalizedBlackRating: number,
    avgOppBlackRating: number,
    normalizedAvgBlackOppRating: number,
    winRatio: number,
    drawRatio: number, 
    lossRatio: number,
    cohortRatings: Map<string, CohortRatingMetric>;
}

interface CohortRatingMetric {
    rating: number;
    avgOppRating: number;
    winRate: number;
    drawRate: number;
    lossRate: number;
    oppRatings: number[];
    gamesCount: number;
    ratios: number[];
}

function printPerformanceRatingMetric(metric: PerformanceRatingMetric): void {
  console.log("combinedRating:", metric.combinedRating);
  console.log("normalizedCombinedRating:", metric.normalizedCombinedRating);
  console.log("whiteRating:", metric.whiteRating);
  console.log("normalizedWhiteRating:", metric.normalizedWhiteRating);
  console.log("blackRating:", metric.blackRating);
  console.log("normalizedBlackRating:", metric.normalizedBlackRating);
  console.log("avgOppRating:", metric.avgOppRating);
  console.log("normalizedAvgOppRating:", metric.normalizedAvgOppRating);
  console.log("avgOppWhiteRating:", metric.avgOppWhiteRating);
  console.log("normalizedAvgWhiteOppRating:", metric.normalizedAvgWhiteOppRating);
  console.log("avgOppBlackRating:", metric.avgOppBlackRating);
  console.log("normalizedAvgBlackOppRating:", metric.normalizedAvgBlackOppRating);
  console.log("winRatio:", metric.winRatio);
  console.log("drawRatio:", metric.drawRatio);
  console.log("lossRatio:", metric.lossRatio);
  console.log("cohortRatings:");
  for (const [cohort, cohortMetric] of metric.cohortRatings.entries()) {
    console.log(`  ${cohort}:`);
    console.log(`    rating: ${cohortMetric.rating}`);
    console.log(`    oppRatings: [${cohortMetric.oppRatings.join(", ")}]`);
    console.log(`    gamesCount: ${cohortMetric.gamesCount}`);
    console.log(`    ratios: [${cohortMetric.ratios.join(", ")}]`);
    console.log(`    AvgOppRating: ${cohortMetric.avgOppRating}`)
    console.log(`    winRate: ${cohortMetric.winRate}`);
    console.log(`    drawRate: ${cohortMetric.drawRate}`);
    console.log(`    lossRate: ${cohortMetric.lossRate}`);
  }
}

function testPerformanceRatingKostya() {
  console.log("== KOSTYA GAMES ==");
  const metric = getPerformanceRating(
    "Kavutskiy, Kostya",
    mockDirectory,
    RatingSystem.Fide,
  );
  printPerformanceRatingMetric(metric);
}

testPerformanceRatingKostya();
