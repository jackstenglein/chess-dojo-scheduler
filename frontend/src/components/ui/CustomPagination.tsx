import { useFreeTier } from '@/auth/Auth';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { GridPagination } from '@mui/x-data-grid-pro';

interface CustomPaginationProps {
    page: number;
    pageSize: number;
    count: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
}

export const CustomPagination: React.FC<CustomPaginationProps> = ({
    page,
    pageSize,
    count,
    hasMore,
    onPrevPage,
    onNextPage,
}) => {
    const isFreeTier = useFreeTier();

    return (
        <GridPagination
            labelDisplayedRows={({ from, to, count }) => {
                return `${from}–${to} of ${count}${hasMore ? '+' : ''}`;
            }}
            slots={{
                actions: {
                    previousButton: () => {
                        return (
                            <IconButton
                                aria-label='Go to previous page'
                                title='Go to previous page'
                                onClick={onPrevPage}
                                disabled={page === 0}
                            >
                                <KeyboardArrowLeft />
                            </IconButton>
                        );
                    },
                    nextButton: () => {
                        return (
                            <Tooltip
                                title={
                                    isFreeTier
                                        ? 'Free-tier users can only access the first page of results'
                                        : ''
                                }
                            >
                                <span>
                                    <IconButton
                                        aria-label='Go to next page'
                                        title='Go to next page'
                                        onClick={onNextPage}
                                        disabled={
                                            isFreeTier ||
                                            ((page + 1) * pageSize >= count && !hasMore)
                                        }
                                    >
                                        <KeyboardArrowRight />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        );
                    },
                },
            }}
        />
    );
};
