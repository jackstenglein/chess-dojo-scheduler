import React, { CSSProperties } from 'react';
import { ResizableBox as ReactResizableBox } from 'react-resizable';

import 'react-resizable/css/styles.css';

interface ResizableBoxProps {
    width?: number;
    height?: number;
    resizable?: boolean;
    className?: string;
    style?: CSSProperties;
}

const ResizableBox: React.FC<React.PropsWithChildren<ResizableBoxProps>> = ({
    children,
    width = 600,
    height = 300,
    resizable = true,
    className,
    style,
}) => {
    return (
        <div style={{ marginLeft: 20 }}>
            <div
                style={{
                    display: 'inline-block',
                    width: 'auto',
                    background: 'white',
                    padding: '.5rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 30px 40px rgba(0,0,0,.1)',
                    ...style,
                }}
            >
                {resizable ? (
                    <ReactResizableBox width={width} height={height}>
                        <div
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            className={className}
                        >
                            {children}
                        </div>
                    </ReactResizableBox>
                ) : (
                    <div
                        style={{
                            width: `${width}px`,
                            height: `${height}px`,
                        }}
                        className={className}
                    >
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResizableBox;
