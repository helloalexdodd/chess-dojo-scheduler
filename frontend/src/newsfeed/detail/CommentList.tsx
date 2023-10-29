import { Link, Paper, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

import { Comment } from '../../database/game';
import Avatar from '../../profile/Avatar';

interface CommentListProps {
    comments: Comment[] | null;
    maxComments?: number;
    viewCommentsLink?: string;
}

const CommentList: React.FC<CommentListProps> = ({
    comments,
    maxComments,
    viewCommentsLink,
}) => {
    if (!comments) {
        return null;
    }

    const displayComments = maxComments
        ? comments.slice(Math.max(0, comments.length - maxComments))
        : comments;

    const hiddenComments = comments.length - displayComments.length;

    return (
        <Stack spacing={2} width={1} alignItems='start' mb={2}>
            {hiddenComments > 0 && viewCommentsLink && (
                <Link component={RouterLink} to={viewCommentsLink} sx={{ pl: '52px' }}>
                    View {hiddenComments} earlier comment{hiddenComments !== 1 ? 's' : ''}
                </Link>
            )}

            {displayComments.map((comment) => (
                <CommentListItem key={comment.id} comment={comment} />
            ))}
        </Stack>
    );
};

interface CommentListItemProps {
    comment: Comment;
}

const CommentListItem: React.FC<CommentListItemProps> = ({ comment }) => {
    const createdAt = new Date(comment.createdAt);

    return (
        <Stack direction='row' spacing={1.5}>
            <Avatar
                username={comment.owner}
                displayName={comment.ownerDisplayName}
                size={40}
            />

            <Stack>
                <Paper elevation={2} sx={{ px: '12px', py: '8px', borderRadius: '6px' }}>
                    <Stack>
                        <Link component={RouterLink} to={`/profile/${comment.owner}`}>
                            <Typography variant='subtitle1' color='text.secondary'>
                                {comment.ownerDisplayName} ({comment.ownerCohort})
                            </Typography>
                        </Link>

                        <Typography sx={{ whiteSpace: 'pre-line' }}>
                            {comment.content}
                        </Typography>
                    </Stack>
                </Paper>
                <Typography variant='caption' color='text.secondary'>
                    {createdAt.toLocaleDateString()} • {createdAt.toLocaleTimeString()}
                </Typography>
            </Stack>
        </Stack>
    );
};

export default CommentList;