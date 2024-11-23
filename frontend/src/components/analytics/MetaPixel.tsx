/* eslint-disable @next/next/no-img-element */
import Script from 'next/script';

export function MetaPixel() {
    return (
        <>
            <Script id='meta-pixel'>
                {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '566612992731349');
                fbq('track', 'PageView');
            `}
            </Script>
            <noscript>
                <img
                    alt=''
                    height='1'
                    width='1'
                    style={{ display: 'none' }}
                    src='https://www.facebook.com/tr?id=566612992731349&ev=PageView&noscript=1'
                />
            </noscript>
        </>
    );
}
