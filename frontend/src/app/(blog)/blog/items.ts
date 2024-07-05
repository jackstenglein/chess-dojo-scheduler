import mastersImage from './dojo-digest/vol-10/masters.png';
import dojoDigestVol8Image from './dojo-digest/vol-8/dojo_3-0.webp';
import talkstop2025 from './dojo-talks/top-10-2025/image.webp';
import tacticsTestImage from './tactics-test/image.png';

export interface BlogItem {
    title: string;
    subtitle?: string;
    body: string;
    href: string;
    image: {
        src: string;
        alt: string;
    };
}

const items: BlogItem[] = [
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
