'use client';

import { createBlog } from '@/api/blogApi';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { MarkdownEditor } from '@/app/(blog)/blog/common/MarkdownEditor';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { Link } from '@/components/navigation/Link';
import { useRouter } from '@/hooks/useRouter';
import LoadingPage from '@/loading/LoadingPage';
import { Blog, BlogStatus, BlogStatuses } from '@jackstenglein/chess-dojo-common/src/blog/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
    Button,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';

export default function NewBlogPostPage() {
    const auth = useAuth();
    const router = useRouter();
    const request = useRequest<Blog>();

    const [slug, setSlug] = useState('');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [date, setDate] = useState<DateTime | null>(() => DateTime.now());
    const [status, setStatus] = useState<BlogStatus>(BlogStatuses.DRAFT);
    const [content, setContent] = useState('');

    useEffect(() => {
        if (auth.status !== AuthStatus.Loading && !auth.user?.isAdmin) {
            router.replace('/profile');
        }
    }, [auth.status, auth.user?.isAdmin, router]);

    const handleCreate = () => {
        if (!date?.isValid) return;
        request.onStart();
        createBlog({
            id: slug.trim(),
            title: title.trim(),
            subtitle: subtitle.trim(),
            date: date.toISODate() ?? '',
            content,
            status,
        })
            .then((resp) => request.onSuccess(resp.data))
            .catch((err) => request.onFailure(err));
    };

    if (auth.status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (!auth.user?.isAdmin) {
        return <LoadingPage />;
    }

    return (
        <Container sx={{ py: 5 }}>
            <Stack spacing={3}>
                <Stack direction='row' alignItems='center' gap={2}>
                    <Link href='/admin' sx={{ display: 'flex' }}>
                        <ArrowBackIcon />
                    </Link>
                    <Typography variant='h5'>New Blog Post</Typography>
                </Stack>

                <Typography color='text.secondary'>
                    Create a new blog post. Use the Write tab to enter markdown and the Preview tab
                    to see how it will look when published.
                </Typography>

                <TextField
                    label='URL slug'
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder='e.g. dojo-digest-27'
                    helperText='The page URL as a child of /blog/. For example, enter your-slug for the URL /blog/your-slug'
                    fullWidth
                    required
                />

                <TextField
                    label='Title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder='e.g. Dojo Digest 27'
                    fullWidth
                    required
                />

                <TextField
                    label='Subtitle'
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder='e.g. Dojo Digest 27'
                    fullWidth
                />

                <DatePicker label='Date' value={date} onChange={(newValue) => setDate(newValue)} />

                <FormControl fullWidth>
                    <InputLabel id='blog-status-label'>Status</InputLabel>
                    <Select
                        labelId='blog-status-label'
                        label='Status'
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <MenuItem value={BlogStatuses.DRAFT}>Draft</MenuItem>
                        <MenuItem value={BlogStatuses.PUBLISHED}>Published</MenuItem>
                    </Select>
                </FormControl>

                <MarkdownEditor
                    value={content}
                    onChange={setContent}
                    placeholder='Write your blog post in markdown...'
                    minHeight={400}
                    title={title}
                    subtitle={subtitle}
                />

                <Stack direction='row' gap={2} justifyContent='flex-end'>
                    <Button component={Link} href='/admin' variant='outlined'>
                        Cancel
                    </Button>
                    <Button
                        variant='contained'
                        onClick={handleCreate}
                        disabled={!slug.trim() || !title.trim() || !date?.isValid}
                        loading={request.isLoading()}
                    >
                        Create post
                    </Button>
                </Stack>

                <RequestSnackbar
                    request={request}
                    showSuccess
                    defaultSuccessMessage='Blog post created'
                />
            </Stack>
        </Container>
    );
}
