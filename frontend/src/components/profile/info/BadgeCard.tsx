import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Tooltip, Card, CardContent, CardHeader, Stack, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import Image from 'next/image';
import { Link } from '@/components/navigation/Link';
import { User, compareCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import postmortem2023 from './2023-postmortem.png';
import postmortem2024 from './2024-postmortem.png';
import { getEligibleBadges } from './BadgeHandler';

export const BadgeCard = ({ user }: { user: User }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<string[] | null>(null);
  const badgeImgs: string[][] = getEligibleBadges(user);
  console.log(badgeImgs);

  const handleBadgeClick = (badge: string[]) => {
    setSelectedBadge(badge);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedBadge(null);
  };

  const badges =
    user.graduationCohorts?.sort(compareCohorts)
      .filter((c, i) => user.graduationCohorts?.indexOf(c) === i)
      .map((c) => (
        <CohortIcon key={c} cohort={c} />
      )) ?? [];

  if (!user.createdAt || user.createdAt < '2024-12') {
    badges.push(
      <Link key='postmortem-2024' href={`/profile/${user.username}/postmortem/2024`}>
        <Tooltip title='View my 2024 postmortem!'>
          <Image src={postmortem2024} alt='2024 postmortem' width={40} height={40} />
        </Tooltip>
      </Link>
    );
  }

  if (!user.createdAt || user.createdAt < '2023-12') {
    badges.push(
      <Link key='postmortem-2023' href={`/profile/${user.username}/postmortem/2023`}>
        <Tooltip title='View my 2023 postmortem!'>
          <Image src={postmortem2023} alt='2023 postmortem' width={70} height={70} />
        </Tooltip>
      </Link>
    );
  }

  if (badgeImgs.length !== 0) {
    for (let i = 0; i < badgeImgs.length; i++) {
      badges.push(
        <Tooltip title={badgeImgs[i][1]}>
          <img
            src={badgeImgs[i][0]}
            style={{ height: '50px', width: '50px', cursor: 'pointer' }}
            alt={badgeImgs[i][1]}
            onClick={() => handleBadgeClick(badgeImgs[i])}
          />
        </Tooltip>
      );
    }
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader title='Badges' />
        <CardContent sx={{ pt: 0 }}>
          <Stack direction='row' columnGap={0.75} flexWrap='wrap' rowGap={1}>
            {badges}
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        {selectedBadge && (
          <>
            <DialogTitle>
              {selectedBadge[1]}
              <IconButton
                aria-label="close"
                onClick={handleCloseDialog}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <img src={selectedBadge[0]} alt={selectedBadge[1]} style={{ maxWidth: '100%' }} />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};

