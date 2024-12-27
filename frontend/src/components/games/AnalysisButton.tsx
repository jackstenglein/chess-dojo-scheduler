import { RequirementCategory } from '@/database/requirement';
import Icon from '@/style/Icon';
import { Button } from '@mui/material';
import Link from 'next/link';

export default function AnalysisButton() {
    return (
        <Button
            data-cy='import-game-button'
            id='import-game-button'
            variant='contained'
            component={Link}
            href='/games/import'
            color='success'
            startIcon={
                <Icon
                    name={RequirementCategory.Games}
                    color='inherit'
                    sx={{ marginRight: '0.3rem' }}
                />
            }
        >
            Game Analysis
        </Button>
    );
}
