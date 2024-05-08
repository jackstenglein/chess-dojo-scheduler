import React from 'react';
import {SvgIconComponent } from '@mui/icons-material'; 
import WavingHand from '@mui/icons-material/WavingHand';
import Biotech from '@mui/icons-material/Biotech';
import CrisisAlert from '@mui/icons-material/CrisisAlert';
import SportsScore from '@mui/icons-material/SportsScore';
import { Speed } from '@mui/icons-material';
import { LiveTv } from '@mui/icons-material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ThumbUp from '@mui/icons-material/ThumbUp';
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline';
import { BorderColor } from '@mui/icons-material';
import DensitySmallIcon from '@mui/icons-material/DensitySmall';
import { useAuth } from '../../auth/Auth';
import { useClubs } from '../../api/cache/clubs';
import Groups from '@mui/icons-material/Groups';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import Group from '@mui/icons-material/Group';


interface IconProps {
    iconName: string;

}




const IconComponent: React.FC<IconProps> = ({ iconName}) => {
    let Icon: SvgIconComponent | null = null;
    // possible way to add Club Icon for club icon label
    // const user = useAuth().user!;
    // const { clubs } = useClubs(user.clubs || []);
    // const clubNamesMap = clubs.reduce(
    //     (map, club) => {
    //         map[club.id] = club.name;
    //         return map;
    //     },
    //     {} as Record<string, string>,
    // );

    // const clubNameExists = (name: string) => name in clubNamesMap;

    // if(clubNameExists(iconName)){
    //    Icon = Groups;
    // }

    switch (iconName) {
        case 'Welcome to the Dojo':
            Icon = WavingHand;
            break;
        case 'Games + Analysis':
            Icon = Biotech;
            break;
        case 'Tactics':
            Icon = Speed;
            break;
        case 'Middlegames + Strategy':
            Icon = MenuBookIcon;
            break;
        case 'Endgame':
            Icon = SportsScore;
            break;
        case 'Opening':
            Icon = CrisisAlert;
            break;
        case "Non-Dojo":
            Icon = LiveTv;
            break;
        case "Annotations":
            Icon = BorderColor;
            break;    
        case "All Categories":
            Icon = DensitySmallIcon
            break;
        case "Followers":
            Icon = ThumbUpIcon
            break; 
        case "My Cohort":
            Icon = Group;
            break;               
        default:
            Icon = null; 
            break;
    }

    return Icon ? <Icon sx={{
        marginRight: '0.6em',
        verticalAlign: 'middle',
    }}
    
    color='primary'

    /> : null;
};

export default IconComponent;

