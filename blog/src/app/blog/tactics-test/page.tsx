import { Container, Link, Stack, Typography } from '@mui/material';
import { Metadata } from 'next';
import Image from 'next/image';
import tacticsTestImage from './image.png';
import sampleProblemImage from './sample-problem.png';

export const metadata: Metadata = {
    title: 'Dojo Tactics Tests - A New Way to Assess Your Skills | ChessDojo Blog',
    description:
        'ChessDojo introduces a new form of tactics test designed to improve on existing trainers',
};

export default function TacticsTest() {
    return (
        <Container maxWidth='sm' sx={{ py: 5 }}>
            <Stack sx={{ mb: 3 }}>
                <Typography variant='h4'>
                    Dojo Tactics Tests – A New Way to Assess Your Skills
                </Typography>
                <Typography variant='h6' color='text.secondary'>
                    Kostya Kavutskiy • May 14, 2024
                </Typography>
            </Stack>

            <Image
                src={tacticsTestImage}
                alt=''
                style={{ width: '100%', height: '100%', borderRadius: '8px' }}
                priority
            />

            <Stack mt={3}>
                <Typography>
                    With the 3.0 launch, the Dojo is releasing a new form of “online
                    tactics test,” one that attempts to improve on the most popular
                    existing trainers (Chess.com, Lichess, ChessTempo, etc.) and provide
                    players a much more realistic “tactics rating.”
                </Typography>

                <Typography mt={2}>
                    This is an exciting update as we aim to 1) help players improve with a
                    new and useful way to work on calculation, and 2) allow players to
                    assess their skills in a reliable way. We’re starting with our version
                    of "Tactics Tests" and ratings, but in the coming months we plan to
                    expand to positional, endgame, and even opening tests too, with a
                    separate rating for each category.
                </Typography>

                <Typography mt={2} component='div'>
                    More on that later! First here are the main issues that the Dojo
                    attempts to solve with the Dojo Tactics Tests:
                    <ol>
                        <li>
                            <strong>There’s always a solution.</strong> This seems
                            logical, but as most have probably experienced, tactics are
                            MUCH easier when you’re presented with a position and told
                            there’s an answer. They’re lobbed up right to you. But in an
                            actual game, it’s up to the player to figure out if there’s a
                            tactic or not and learn how to analyze and come to an
                            objective conclusion. Some lines work, some don’t. With the
                            Dojo Tactics Test, there won’t always be a flashy puzzle
                            answer, which means no more random guessing at the solution.
                        </li>
                        <li style={{ marginTop: '8px' }}>
                            <strong>You’re given the opponent’s response.</strong>{' '}
                            Learning to figure out how the opponent is going to respond to
                            your ideas is a key component of chess. In typical tactics
                            trainers, you’re incentivized to just play the “correct
                            looking move” without actually having to calculate (or
                            visualize) all of the possible consequences. This can lead to
                            bad habits (playing too quickly, missing the opponent’s
                            resources), poor visualization, and can even stagnate one’s
                            chess. In Dojo Tactics Tests, you need to input the moves for
                            yourself and for the opponent; full credit requires noticing
                            and including any important resources for the other side.
                        </li>
                        <li style={{ marginTop: '8px' }}>
                            <strong>You’re not tested on critical defenses.</strong> For
                            most puzzle trainers, there has to be “one” solution, and this
                            prevents the machine from showing the most principled
                            defenses, as there might be more than one move that wins
                            against them. With the Dojo Tactics Tests, alternates are
                            scored, and the student is asked to find all the key defenses
                            themselves.
                        </li>
                    </ol>
                </Typography>

                <Typography mt={2}>
                    In our tests, students will be asked to input their own analysis of
                    each problem, which will then be graded against the full solution. All
                    of the puzzles have been hand-picked by a Sensei and have
                    lightly-annotated solutions.
                </Typography>

                <Typography mt={3} variant='h5'>
                    How the Tests Work
                </Typography>
                <Typography mt={1} mb={1} component='div'>
                    The tests are fairly straightforward:
                    <ul>
                        <li>You’re given 1 hour to solve between 6-10 positions.</li>
                        <li>Every problem was hand-picked by a human.</li>
                        <li>
                            For each problem, it’ll be up to you to input your solution on
                            the board, as well as any opponent’s defenses, and the
                            response to each defense.
                        </li>
                        <li>
                            The problems are scored based on how many correct moves the
                            student finds.
                        </li>
                        <li>
                            All of the problems have annotated solutions, indicating which
                            moves are scored and which aren’t.
                        </li>
                        <li>
                            Only the first moves you input for the solving side count, so
                            players can’t just guess multiple answers and hope one of them
                            is right.
                        </li>
                        <li>
                            Players are incentivized to be thorough in their analysis and
                            make sure not to miss any key defense.
                        </li>
                        <li>
                            Puzzles also give full credit for alternates (sometimes two or
                            more moves win, that’s very common in chess!) and partial
                            credit for partial solutions.
                        </li>
                        <li>
                            Not every puzzle will have a “tactical” answer. This is
                            intentional, to discourage guessing. If you don’t see a clear
                            solution, just input a move that you would play!
                        </li>
                    </ul>
                    It’s now probably best to demonstrate with an example:
                </Typography>

                <Image
                    src={sampleProblemImage}
                    alt='Image of sample problem'
                    style={{ width: '100%', height: 'auto' }}
                />

                <Typography mt={1.5}>
                    This is a sample puzzle you might be presented with for the 1500-2000
                    level. It’s Black to play. You can either spend a few minutes and
                    write down your solution to see how you’d be graded, or if you’d like
                    to try the sample for yourself on the board, you can do so{' '}
                    <Link href='https://www.chessdojo.club/tactics'>here</Link>. Remember:
                    if there are multiple defenses, you must include all key variations!
                </Typography>

                <Typography mt={2} variant='h6'>
                    Solution
                </Typography>
                <Typography mt={1}>
                    <strong>1...Nxg4! 2.Nxg4</strong> (
                    <em>2.Qxg4 Rxe5-+ Black has won a healthy pawn.</em>){' '}
                    <strong>2…Bd6! 3.Qf3 Rg5 4.h3 f5-+</strong> Winning the piece back
                    with interest.
                </Typography>
                <Typography mt={2}>
                    If you only put down “1…Nxg4”, you would get 1 point for that move. If
                    you put “1…Nxg4 2.Qxg4 Rxe5”, you’d earn 3 points for the puzzle. To
                    get full credit, you’d need to input all of the moves bolded above, as
                    well as the variation 2.Qxg4 Rxe5, which would be worth a total of 9
                    points. Since players are scored based on what lines they see, we hope
                    this new tool will push players to improve their analytical skills.
                    But there’s a second benefit to the tests as well...
                </Typography>

                <Typography mt={3} variant='h5'>
                    Scoring & Rating
                </Typography>
                <Typography mt={1}>
                    Players will be scored based on how many points they earn on their
                    completed test. The results of each test will also provide players
                    with a “skill rating,” where they are rated based on how well they do
                    compared to others. Our theory is that as more players take the tests,
                    it will give everyone who’s taken the test a more accurate
                    representation of their skill level compared to others.
                </Typography>
                <Typography mt={2}>
                    So for example, a player rated 2000 and higher should aim to score
                    close to 90-100% on a 1500-2000 test. An 1800 should aim for 50-75%,
                    and a 1500 should aim for 25-50%.
                </Typography>
                <Typography mt={2}>
                    We’ve launched a series of tactics tests aimed at the 1500-2000 level,
                    as well as the 2000+ level. As we get feedback on the tests overall,
                    we’ll roll out tests for players rated 1000-1500 and U1000 as well.
                </Typography>
                <Typography mt={2}>
                    As mentioned, we will eventually be making positional tests, endgame
                    tests, and even some opening tests (!) too. Ultimately these will fit
                    into one’s chess "profile" where you’ll be able to see all of your
                    ELOs and "skill ratings" at a glance.
                </Typography>
                <Typography mt={2}>
                    For me personally, I’ve long wanted to have a way to assess various
                    chess skills – tactical, positional, endgame, etc. We often talk about
                    our students or fellow players in terms of their strengths and
                    weaknesses, but we rarely have a way to actually quantify or measure
                    them. Moreover, it’s very hard to tell if one is improving – yes if
                    you gain 50 points in a tournament you can conclude that you’ve
                    improved, but these events are often few and far between. With these
                    tests, we will hopefully give players a clearer sense of what they
                    need to work on and whether they are improving!
                </Typography>
                <Typography mt={2}>
                    Currently free users can access the first of several tests that are
                    available for their rating range. Training Program members get access
                    to all tests.
                </Typography>
                <Typography mt={2}>
                    Time to{' '}
                    <Link href='https://www.chessdojo.club/tactics'>get solving</Link>!
                </Typography>
            </Stack>
        </Container>
    );
}
