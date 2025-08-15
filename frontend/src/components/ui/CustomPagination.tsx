import { useFreeTier } from '@/auth/Auth';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';
import { TablePagination } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { PaginationPropsOverrides } from '@mui/x-data-grid-pro';

interface CustomPaginationProps {
    page: number;
    pageSize: number;
    setPageSize: (size: number) => void;
    count: number;
    hasMore: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    limitFreeTier?: boolean;
}

export const CustomPagination: React.FC<CustomPaginationProps & PaginationPropsOverrides> = ({
    page,
    pageSize,
    setPageSize,
    count,
    hasMore,
    onPrevPage,
    onNextPage,
    limitFreeTier,
    ...rest
}) => {
    const freeTierLimited = useFreeTier() && limitFreeTier;
    return (
        <TablePagination
            {...rest}
            component='div'
            count={count}
            page={page}
            onPageChange={() => null}
            onRowsPerPageChange={(e) => setPageSize(parseInt(e.target.value))}
            rowsPerPage={pageSize}
            labelDisplayedRows={({
                from,
                to,
                count,
            }: {
                from: number;
                to: number;
                count: number;
            }) => {
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
                                    freeTierLimited
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
                                            freeTierLimited ||
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
