import React from 'react';
import { RatingSystem } from "@/database/user";
import { SiLichess } from 'react-icons/si';
import { SlGraph } from "react-icons/sl";
import { SiChessdotcom } from 'react-icons/si';
import { FideIcon, KNSBIcon, UsaIcon, CfcIcon, DwzIcon, AfcIcon, EfcIcon } from './FedIcons';


interface StatIconProps {
    system: RatingSystem;
}

const StatsIcon: React.FC<StatIconProps> = ({ system }) => {
    const renderIcon = () => {
        switch (system) {
            case RatingSystem.Lichess:
                return <SiLichess style={{marginRight: 8, verticalAlign: "middle"}} size={30}/>;
            case RatingSystem.Chesscom:
                return <SiChessdotcom style={{marginRight: 8, verticalAlign: "middle", color: "green"}} size={30}/>;
            case RatingSystem.Fide:
                return <FideIcon />;
            case RatingSystem.Uscf:
                return <UsaIcon />; 
            case RatingSystem.Cfc:
                return <CfcIcon />
            case RatingSystem.Dwz:
                return <DwzIcon />;
            case RatingSystem.Acf:
                return <AfcIcon />;
            case RatingSystem.Ecf:
                return <EfcIcon />
            case RatingSystem.Knsb:
                return <KNSBIcon />
            case RatingSystem.Custom:
                return <SlGraph style={{marginRight: 8, verticalAlign: "middle"}} size={30}/>    


            default:
                return null;
        }
    };

    return renderIcon();
}

export default StatsIcon;

