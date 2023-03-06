import { useParams } from 'react-router-dom';

type RequirementPageProps = {
    id: string;
};

const RequirementPage = () => {
    const { id } = useParams<RequirementPageProps>();

    return null;
};

export default RequirementPage;
