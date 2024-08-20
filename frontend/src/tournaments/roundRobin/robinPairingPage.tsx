// import {
//     Box,
//     Container,
//     FormControl,
//     InputLabel,
//     MenuItem,
//     Select,
//     Table,
//     TableBody,
//     TableCell,
//     TableContainer,
//     TableHead,
//     TableRow,
// } from '@mui/material';
// import React, { useState } from 'react';

// interface Pairing {
//     round: number;
//     player1: string;
//     player2: string;
// }

// export const cohorts = [
//     { label: '0-300', value: 0 },
//     { label: '300-400', value: 300 },
//     { label: '400-500', value: 400 },
//     { label: '500-600', value: 500 },
//     { label: '600-700', value: 600 },
//     { label: '700-800', value: 700 },
//     { label: '800-900', value: 800 },
//     { label: '900-1000', value: 900 },
//     { label: '1000-1100', value: 1000 },
//     { label: '1100-1200', value: 1100 },
//     { label: '1200-1300', value: 1200 },
//     { label: '1300-1400', value: 1300 },
//     { label: '1400-1500', value: 1400 },
//     { label: '1500-1600', value: 1500 },
//     { label: '1600-1700', value: 1600 },
//     { label: '1700-1800', value: 1700 },
//     { label: '1800-1900', value: 1800 },
//     { label: '1900-2000', value: 1900 },
//     { label: '2000-2100', value: 2000 },
//     { label: '2100-2200', value: 2100 },
//     { label: '2200-2300', value: 2200 },
//     { label: '2300-2400', value: 2300 },
//     { label: '2400+', value: 2400 },
// ];

// const generateRandomPairings = (): Pairing[] => {
//     const players = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank'];
//     const pairings: Pairing[] = [];

//     for (let i = 1; i <= 9; i++) {
//         // Extended rounds to 9
//         const shuffledPlayers = players.sort(() => 0.5 - Math.random());
//         for (let j = 0; j < shuffledPlayers.length; j += 2) {
//             pairings.push({
//                 round: i,
//                 player1: shuffledPlayers[j],
//                 player2: shuffledPlayers[j + 1],
//             });
//         }
//     }

//     return pairings;
// };

// const PairingsPage: React.FC = () => {
//     const [selectedCohort, setSelectedCohort] = useState<number>(0);
//     const [selectedRound, setSelectedRound] = useState<number>(1);

//     const handleCohortChange = (event: React.ChangeEvent<{ value: unknown }>) => {
//         setSelectedCohort(event.target.value as number);
//     };

//     const handleRoundChange = (event: React.ChangeEvent<{ value: unknown }>) => {
//         setSelectedRound(event.target.value as number);
//     };

//     const pairings = generateRandomPairings();

//     return (
//         <Container maxWidth='xl' sx={{ py: 5 }}>
//             <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
//                 <FormControl fullWidth>
//                     <InputLabel id='cohort-selector-label'>Select Cohort</InputLabel>
//                     <Select
//                         labelId='cohort-selector-label'
//                         value={selectedCohort}
//                         onChange={handleCohortChange}
//                         label='Select Cohort'
//                     >
//                         {cohorts.map((cohort) => (
//                             <MenuItem key={cohort.value} value={cohort.value}>
//                                 {cohort.label}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                 </FormControl>

//                 <FormControl fullWidth>
//                     <InputLabel id='round-selector-label'>Select Round</InputLabel>
//                     <Select
//                         labelId='round-selector-label'
//                         value={selectedRound}
//                         onChange={handleRoundChange}
//                         label='Select Round'
//                     >
//                         {[...Array(9).keys()].map((round) => (
//                             <MenuItem key={round + 1} value={round + 1}>
//                                 Round {round + 1}
//                             </MenuItem>
//                         ))}
//                     </Select>
//                 </FormControl>
//             </Box>

//             <TableContainer>
//                 <Table>
//                     <TableHead>
//                         <TableRow>
//                             <TableCell>Round</TableCell>
//                             <TableCell>Player 1</TableCell>
//                             <TableCell>Player 2</TableCell>
//                         </TableRow>
//                     </TableHead>
//                     <TableBody>
//                         {pairings
//                             .filter((pairing) => pairing.round === selectedRound) // Filter by selected round
//                             .map((pairing, index) => (
//                                 <TableRow key={index}>
//                                     <TableCell>{pairing.round}</TableCell>
//                                     <TableCell>{pairing.player1}</TableCell>
//                                     <TableCell>{pairing.player2}</TableCell>
//                                 </TableRow>
//                             ))}
//                     </TableBody>
//                 </Table>
//             </TableContainer>
//         </Container>
//     );
// };

// export default PairingsPage;
