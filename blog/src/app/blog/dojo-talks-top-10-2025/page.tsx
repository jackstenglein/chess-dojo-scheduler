import { height, width } from '@fortawesome/free-brands-svg-icons/fa42Group';
import { AspectRatio, BorderAllRounded, Margin, Padding } from '@mui/icons-material';
import { Container, Link, Stack, Typography } from '@mui/material';
import { Metadata } from 'next';
import { ReactNode } from 'react';





const styles = {
    video: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '600px',
        aspectRatio: '16 / 9',
    },
    outerContainer: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: '0px solid black', // Optional: just for visualization
    },
    bolditem: {
        color: '#870a0c',
        fontWeight: 800,
    },
    container: {
        display: 'flex',
        justifyContent: 'center', // Aligns items horizontally (center, flex-start, flex-end, space-between, space-around)
        alignItems: 'center', // Aligns items vertically (center, flex-start, flex-end, stretch, baseline)
        Margin: 'auto',
        gap: '20px',
        border: '0px solid black', // Optional: just for visualization
    },
    socials: {
        width: '50px',
        height: '50px',
        aspectRatio: '1 / 1',
        border: '1px solid grey', // Optional: just for visualization,
        borderRadius: '10px',
    },
    flexcontainerfoot: {
        display: 'flex',
        justifyContent: 'center', // Aligns items horizontally (center, flex-start, flex-end, space-between, space-around)
        alignItems: 'center', // Aligns items vertically (center, flex-start, flex-end, stretch, baseline)
        Margin: 'auto',
        gap: '30px',
        border: '0px solid black', // Optional: just for visualization

    }
}



export const metadata: Metadata = {
    title: 'Who Will Be Top 10 in 2025? | Dojo Talks',
    description: "GM Jesse Kraai, IM David Pruess, and IM Kostya Kavutskiy forecast who will be the top 10 FIDE rated chess players in June 2025 in today's episode of Dojo Talks, the ChessDojo podcast."
};

const App: React.FC = () => {
    return (
        <Container maxWidth="sm">
            <div>
                <h1>Who Will Be Top 10 in 2025? <br></br> Dojo Talks</h1>
                <h3><span style={{ fontWeight: 500 }}>Jesse, Kostya, & David • June 5, 2024</span></h3>
                <hr style={{ height: '2px', backgroundColor: '#F4931E' }} />
                <p>
                    GM Jesse Kraai, IM David Pruess, and IM Kostya Kavutskiy forecast who will be the top 10 FIDE rated chess players in June 2025 in today's episode of Dojo Talks, the ChessDojo podcast.
                </p>

                <div style={styles.outerContainer}>
                    <iframe
                        style={styles.video}
                        src="https://www.youtube.com/watch?v=pJksjHfzo7Q"
                        title="YouTube video player"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                    />
                </div>


                <h3>Summary of episode</h3>

                <h4>Introduction - 00:04 to 00:46</h4>

                <p>Kostya introduces the episode's topic: Predicting the top 10 chess players for June 2025.</p>

                <h4>Update on Junior Draft Standings - 00:46 to 03:33</h4>

                <p>Discussion on the <a href='https://youtu.be/8BnPNbpE1Qc?si=GfIt2hTyDLIeZy6u' target='_blank'>Junior Draft</a> from October 2023 and how those players are performing.</p>

                <h4>Recent Changes in Top 10 - 03:33 to 06:17

                </h4>

                <p>New players entering the top 10, particularly Juniors like Arjun and Nodirbek.
                </p>

                <h4>Juniors' Performance Overview - 06:17 to 08:52

                </h4>

                <p>Analysis of drafted juniors' performance over the past year.
                </p>

                <h4>Top 10 Players (Current) - 10:04 to 12:43

                </h4>

                <p>Listing and discussion of the current top 10 players as of June 2024.
                </p>

                <h4>Comparison to Last Year's Top 10 - 11:47 to 15:28

                </h4>

                <p>Comparing the current top 10 to the list from June 2023 and discussing notable changes.
                </p>

                <h4>Individual Predictions for Top 10 in 2025 - 13:50 to 55:28

                </h4>

                <p>Jesse, David, and Kostya share and debate their predictions for the top 10 chess players in June 2025.</p>


                <h4>Average Rankings - 55:28 to 58:03</h4>

                <p>Combining individual rankings to create an average top 10 list.</p>

                <h4>Final Thoughts - 58:03 to 1:02:35</h4>

                <p>Jesse, Kostya, and David discuss possible changes to the FIDE rating system.</p>


                <br />
                <hr style={{ height: '2px', backgroundColor: '#F4931E' }} />
                <h4 style={{ textAlign: 'center', display: 'block' }}>Make sure to follow the DojoTalks podcast</h4>
                <div style={styles.container}>
                    <a href="https://www.youtube.com/chessdojo" target="_blank" rel="noopener noreferrer">
                        <img style={styles.socials} alt="Image of YouTube" src="https://th.bing.com/th/id/R.aa96dba2d64d799f0d1c6a02e4acdebb?rik=c8ee4vAHUDLR6g&riu=http%3a%2f%2fwww.freeiconspng.com%2fuploads%2fyoutube-icon-21.png&ehk=OC7MLPky6SWdtoLCCQRd94v%2bJ5GAFSBXzcJ%2fu4zbhNE%3d&risl=&pid=ImgRaw&r=0" />
                    </a>
                    <a href="https://chessdojotalks.podbean.com/" target="_blank" rel="noopener noreferrer">
                        <img style={styles.socials} alt="Image of podbean" src="https://chess-dojo-images.s3.amazonaws.com/emails/podbean+logo.png" />
                    </a>
                </div>
                <br></br>

                <Container
                    style={{ width: '400px', backgroundColor: "#F4931E", padding: '20px', borderRadius: '20px' }}
                >
                    <button style={{ backgroundColor: 'transparent', border: '0' }}>
                        <div style={styles.flexcontainerfoot}>
                            <a
                                href="http://chessdojo.club"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <img
                                    style={{ width: '80px' }}
                                    src="https://chess-dojo-images.s3.amazonaws.com/BlackLogoText%403x.png"
                                    className="logo"
                                />
                            </a>
                            <h3 style={{ textAlign: 'center', display: 'block' }}>
                                <a
                                    href="http://chessdojo.club"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ textDecoration: 'none', color: 'black' }}
                                >
                                    Check Out ChessDojo.Club To Improve Your Chess
                                </a>
                            </h3>
                        </div>
                    </button>
                </Container>
                <br></br><br></br>

            </div>



        </Container >
    );
};

export default App;
