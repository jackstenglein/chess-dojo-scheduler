import { InputAdornment, Stack, TextField, Typography } from '@mui/material';
import { UseEventEditorResponse } from '../useEventEditor';

export function PricingFormSection({
    editor,
    fullPriceOpts,
    currentPriceOpts,
}: {
    editor: UseEventEditorResponse;
    fullPriceOpts?: { helperText?: string };
    currentPriceOpts?: { helperText?: string };
}) {
    const percentOff = Math.round(
        ((parseFloat(editor.fullPrice) - parseFloat(editor.currentPrice)) /
            parseFloat(editor.fullPrice)) *
            100,
    );
    return (
        <Stack spacing={3} mt={2}>
            <TextField
                fullWidth
                placeholder='Full Price'
                variant='outlined'
                value={editor.fullPrice}
                onChange={(e) => editor.setFullPrice(e.target.value)}
                error={Boolean(editor.errors.fullPrice)}
                helperText={editor.errors.fullPrice || fullPriceOpts?.helperText}
                slotProps={{
                    input: {
                        startAdornment: <InputAdornment position='start'>$</InputAdornment>,
                    },
                }}
            />
            <TextField
                fullWidth
                placeholder='Sale Price'
                variant='outlined'
                value={editor.currentPrice}
                onChange={(e) => editor.setCurrentPrice(e.target.value)}
                error={Boolean(editor.errors.currentPrice)}
                helperText={
                    editor.errors.currentPrice ||
                    currentPriceOpts?.helperText ||
                    'If you want your coaching session to display as being on sale, enter a sale price and it will be shown as a discount off the full price. If left blank, students must pay the full price.'
                }
                slotProps={{
                    input: {
                        startAdornment: <InputAdornment position='start'>$</InputAdornment>,
                    },
                }}
            />

            {editor.fullPrice !== '' && editor.currentPrice !== '' && !isNaN(percentOff) && (
                <Typography>Percent Off: {percentOff}%</Typography>
            )}
        </Stack>
    );
}
