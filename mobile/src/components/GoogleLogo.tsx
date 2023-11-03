import Svg, { Defs, G, Use, Path } from 'react-native-svg';

const GoogleLogo = (props: any) => (
    <Svg xmlns='http://www.w3.org/2000/svg' width={46} height={46} {...props}>
        <Defs></Defs>
        <G fill='none'>
            <G filter='url(#a)' transform='translate(3 3)'>
                <Use href='#1' fill='#4285F4' />
                <Use href='#2' />
                <Use href='#3' />
                <Use href='#4' />
            </G>
            <G transform='translate(-1 -1)'>
                <Use href='#5' fill='#FFF' />
                <Use href='#6' />
                <Use href='#7' />
                <Use href='#8' />
            </G>
            <Path
                fill='#4285F4'
                d='M31.64 23.205c0-.639-.057-1.252-.164-1.841H23v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z'
            />
            <Path
                fill='#34A853'
                d='M23 32c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711h-3.007v2.332A8.997 8.997 0 0 0 23 32Z'
            />
            <Path
                fill='#FBBC05'
                d='M17.964 24.71a5.41 5.41 0 0 1-.282-1.71c0-.593.102-1.17.282-1.71v-2.332h-3.007A8.996 8.996 0 0 0 14 23c0 1.452.348 2.827.957 4.042l3.007-2.332Z'
            />
            <Path
                fill='#EA4335'
                d='M23 17.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C27.463 14.891 25.426 14 23 14a8.997 8.997 0 0 0-8.043 4.958l3.007 2.332c.708-2.127 2.692-3.71 5.036-3.71Z'
            />
            <Path d='M14 14h18v18H14V14Z' />
        </G>
    </Svg>
);

export default GoogleLogo;
