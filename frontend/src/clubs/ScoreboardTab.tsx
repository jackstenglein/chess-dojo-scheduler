import { useAuth } from '../auth/Auth';
import { ScoreboardSummary } from '../database/scoreboard';
import Scoreboard from '../scoreboard/Scoreboard';

interface ScoreboardTabProps {
    data?: ScoreboardSummary[];
}

const ScoreboardTab: React.FC<ScoreboardTabProps> = ({ data }) => {
    const user = useAuth().user;

    return <Scoreboard user={user} rows={data || []} loading={false} />;
};

export default ScoreboardTab;
