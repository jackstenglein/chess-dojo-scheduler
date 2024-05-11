import { StaticImageData } from 'next/image';
import dojoDigestVol8Image from './dojo-digest/vol-8/dojo_3-0.webp';

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
    // {
    //     title: 'Introducing Dojo Tactics Tests - A New Way to Assess Your Skills',
    //     subtitle: 'May 9, 2024',
    //     body: `The Dojo is releasing a new form of “online tactics trainer,” one that attempts to improve on the most popular existing trainers (Chess.com, Lichess, ChessTempo, etc.) and provide players a much more realistic tactics rating...`,
    //     href: '/blog/tactics-test',
    //     image: {
    //         src: tacticsTestImage,
    //         alt: 'Graph of tactics test results',
    //     },
    // },
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
