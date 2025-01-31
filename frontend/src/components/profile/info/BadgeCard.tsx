import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, Tooltip, Card, CardContent, CardHeader, Stack } from '@mui/material';
import Image from 'next/image';
import { Link } from '@/components/navigation/Link';
import { User, compareCohorts } from '@/database/user';
import CohortIcon from '@/scoreboard/CohortIcon';
import postmortem2023 from './2023-postmortem.png';
import postmortem2024 from './2024-postmortem.png';
import { BADGE_ELIGIBLE_LIMIT_GAMES, getAnonGameBadge, getClaGameBadge, getPolgarBadge, getRRbadge, getStreakBadge, POLGAR_BADGES, ROUND_ROBIN_BADGES, STREAKS_BADGES } from './BadgeHandler';

export const BadgeCard = ({ user }: { user: User }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<{ image: string; title: string } | null>(null);

  const handleBadgeClick = (badge: { image: string; title: string }) => {
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

  const badgeData = [
    ...BADGE_ELIGIBLE_LIMIT_GAMES.map((badge) => ({
      image: getAnonGameBadge(badge),
      title: `Anontated Games ${badge}`,
    })),
    ...BADGE_ELIGIBLE_LIMIT_GAMES.map((badge) => ({
      image: getClaGameBadge(badge),
      title: `Played ${badge} Classical Games`,
    })),
    ...STREAKS_BADGES.map((badge) => ({
      image: getStreakBadge(badge),
      title: `${badge} Streak`,
    })),
    ...POLGAR_BADGES.map((badge) => ({
      image: getPolgarBadge(badge),
      title: `Polgar Mate of ${badge}`,
    })),
    ...ROUND_ROBIN_BADGES.map((badge) => ({
      image: getRRbadge(badge),
      title: `Round robin ${badge} Winner`,
    })),
  ];

  badges.push(
    ...badgeData.map((badge, index) => (
      <Tooltip key={index} title={badge.title}>
        <img
          src={badge.image}
          style={{ height: '50px', width: '50px', cursor: 'pointer' }}
          alt={badge.title}
          onClick={() => handleBadgeClick(badge)}
        />
      </Tooltip>
    ))
  );

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
            <DialogTitle>{selectedBadge.title}</DialogTitle>
            <DialogContent>
              <img src={selectedBadge.image} alt={selectedBadge.title} style={{ maxWidth: '100%' }} />
            </DialogContent>
          </>
        )}
      </Dialog>
    </>
  );
};
