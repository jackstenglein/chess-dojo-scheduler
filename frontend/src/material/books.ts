export interface Book {
    title: string;
    author?: string;
    link?: string;
}

export interface CohortBooks {
    cohort: string;
    books: Book[];
}

export interface BookSection {
    title: string;
    cohorts: CohortBooks[];
}

export const sections: BookSection[] = [
    {
        title: 'Main Recommendations',
        cohorts: [
            {
                cohort: '0-300',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: "Everyone's First Chess Workbook Part 1",
                        author: 'Peter Giannatos',
                        link: 'https://amzn.to/3ZQSRVa',
                    },
                ],
            },
            {
                cohort: '300-400',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: "Everyone's First Chess Workbook Part 1",
                        author: 'Peter Giannatos',
                        link: 'https://amzn.to/3ZQSRVa',
                    },
                ],
            },
            {
                cohort: '400-500',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: "Everyone's First Chess Workbook Parts 1-2",
                        author: 'Peter Giannatos',
                        link: 'https://amzn.to/3ZQSRVa',
                    },
                ],
            },
            {
                cohort: '500-600',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: "Everyone's First Chess Workbook Parts 1-2",
                        author: 'Peter Giannatos',
                        link: 'https://amzn.to/3ZQSRVa',
                    },
                ],
            },
            {
                cohort: '600-700',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: "Everyone's First Chess Workbook Parts 1-3",
                        author: 'Peter Giannatos',
                        link: 'https://amzn.to/3ZQSRVa',
                    },
                ],
            },
            {
                cohort: '700-800',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: "Everyone's First Chess Workbook Parts 1-3",
                        author: 'Peter Giannatos',
                        link: 'https://amzn.to/3ZQSRVa',
                    },
                ],
            },
            {
                cohort: '800-900',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Learn Chess the Right Way: Book 3',
                        author: 'Susan Polgar',
                        link: 'https://amzn.to/41BiF8n',
                    },
                ],
            },
            {
                cohort: '900-1000',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Learn Chess the Right Way: Book 3',
                        author: 'Susan Polgar',
                        link: 'https://amzn.to/41BiF8n',
                    },
                    {
                        title: 'First Book of Morphy',
                        author: 'Frisco Del Rosario',
                        link: 'https://amzn.to/3mpoG8X',
                    },
                ],
            },
            {
                cohort: '1000-1100',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Learn Chess the Right Way: Book 3',
                        author: 'Susan Polgar',
                        link: 'https://amzn.to/41BiF8n',
                    },
                    {
                        title: 'First Book of Morphy',
                        author: 'Frisco Del Rosario',
                        link: 'https://amzn.to/3mpoG8X',
                    },
                ],
            },
            {
                cohort: '1100-1200',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Logical Chess: Move by Move',
                        author: 'Irving Chernev',
                        link: 'https://amzn.to/41XE8ta',
                    },
                    {
                        title: 'Most Instructive Games',
                        author: 'Irving Chernev',
                        link: 'https://amzn.to/3ymxorn',
                    },
                ],
            },
            {
                cohort: '1200-1300',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Logical Chess: Move by Move',
                        author: 'Irving Chernev',
                        link: 'https://amzn.to/41XE8ta',
                    },
                    {
                        title: 'Most Instructive Games',
                        author: 'Irving Chernev',
                        link: 'https://amzn.to/3ymxorn',
                    },
                ],
            },
            {
                cohort: '1300-1400',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Winning Chess Strategies',
                        author: 'Yasser Seirawan',
                        link: 'https://amzn.to/3mD1ynK',
                    },
                    {
                        title: 'Modern Ideas in Chess',
                        author: 'Richard Reti',
                        link: 'https://amzn.to/3SVRan7',
                    },
                ],
            },
            {
                cohort: '1400-1500',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Winning Chess Strategies',
                        author: 'Yasser Seirawan',
                        link: 'https://amzn.to/3mD1ynK',
                    },
                    {
                        title: 'Modern Ideas in Chess',
                        author: 'Richard Reti',
                        link: 'https://amzn.to/3SVRan7',
                    },
                ],
            },
            {
                cohort: '1500-1600',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Simple Chess',
                        author: 'Michael Stean',
                        link: 'https://amzn.to/3SYGgge',
                    },
                    {
                        title: 'Evaluate Like a Grandmaster',
                        author: 'Eugene Perelshteyn',
                        link: 'https://amzn.to/3IZZk9w',
                    },
                    {
                        title: 'How to Reassess Your Chess',
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Lfqfk6',
                    },
                ],
            },
            {
                cohort: '1600-1700',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Simple Chess',
                        author: 'Michael Stean',
                        link: 'https://amzn.to/3SYGgge',
                    },
                    {
                        title: 'Evaluate Like a Grandmaster',
                        author: 'Eugene Perelshteyn',
                        link: 'https://amzn.to/3IZZk9w',
                    },
                    {
                        title: 'How to Reassess Your Chess',
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Lfqfk6',
                    },
                ],
            },
            {
                cohort: '1700-1800',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Evaluate Like a Grandmaster',
                        author: 'Eugene Perelshteyn',
                        link: 'https://amzn.to/3IZZk9w',
                    },
                    {
                        title: 'How to Reassess Your Chess',
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Lfqfk6',
                    },
                    {
                        title: 'Art of Attack in Chess',
                        author: 'Vladimir Vukovic',
                        link: 'https://amzn.to/3SYIw7c',
                    },
                ],
            },
            {
                cohort: '1800-1900',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Art of Attack in Chess',
                        author: 'Vladimir Vukovic',
                        link: 'https://amzn.to/3SYIw7c',
                    },
                    {
                        title: 'New York 1924',
                        author: 'Alexander Alekhine',
                        link: 'https://amzn.to/3yjYY8C',
                    },
                    {
                        title: 'Zurich 1953',
                        author: 'David Bronstein',
                        link: 'https://amzn.to/3ZxMB4I',
                    },
                ],
            },
            {
                cohort: '1900-2000',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Art of Attack in Chess',
                        author: 'Vladimir Vukovic',
                        link: 'https://amzn.to/3SYIw7c',
                    },
                    {
                        title: 'New York 1924',
                        author: 'Alexander Alekhine',
                        link: 'https://amzn.to/3yjYY8C',
                    },
                    {
                        title: 'Zurich 1953',
                        author: 'David Bronstein',
                        link: 'https://amzn.to/3ZxMB4I',
                    },
                    {
                        title: 'Tal-Botvinnik 1960',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3F7taHI',
                    },
                ],
            },
            {
                cohort: '2000-2100',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Tal-Botvinnik 1960',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3F7taHI',
                    },
                    {
                        title: 'My 60 Memorable Games',
                        author: 'Bobby Fischer',
                        link: 'https://amzn.to/3Yv6058',
                    },
                    {
                        title: 'Life & Games of Mikhail Tal',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3mCnOOz',
                    },
                    {
                        title: 'Secrets of Grandmaster Chess',
                        author: 'John Nunn',
                        link: 'https://amzn.to/3YAtS7k',
                    },
                    {
                        title: 'Seven Deadly Chess Sins',
                        author: 'Jonathan Rowson',
                        link: 'https://amzn.to/3F8P39T',
                    },
                    {
                        title: 'Mastering Chess Strategy',
                        author: 'Johan Hellsten',
                        link: 'https://amzn.to/3kZ4ria',
                    },
                    {
                        title: 'New York 1924',
                        author: 'Alexander Alekhine',
                        link: 'https://amzn.to/3yjYY8C',
                    },
                ],
            },
            {
                cohort: '2100-2200',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Tal-Botvinnik 1960',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3F7taHI',
                    },
                    {
                        title: 'My 60 Memorable Games',
                        author: 'Bobby Fischer',
                        link: 'https://amzn.to/3Yv6058',
                    },
                    {
                        title: 'Life & Games of Mikhail Tal',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3mCnOOz',
                    },
                    {
                        title: 'Secrets of Grandmaster Chess',
                        author: 'John Nunn',
                        link: 'https://amzn.to/3YAtS7k',
                    },
                    {
                        title: 'Seven Deadly Chess Sins',
                        author: 'Jonathan Rowson',
                        link: 'https://amzn.to/3F8P39T',
                    },
                    {
                        title: 'Mastering Chess Strategy',
                        author: 'Johan Hellsten',
                        link: 'https://amzn.to/3kZ4ria',
                    },
                    {
                        title: 'New York 1924',
                        author: 'Alexander Alekhine',
                        link: 'https://amzn.to/3yjYY8C',
                    },
                    {
                        title: 'Chess Structures: A Grandmaster Guide',
                        author: 'Mauricio Flores Rios',
                        link: 'https://amzn.to/3IYBBqg',
                    },
                ],
            },
            {
                cohort: '2200-2300',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'Tal-Botvinnik 1960',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3F7taHI',
                    },
                    {
                        title: 'Seven Deadly Chess Sins',
                        author: 'Jonathan Rowson',
                        link: 'https://amzn.to/3F8P39T',
                    },
                    {
                        title: 'Secrets of Grandmaster Chess',
                        author: 'John Nunn',
                        link: 'https://amzn.to/3YAtS7k',
                    },
                    {
                        title: 'My 60 Memorable Games',
                        author: 'Bobby Fischer',
                        link: 'https://amzn.to/3Yv6058',
                    },
                    {
                        title: 'Life & Games of Mikhail Tal',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3mCnOOz',
                    },
                    {
                        title: 'Mastering Chess Strategy',
                        author: 'Johan Hellsten',
                        link: 'https://amzn.to/3kZ4ria',
                    },
                    {
                        title: 'Chess Structures: A Grandmaster Guide',
                        author: 'Mauricio Flores Rios',
                        link: 'https://amzn.to/3IYBBqg',
                    },
                    {
                        title: 'Test of Time',
                        author: 'Garry Kasparov',
                    },
                ],
            },
            {
                cohort: '2300-2400',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'My 60 Memorable Games',
                        author: 'Bobby Fischer',
                        link: 'https://amzn.to/3Yv6058',
                    },
                    {
                        title: 'Tal-Botvinnik 1960',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3F7taHI',
                    },
                    {
                        title: 'Fire on Board',
                        author: 'Alexei Shirov',
                        link: 'https://amzn.to/3ypU2iF',
                    },
                    {
                        title: 'Kramnik: My Life & Games',
                        author: 'Vladimir Kramnik',
                        link: 'https://amzn.to/3mCHhi3',
                    },
                    {
                        title: 'Positional Decision Making',
                        author: 'Boris Gelfand',
                        link: 'https://amzn.to/3L7S0LB',
                    },
                    {
                        title: 'Test of Time',
                        author: 'Garry Kasparov',
                    },
                    {
                        title: 'Life & Games of Mikhail Tal',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3mCnOOz',
                    },
                ],
            },
            {
                cohort: '2400+',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: 'My 60 Memorable Games',
                        author: 'Bobby Fischer',
                        link: 'https://amzn.to/3Yv6058',
                    },
                    {
                        title: 'Fire on Board',
                        author: 'Alexei Shirov',
                        link: 'https://amzn.to/3ypU2iF',
                    },
                    {
                        title: 'Kramnik: My Life & Games',
                        author: 'Vladimir Kramnik',
                        link: 'https://amzn.to/3mCHhi3',
                    },
                    {
                        title: 'Positional Decision Making',
                        author: 'Boris Gelfand',
                        link: 'https://amzn.to/3L7S0LB',
                    },
                    {
                        title: 'Test of Time',
                        author: 'Garry Kasparov',
                    },
                    {
                        title: 'My Great Predecessors',
                        author: 'Garry Kasparov',
                        link: 'https://amzn.to/3kZ9OOm',
                    },
                    {
                        title: 'Life & Games of Mikhail Tal',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3mCnOOz',
                    },
                    {
                        title: 'Tal-Botvinnik 1960',
                        author: 'Mikhail Tal',
                        link: 'https://amzn.to/3F7taHI',
                    },
                ],
            },
        ],
    },
    {
        title: 'Tactics',
        cohorts: [
            {
                cohort: '0-1000',
                books: [
                    {
                        title: 'Chess: 5334 Problems, Combinations & Games',
                        author: 'Laszlo Polgar',
                        link: 'https://amzn.to/3lwCsGN',
                    },
                    {
                        title: "Everyone's First Chess Workbook",
                        author: 'Peter Giannatos',
                        link: 'https://amzn.to/3ZQSRVa',
                    },
                ],
            },
            {
                cohort: '1000-1100',
                books: [
                    {
                        title: 'Tactics Time',
                        author: 'Tim Brennan & Anthea Carson',
                        link: 'https://amzn.to/41ZZjeb',
                    },
                ],
            },
            {
                cohort: '1100-1200',
                books: [
                    {
                        title: 'Tactics Time',
                        author: 'Tim Brennan & Anthea Carson',
                        link: 'https://amzn.to/41ZZjeb',
                    },
                ],
            },
            {
                cohort: '1200-1300',
                books: [
                    {
                        title: 'Winning Chess Tactics',
                        author: 'Yasser Seirawan',
                        link: 'https://amzn.to/41UFsNs',
                    },
                ],
            },
            {
                cohort: '1300-1400',
                books: [
                    {
                        title: 'Winning Chess Tactics',
                        author: 'Yasser Seirawan',
                        link: 'https://amzn.to/41UFsNs',
                    },
                ],
            },
            {
                cohort: '1400-1500',
                books: [
                    {
                        title: 'Winning Chess Tactics',
                        author: 'Yasser Seirawan',
                        link: 'https://amzn.to/41UFsNs',
                    },
                ],
            },
            {
                cohort: '1500-1600',
                books: [
                    {
                        title: 'Chess Tactics from Scratch',
                        author: 'Martin Weteschnik',
                        link: 'https://amzn.to/3YvXB1l',
                    },
                ],
            },
            {
                cohort: '1600-1700',
                books: [
                    {
                        title: 'Chess Tactics from Scratch',
                        author: 'Martin Weteschnik',
                        link: 'https://amzn.to/3YvXB1l',
                    },
                ],
            },
            {
                cohort: '1700-1800',
                books: [
                    {
                        title: 'Chess Tactics from Scratch',
                        author: 'Martin Weteschnik',
                        link: 'https://amzn.to/3YvXB1l',
                    },
                ],
            },
            {
                cohort: '1800-1900',
                books: [
                    {
                        title: 'Woodpecker Method',
                        author: 'Axel Smith & Hans Tikkanen',
                        link: 'https://amzn.to/3FuI0bR',
                    },
                    {
                        title: 'Think Like a Super-GM',
                        author: 'Michael Adams & Philip Hurtado',
                        link: 'https://amzn.to/3Fbr61x',
                    },
                ],
            },
            {
                cohort: '1900-2000',
                books: [
                    {
                        title: 'Woodpecker Method',
                        author: 'Axel Smith & Hans Tikkanen',
                        link: 'https://amzn.to/3FuI0bR',
                    },
                    {
                        title: 'Think Like a Super-GM',
                        author: 'Michael Adams & Philip Hurtado',
                        link: 'https://amzn.to/3Fbr61x',
                    },
                ],
            },
            {
                cohort: '2000-2100',
                books: [
                    {
                        title: 'Woodpecker Method',
                        author: 'Axel Smith & Hans Tikkanen',
                        link: 'https://amzn.to/3FuI0bR',
                    },
                    {
                        title: 'Think Like a Super-GM',
                        author: 'Michael Adams & Philip Hurtado',
                        link: 'https://amzn.to/3Fbr61x',
                    },
                ],
            },
            {
                cohort: '2100-2200',
                books: [
                    {
                        title: 'Woodpecker Method',
                        author: 'Axel Smith & Hans Tikkanen',
                        link: 'https://amzn.to/3FuI0bR',
                    },
                    {
                        title: 'Think Like a Super-GM',
                        author: 'Michael Adams & Philip Hurtado',
                        link: 'https://amzn.to/3Fbr61x',
                    },
                ],
            },
            {
                cohort: '2200-2300',
                books: [
                    {
                        title: 'Perfect Your Chess',
                        author: 'Andrei Volokitin & Vladimir Grabinsky',
                        link: 'https://amzn.to/3mA75eP',
                    },
                    {
                        title: 'Think Like a Super-GM',
                        author: 'Michael Adams & Philip Hurtado',
                        link: 'https://amzn.to/3Fbr61x',
                    },
                ],
            },
            {
                cohort: '2300-2400',
                books: [
                    {
                        title: 'The Best Move',
                        author: 'Vlastimil Hort & Vlastimil Jansa',
                        link: 'https://amzn.to/3F3Fyc4',
                    },
                    {
                        title: 'Perfect Your Chess',
                        author: 'Andrei Volokitin & Vladimir Grabinsky',
                        link: 'https://amzn.to/3mA75eP',
                    },
                    {
                        title: 'Think Like a Super-GM',
                        author: 'Michael Adams & Philip Hurtado',
                        link: 'https://amzn.to/3Fbr61x',
                    },
                ],
            },
            {
                cohort: '2400+',
                books: [
                    {
                        title: 'The Best Move',
                        author: 'Vlastimil Hort & Vlastimil Jansa',
                        link: 'https://amzn.to/3F3Fyc4',
                    },
                    {
                        title: 'Perfect Your Chess',
                        author: 'Andrei Volokitin & Vladimir Grabinsky',
                        link: 'https://amzn.to/3mA75eP',
                    },
                    {
                        title: 'Grandmaster Preparation - Positional Play',
                        author: 'Jacob Aagaard',
                        link: 'https://amzn.to/3Yt2BUl',
                    },
                    {
                        title: 'Think Like a Super-GM',
                        author: 'Michael Adams & Philip Hurtado',
                        link: 'https://amzn.to/3Fbr61x',
                    },
                ],
            },
        ],
    },
    {
        title: 'Endgames',
        cohorts: [
            {
                cohort: '0-1000',
                books: [
                    {
                        title: 'No Books',
                    },
                ],
            },
            {
                cohort: '1000-1100',
                books: [
                    {
                        title: "Silman's Complete Endgame Course Parts 1-3",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1100-1200',
                books: [
                    {
                        title: "Silman's Complete Endgame Course Parts 1-3",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1200-1300',
                books: [
                    {
                        title: "Silman's Complete Endgame Course Parts 1-3, Part 4 through pg. 120",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1300-1400',
                books: [
                    {
                        title: "Silman's Complete Endgame Course Parts 1-3, Part 4 through pg. 120",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1400-1500',
                books: [
                    {
                        title: "Capablanca's Best Endings",
                        author: 'Irving Chernev',
                        link: 'https://amzn.to/3V36NKg',
                    },
                    {
                        title: "Silman's Complete Endgame Course Parts 3-4",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1500-1600',
                books: [
                    {
                        title: "Capablanca's Best Endings",
                        author: 'Irving Chernev',
                        link: 'https://amzn.to/3V36NKg',
                    },
                    {
                        title: "Silman's Complete Endgame Course Part 4",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1600-1700',
                books: [
                    {
                        title: "Capablanca's Best Endings",
                        author: 'Irving Chernev',
                        link: 'https://amzn.to/3V36NKg',
                    },
                    {
                        title: "Silman's Complete Endgame Course Part 5",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1700-1800',
                books: [
                    {
                        title: "Silman's Complete Endgame Course Part 5, Part 6 through pg. 242",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1800-1900',
                books: [
                    {
                        title: 'Endgame Strategy',
                        author: 'Mikhail Shereshevsky',
                        link: 'https://amzn.to/3J3K2k3',
                    },
                    {
                        title: "Silman's Complete Endgame Course Part 6",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '1900-2000',
                books: [
                    {
                        title: 'Endgame Strategy',
                        author: 'Mikhail Shereshevsky',
                        link: 'https://amzn.to/3J3K2k3',
                    },
                    {
                        title: "Silman's Complete Endgame Course Part 6",
                        author: 'Jeremy Silman',
                        link: 'https://amzn.to/3Yt3goN',
                    },
                ],
            },
            {
                cohort: '2000-2100',
                books: [
                    {
                        title: 'Endgame Strategy',
                        author: 'Mikhail Shereshevsky',
                        link: 'https://amzn.to/3J3K2k3',
                    },
                    {
                        title: '100 Endgames You Must Know',
                        author: 'Jesus de la Villa',
                        link: 'https://amzn.to/3J2hSpo',
                    },
                    {
                        title: 'Endgame Virtuoso',
                        author: 'Vasily Smyslov',
                        link: 'https://amzn.to/3yobRyE',
                    },
                ],
            },
            {
                cohort: '2100-2200',
                books: [
                    {
                        title: '100 Endgames You Must Know',
                        author: 'Jesus de la Villa',
                        link: 'https://amzn.to/3J2hSpo',
                    },
                    {
                        title: 'Endgame Virtuoso',
                        author: 'Vasily Smyslov',
                        link: 'https://amzn.to/3yobRyE',
                    },
                ],
            },
            {
                cohort: '2200-2300',
                books: [
                    {
                        title: '100 Endgames You Must Know',
                        author: 'Jesus de la Villa',
                        link: 'https://amzn.to/3J2hSpo',
                    },
                    {
                        title: 'Endgame Virtuoso',
                        author: 'Vasily Smyslov',
                        link: 'https://amzn.to/3yobRyE',
                    },
                    {
                        title: 'Mastering Endgame Strategy',
                        author: 'Johan Hellsten',
                    },
                ],
            },
            {
                cohort: '2300-2400',
                books: [
                    {
                        title: 'Mastering Endgame Strategy',
                        author: 'Johan Hellsten',
                    },
                    {
                        title: 'Rook Endings',
                        author: 'Grigory Levenfish & Vasily Smyslov',
                        link: 'https://amzn.to/3ZIYmW0',
                    },
                    {
                        title: 'Endgame Tactics',
                        author: 'Ger van Perlo',
                        link: 'https://amzn.to/3T1lbBK',
                    },
                    {
                        title: "Dvoretsky's Endgame Manual",
                        author: 'Mark Dvoretsky',
                        link: 'https://amzn.to/3JoaVk1',
                    },
                ],
            },
            {
                cohort: '2400+',
                books: [
                    {
                        title: 'Mastering Endgame Strategy',
                        author: 'Johan Hellsten',
                    },
                    {
                        title: 'Rook Endings',
                        author: 'Grigory Levenfish & Vasily Smyslov',
                        link: 'https://amzn.to/3ZIYmW0',
                    },
                    {
                        title: 'Endgame Tactics',
                        author: 'Ger van Perlo',
                        link: 'https://amzn.to/3T1lbBK',
                    },
                    {
                        title: "Dvoretsky's Endgame Manual",
                        author: 'Mark Dvoretsky',
                        link: 'https://amzn.to/3JoaVk1',
                    },
                ],
            },
        ],
    },
];
