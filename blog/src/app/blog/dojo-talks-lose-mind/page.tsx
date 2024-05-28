import { Container, Link, Stack, Typography } from '@mui/material';
import { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
    title: 'Do World Champions Lose Their Minds? | Dojo Talks',
    description:
        'GM Jesse Kraai, IM Kostya Kavutskiy, and IM David Pruess talk about the impact of the FIDE World Chess Championship circuit on mental health and the sanity of those who endure it.',
};

export default function LoseMind() {
    return (
        <Container maxWidth='sm' sx={{ py: 5 }}>
            <Stack sx={{ mb: 3 }}>
                <Typography variant='h4'>
                    Do World Champions Lose Their Minds? | Dojo Talks
                </Typography>
                <Typography variant='h6' color='text.secondary'>
                    Jesse, Kostya, & David • May 17, 2024
                </Typography>
            </Stack>

            <Stack mt={3}>
                <Typography mb={2}>
                    On today's episode of Dojo Talks, the ChessDojo podcast, GM Jesse Kraai, IM Kostya Kavutskiy, and IM David Pruess talk about the impact of the FIDE World Chess Championship circuit on mental health and the sanity of those who endure it.
                </Typography>

                <iframe
                    width='100%'
                    style={{ aspectRatio: '16 / 9' }}
                    src='https://www.youtube.com/embed/bbbyCgMo3jY?si=MUc1biJLPSpUoCCq'
                    title='YouTube video player'
                    frameBorder='0'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen'
                    referrerPolicy='strict-origin-when-cross-origin'
                    allowFullScreen
                ></iframe>
                <Stack mt={3}>
                    <Typography variant='h5'>
                        Summary of episode
                    </Typography>
                </Stack>

                <Typography mt={2} variant='h6'>
                    🧠 Psychological Toll of Championships
                </Typography>
                <br>
                </br>
                <Typography>
                    <li>
                        <EmphasizeText>
                            Historical Insight:
                        </EmphasizeText> World championship matches, historically, have been physically and mentally taxing. Early champions like Zukertort and McDonnell nearly died from the stress.
                    </li>
                    <br></br>
                    <li>
                        <EmphasizeText>Modern Perspective:</EmphasizeText> Current champions like Ding Liren might be mentally impacted by the pressures of such events, with Magnus Carlsen describing the experience as incredibly taxing.
                    </li>
                </Typography>

                <Typography mt={2} variant='h6'>
                    🌍 Public Behavior of Champions

                </Typography>
                <br>
                </br>
                <Typography>
                    <li>
                        <EmphasizeText>Spectacular Public Rants:</EmphasizeText> Champions often make public rants post-victory, which can appear problematic. This is hypothesized to stem from the intense stress and scrutiny they face.

                    </li>
                    <br></br>
                    <li>
                        <EmphasizeText>Unique Personalities: </EmphasizeText> Those who reach the pinnacle of chess might inherently possess unique traits that predispose them to such behaviors.
                    </li>
                </Typography>

                <Typography mt={2} variant='h6'>
                    🚩 Reasons for Potential Madness

                </Typography>
                <br>
                </br>
                <Typography>
                    <li>
                        <EmphasizeText>Physical and Mental Strain:</EmphasizeText> The championship match itself is an arduous event that can leave lasting impacts.
                    </li>
                    <br></br>
                    <li>
                        <EmphasizeText>Public Expectations and Pressure: </EmphasizeText> Once at the top, any public appearance can risk diminishing their hard-earned respect.
                    </li>
                    <br></br>
                    <li>
                        <EmphasizeText>Psychological Factors:  </EmphasizeText> The journey to the top involves significant sacrifices and intense focus, which can impact mental health.
                    </li>
                </Typography>

                <Typography mt={2} variant='h6'>
                    💔 Champions' Mental Struggles


                </Typography>
                <br>
                </br>
                <Typography>
                    <li>
                        <EmphasizeText>Historical Cases: </EmphasizeText> Champions like Morphy, Alekhine, and Fischer have faced mental health challenges. Some modern players, like Kramnik and Ding Liren, show signs of mental strain.

                    </li>
                    <br></br>
                    <li>
                        <EmphasizeText>Casualties of the Game:</EmphasizeText>  The toll taken by the pressure and scrutiny of being a world champion has been likened to a 'death sport'.

                    </li>

                </Typography>

                <Typography mt={2} variant='h6'>
                    🔄 Modern Insights and Personal Theories


                </Typography>
                <br>
                </br>
                <Typography>
                    <li>
                        <EmphasizeText>Carlsen's Perspective:</EmphasizeText>  Magnus Carlsen has opted out of certain matches, suggesting the strain is too great.

                    </li>
                    <br></br>
                    <li>
                        <EmphasizeText>Diverse Reactions: </EmphasizeText>  Not all champions react the same way; some handle the pressure better than others.

                    </li>

                </Typography>

                <Typography mt={2} variant='h6'>
                    🔄 Soviet vs. Modern Champions


                </Typography>
                <br>
                </br>
                <Typography>
                    <li>
                        <EmphasizeText>Soviet Era: </EmphasizeText>  Soviet champions rarely displayed signs of mental strain publicly, possibly due to the controlled environment and lack of encouragement to express personal opinions.


                    </li>
                    <br></br>
                    <li>
                        <EmphasizeText>Post-Perestroika Era: </EmphasizeText> With more freedom, champions like Kasparov began expressing their thoughts more freely, leading to more public scrutiny and perceived mental strain.


                    </li>

                </Typography>

            </Stack>
        </Container>
    );
}

function EmphasizeText({ children }: { children: ReactNode }) {
    return (
        <Typography component='span' color='orange' fontWeight='bold'>
            {children}
        </Typography>
    );
}
