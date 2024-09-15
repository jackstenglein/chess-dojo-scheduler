import AnalysisTab from '@/stockfish/view/AnalysisTab';
import { CardContent } from '@mui/material';

export const EngineView = () => {
    return (
        <CardContent sx={{ height: 1 }}>
            <AnalysisTab role='tabpanel' />
        </CardContent>
    );
};
