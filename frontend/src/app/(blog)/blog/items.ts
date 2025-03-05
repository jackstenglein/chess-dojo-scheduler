import mastersImage from './dojo-digest/vol-10/masters.png';
import dojoDigestVol11Image from './dojo-digest/vol-11/kraai.jpg';
import dojoDigestVol12Image from './dojo-digest/vol-12/dojo-files.png';
import stockfishImage from './dojo-digest/vol-13/stockfish.png';
import fileSharingImage from './dojo-digest/vol-14/share-directory.png';
import heatmap from './dojo-digest/vol-15/Finochess.jpg';
import freemonth from './dojo-digest/vol-16/freemonth.webp';
import yearstats from './dojo-digest/vol-17/2024+stats.png';
import masteringtime from './dojo-digest/vol-18/mastering-time.png';
import dojoDigestVol8Image from './dojo-digest/vol-8/dojo_3-0.webp';
import dojoDigestVol9Image from './dojo-digest/vol-9/newTests.png';
import worldrapid from './dojo-talks/2024-world-rapid-blitz/2024-rapid.png';
import talkstop2025 from './dojo-talks/top-10-2025/image.webp';
import ratingConverter from './new-ratings/noseknowsall/ratings-image05.png';
import olympiadImage from './olympiad-2024/olympiad.jpg';
import dandeerImage from './player-spotlight/dandeer/opengraph-image.jpg';
import tacticsTestImage from './tactics-test/image.png';

export interface BlogItem {
    title: string;
    subtitle?: string;
    body: string;
    href: string;
    image?: {
        src: string;
        alt: string;
    };
}

const items: BlogItem[] = [
    {
        title: 'New Courses, Badges, & more!',
        subtitle: 'Dojo Digest • March 1, 2025',
        body: `Mastering Time in Chess is finally out on Chessable!`,
        href: '/blog/dojo-digest/vol-18',
        image: {
            src: masteringtime,
            alt: '',
        },
    },
    {
        title: 'Round Robin Tournaments, Custom Tasks, & more! | Dojo Digest',
        subtitle: 'Dojo Digest • February 1, 2025',
        body: `Round robin tournaments are open for non-members, and you can now create custom tasks in your training plan!`,
        href: '/blog/dojo-digest/vol-17',
        image: {
            src: yearstats,
            alt: '',
        },
    },
    {
        title: '2024 World Rapid & Blitz w/ GM Hammer | Dojo Talks',
        subtitle: 'DojoTalks • January 3, 2025',
        body: `The senseis are joined by GM Jon Ludvig Hammer to discuss the 2024 World Rapid & Blitz Championship.`,
        href: '/blog/dojo-talks/2024-world-rapid-blitz',
        image: {
            src: worldrapid,
            alt: '',
        },
    },
    {
        title: 'Free Month at the Dojo',
        subtitle: 'Dojo Digest Vol 16 • January 1, 2025',
        body: `Make your New Year’s resolution and join the Dojo for the month of January at no cost!`,
        href: '/blog/dojo-digest/vol-16',
        image: {
            src: freemonth,
            alt: '',
        },
    },
    {
        title: 'The Heatmap has evolved',
        subtitle: 'Dojo Digest Vol 15 • December 1, 2024',
        body: `The heatmap has evolved! Many thanks to Jalp aka Noobmaster for making a vision into a reality.`,
        href: '/blog/dojo-digest/vol-15',
        image: {
            src: heatmap,
            alt: '',
        },
    },
    {
        title: 'New Folder Sharing and Other Updates',
        subtitle: 'Dojo Digest Vol 14 • November 1, 2024',
        body: `Two months ago, we announced our file system for organizing your games and repertoires. Today, we're releasing a major update, which allows you to share folders with other users.`,
        href: '/blog/dojo-digest/vol-14',
        image: {
            src: fileSharingImage,
            alt: '',
        },
    },
    {
        title: 'Stockfish Now Available in Game Annotator',
        subtitle: 'Dojo Digest Vol 13 • October 1, 2024',
        body: 'Stockfish 17 (desktop version) and Stockfish 16 (mobile version) are now both available in our game annotator. Both engines run locally in your browser, although...',
        href: '/blog/dojo-digest/vol-13',
        image: {
            src: stockfishImage,
            alt: '',
        },
    },
    {
        title: 'Dandeer',
        subtitle: 'Dojo Player Spotlight • September 30, 2024',
        body: 'Dandeer is a member of the 1300-1400 cohort and plays classical OTB at his club in Hungary.',
        href: '/blog/player-spotlight/dandeer',
        image: {
            src: dandeerImage,
            alt: 'Dandeer (with the black pieces) playing a 90+30 tournament at his club in Hungary in April 2024',
        },
    },
    {
        title: 'Universal Rating Converter for 2024',
        subtitle: 'NoseKnowsAll • September 24, 2024',
        body: `Explaining the math behind ChessDojo's new universal rating converter.`,
        href: '/blog/new-ratings/noseknowsall',
        image: {
            src: ratingConverter,
            alt: '',
        },
    },
    {
        title: 'The New Dojo Rating Translator',
        subtitle: 'Jesse Kraai • September 15, 2024',
        body: `One of the first and essential building stones of the Dojo Training Program was the creation of a universal rating system...`,
        href: '/blog/new-ratings',
    },
    {
        title: 'Dojo at the Olympiad',
        subtitle: 'September 12, 2024',
        body: `Jan (LifeCanBeSoNice) got the party started with an amazing AI driven hype video, and Sensei David covers German #1 Vincent Keymer's streak in the 2024 Akiba Rubinstein Memorial.`,
        href: '/blog/olympiad-2024',
        image: {
            src: olympiadImage,
            alt: '',
        },
    },
    {
        title: 'Will LifeCanBeSoNice Reach 2000?',
        subtitle: 'Dojo Player Spotlight • September 2, 2024',
        body: `Jan, aka LifeCanBeSoNice, is going for it. Since joining the Dojo last year, he has gained 279 points and has started his own chess improvement channel with his coach IM Jurica Srbis. His goal is 2000 Lichess. It’s a magical number! Will he be able to make it?`,
        href: '/blog/player-spotlight/lifecanbesonice',
    },
    {
        title: 'Introducing the Dojo File System',
        subtitle: 'Dojo Digest Vol 12 • September 1, 2024',
        body: `The Dojo has a new file system to help you organize and manage your games! A new files tab has been added to your profile. You'll start out with an empty Home folder, where you can add games or nested folders...`,
        href: '/blog/dojo-digest/vol-12',
        image: {
            src: dojoDigestVol12Image,
            alt: '',
        },
    },
    {
        title: 'Jesse Kraai Scores Clear Second at the US Senior',
        subtitle: 'Dojo Digest Vol 11 • August 1, 2024',
        body: `Sensei Kraai trusted the program and the results finally came. In a field of legends, 9 GMs and one IM, the sensei won his last four games and scored his fifth GM norm...`,
        href: '/blog/dojo-digest/vol-11',
        image: {
            src: dojoDigestVol11Image,
            alt: '',
        },
    },
    {
        title: 'Introducing the Dojo Masters Database',
        subtitle: 'Dojo Digest Vol 10 • July 1, 2024',
        body: `We now have a database of master-level games, filterable by time control! We currently have 250,000 games available and are in the process of uploading another 5 million...`,
        href: '/blog/dojo-digest/vol-10',
        image: {
            src: mastersImage,
            alt: '',
        },
    },
    {
        title: 'Who Will Be Top 10 in 2025? | Dojo Talks',
        subtitle: 'Jesse, Kostya, and David • June 7, 2024',
        body: `GM Jesse Kraai, IM David Pruess, and IM Kostya Kavutskiy forecast who will be the top 10 FIDE rated chess players in June 2025 in today's episode of Dojo Talks, the ChessDojo podcast.`,
        href: '/blog/dojo-talks/top-10-2025',
        image: {
            src: talkstop2025,
            alt: '',
        },
    },
    {
        title: 'Rolling out Additional Tactics Tests',
        subtitle: 'Dojo Digest Vol 9 • June 1, 2024',
        body: 'May has been all about the development of our three trainers: tactics, endgame, and positional. On May 1st we posted our tests for 1500-2000 and 2000+. June 1st will see the rollout of tests for all cohorts...',
        href: '/blog/dojo-digest/vol-9',
        image: {
            src: dojoDigestVol9Image,
            alt: '',
        },
    },
    {
        title: 'Introducing Dojo Tactics Tests – A New Way to Assess Your Skills',
        subtitle: 'Kostya Kavutskiy • May 15, 2024',
        body: `The Dojo has released a new training skill designed to test tactical skill, attempting to improve on the most popular existing "tactics trainers" and provide players a much more realistic "tactics rating"...`,
        href: '/blog/tactics-test',
        image: {
            src: tacticsTestImage,
            alt: 'Graph of tactics test results',
        },
    },
    {
        title: 'Welcome to Dojo 3.0!',
        subtitle: 'Dojo Digest Vol 8 • May 1, 2024',
        body: "We launched the training program 2 years ago with a Google doc and a couple of paper clips. Since then, we've made great technical improvements and learned a lot about what chess improvement involves across the rating spectrum...",
        href: '/blog/dojo-digest/vol-8',
        image: {
            src: dojoDigestVol8Image,
            alt: '',
        },
    },
];

export default items;
