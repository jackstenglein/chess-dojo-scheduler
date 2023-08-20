import { Card, CardContent, Link } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { Chapter, Course } from '../../database/opening';

interface ChapterContentsProps {
    chapter: Chapter;
    index: number;
}

const ChapterContents: React.FC<ChapterContentsProps> = ({ chapter, index }) => {
    return (
        <ol>
            {chapter.modules.map((m, idx) => (
                <Link
                    key={m.name}
                    component={RouterLink}
                    to={`?chapter=${index}&module=${idx}`}
                >
                    <li>{m.name}</li>
                </Link>
            ))}
        </ol>
    );
};

interface ContentsProps {
    course: Course;
}

const Contents: React.FC<ContentsProps> = ({ course }) => {
    return (
        <Card variant='outlined'>
            <CardContent>
                {course.chapters.length > 1 && (
                    <ol style={{ paddingLeft: '16px' }}>
                        {course.chapters.map((c, idx) => (
                            <li key={idx}>
                                {c.name}
                                <ChapterContents chapter={c} index={idx} />
                            </li>
                        ))}
                    </ol>
                )}

                {course.chapters.length === 1 && (
                    <ChapterContents chapter={course.chapters[0]} index={0} />
                )}
            </CardContent>
        </Card>
    );
};

export default Contents;
