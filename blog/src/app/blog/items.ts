import { StaticImageData } from 'next/image';
import dojoDigestVol8Image from './dojo-digest/vol-8/dojo_3-0.webp';
import tacticsTestImage from './tactics-test/image.png';
import talksLoseMind from './dojo-talks-lose-mind/losemind.webp'

export interface BlogItem {
    title: string;
    subtitle?: string;
    body: string;
    href: string;
    image: {
        src: StaticImageData;
        alt: string;
    };
}

const items: BlogItem[] = [
    {
        title: 'Do World Champions Lose Their Minds? | Dojo Talks',
        subtitle: 'Jesse, Kostya, and David • May 17, 2024',
        body: `On today's episode of Dojo Talks, the ChessDojo podcast, GM Jesse Kraai, IM Kostya Kavutskiy, and IM David Pruess talk about the impact of the FIDE World Chess Championship circuit on mental health and the sanity of those who endure it.`,
        href: '/blog/dojo-talks-lose-mind',
        image: {
            src: talksLoseMind,
            alt: 'Thumbnail',
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
