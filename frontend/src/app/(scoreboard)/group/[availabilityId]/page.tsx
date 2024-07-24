import { Navigate, useParams } from 'react-router-dom';

const GroupMeetingPage = () => {
    const { availabilityId } = useParams();

    return <Navigate to={`/meeting/${availabilityId}`} replace />;
};

export default GroupMeetingPage;
