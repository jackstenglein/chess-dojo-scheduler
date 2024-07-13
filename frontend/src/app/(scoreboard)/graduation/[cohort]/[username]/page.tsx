import { listGraduationsByCohort } from '@/api/graduationApi';
import { Container } from '@mui/material';

interface PageProps {
    params: {
        cohort: string;
        username: string;
    };
}

export default async function Page({ params }: PageProps) {
    const { username, cohort } = params;

    const graduations = await listGraduationsByCohort(cohort);
    console.log(graduations);

    /*
    const graduationsRequest = useRequest<Graduation[]>();
    const [graduation, setGraduation] = useState<Graduation>();
    const api = useApi();

    useEffect(() => {
        if (!graduationsRequest.isSent()) {
            graduationsRequest.onStart();
            api.listGraduationsByOwner(user.username)
                .then((graduations) => {
                    graduationsRequest.onSuccess(graduations);
                    const [latest] = graduations.toSorted(
                        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
                    );
                    setGraduation(latest);
                })
                .catch((err) => {
                    console.error('listGraduations: ', err);
                    graduationsRequest.onFailure(err);
                });
        }
    }, []);

    if (graduationsRequest.isLoading() || graduation === undefined) {
        return <LoadingPage />;
    }
    */

    return (
        <Container maxWidth='md' sx={{ py: 5 }}>
            {username}
            {cohort}
            {JSON.stringify(graduations)}
        </Container>
    );
}
