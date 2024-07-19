import { RatingSystem } from '@/database/user';
import Image from 'next/image';
import { SiChessdotcom, SiLichess } from 'react-icons/si';
import { SlGraph } from 'react-icons/sl';

export const AcfIcon = () => (
    <Image
        src='https://raw.githubusercontent.com/jalpp/DojoIcons/c9970eecc0bb27b7a85182d73fbd322787920e79/newIcons/Screen%20Shot%202024-07-18%20at%209.37.44%20PM.png'
        alt=''
        width={40}
        height={40}
    />
);

export const CfcIcon = () => (
    <Image
        src='https://raw.githubusercontent.com/jalpp/DojoIcons/main/newIcons/Screen_Shot_2024-07-18_at_8.59.55_PM-removebg-preview.png'
        alt=''
        width={45}
        height={45}
    />
);

export const DwzIcon = () => (
    <Image
        src='https://raw.githubusercontent.com/jalpp/DojoIcons/4e2551463c660c15d3623f82ee4075a17acf6b4f/newIcons/Screen_Shot_2024-07-18_at_9.34.32_PM-removebg-preview.png'
        alt=''
        width={40}
        height={40}
    />
);

export const EcfIcon = () => (
    <Image
        src='https://raw.githubusercontent.com/jalpp/DojoIcons/4e2551463c660c15d3623f82ee4075a17acf6b4f/newIcons/ecf.jpeg'
        alt=''
        width={40}
        height={40}
    />
);

export const FideIcon = () => (
    <Image
        src='https://raw.githubusercontent.com/jalpp/DojoIcons/main/newIcons/Fidelogo.svg.png'
        alt=''
        width={40}
        height={30}
    />
);

export const UscfIcon = () => (
    <Image
        src='https://raw.githubusercontent.com/jalpp/DojoIcons/main/newIcons/uscf-removebg-preview(1).png'
        alt=''
        width={45}
        height={45}
    />
);

export const KnsbIcon = () => (
    <Image
        src='https://raw.githubusercontent.com/jalpp/DojoIcons/7ea7378b821e00cac0bb17d073c2ae1eaf6cf5a1/newIcons/Screen%20Shot%202024-07-18%20at%209.46.50%20PM.png'
        alt=''
        width={40}
        height={40}
    />
);

export const RatingSystemIcon = ({ system }: { system: RatingSystem }) => {
    switch (system) {
        case RatingSystem.Lichess:
            return <SiLichess size={30} />;
        case RatingSystem.Chesscom:
            return <SiChessdotcom size={30} style={{ color: '#81b64c' }} />;
        case RatingSystem.Fide:
            return <FideIcon />;
        case RatingSystem.Uscf:
            return <UscfIcon />;
        case RatingSystem.Cfc:
            return <CfcIcon />;
        case RatingSystem.Dwz:
            return <DwzIcon />;
        case RatingSystem.Acf:
            return <AcfIcon />;
        case RatingSystem.Ecf:
            return <EcfIcon />;
        case RatingSystem.Knsb:
            return <KnsbIcon />;
        case RatingSystem.Custom:
            return <SlGraph size={30} />;
    }
};
