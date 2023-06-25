interface CoachProps {
    src: string;
}

const Coach: React.FC<CoachProps> = ({ src }) => {
    return (
        <img
            src={src}
            style={{
                maxHeight: '120px',
                marginLeft: '1em',
            }}
            alt='coach logo'
        />
    );
};

export default Coach;
