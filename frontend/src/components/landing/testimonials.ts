export interface TestimonialProps {
    quote: string;
    name: string;
    rating: string;
    cohort: string;
}

export const testimonials: TestimonialProps[] = [
    {
        quote: 'The first month in this program has given me a great roadmap to transition away from being a purely online rapid player and toward playing longer and thinking deeper in a way that is already more rewarding.',
        name: 'Lucasimnida',
        rating: '1619 Lichess',
        cohort: '1200-1300',
    },
    {
        quote: `The Dojo has single-handedly been the best thing to happen for my chess. I was stuck in the mid 700s on chess.com and showing little improvement. However, in a short time, I managed to break the 1k club. None of this would have been possible without the Dojo's program.`,
        name: 'PepperChess',
        rating: '1011 Chess.com Rapid',
        cohort: '1100-1200',
    },
    {
        quote: `This program is really helping me treat chess with respect. Meaning that I approach each task with more reverence and more focus, which I am sure is leading to better results and a more consistent mindset.`,
        name: 'Benwick',
        rating: '1400 ECF',
        cohort: '1300-1400',
    },
    {
        quote: `I was struggling to get above 1300 when I found the Dojo, and now I am just laughing at 1400s and their timid superficial plans and little tricks.`,
        name: 'quad-exe',
        rating: '1445 Chess.com Rapid',
        cohort: '1000-1100',
    },
];
