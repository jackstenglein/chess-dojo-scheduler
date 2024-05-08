import React from 'react';
import { AdsClick, SvgIconComponent } from '@mui/icons-material'; // Import SvgIconComponent from Material-UI
import WavingHand from '@mui/icons-material/WavingHand';
import Biotech from '@mui/icons-material/Biotech';
import CrisisAlert from '@mui/icons-material/CrisisAlert';
import SportsScore from '@mui/icons-material/SportsScore';
import Style from '@mui/icons-material/Style';
import Extension from '@mui/icons-material/Extension';
import Sports from '@mui/icons-material/Sports';
import { Speed } from '@mui/icons-material';
import { LiveTv } from '@mui/icons-material';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
interface IconProps {
    iconName: string;
   
}

const IconComponent: React.FC<IconProps> = ({ iconName}) => {
    let Icon: SvgIconComponent | null = null;

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
        // Add more cases for other icons as needed
        default:
            Icon = LiveTv;
            // If the provided iconName does not match any known icons, return null
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

