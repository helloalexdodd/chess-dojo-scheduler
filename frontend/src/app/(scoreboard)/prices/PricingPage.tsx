'use client';

import { useApi } from '@/api/Api';
import { RequestSnackbar, useRequest } from '@/api/Request';
import { AuthStatus, useAuth } from '@/auth/Auth';
import { SubscriptionStatus } from '@/database/user';
import { useNextSearchParams } from '@/hooks/useNextSearchParams';
import LoadingPage from '@/loading/LoadingPage';
import PriceMatrix from '@/upsell/PriceMatrix';
import { Container, Grid2, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PricingPageProps {
    onFreeTier?: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onFreeTier }) => {
    const { status, user } = useAuth();
    const api = useApi();
    const request = useRequest();
    const [interval, setInterval] = useState('');
    const { searchParams } = useNextSearchParams();
    const redirect = searchParams.get('redirect') || '';
    const router = useRouter();

    if (status === AuthStatus.Loading) {
        return <LoadingPage />;
    }

    if (user?.subscriptionStatus === SubscriptionStatus.Subscribed) {
        window.location.href = '/profile';
        return;
    }

    const onSubscribe = (interval: 'month' | 'year') => {
        if (!user) {
            router.push('/signup');
        }

        setInterval(interval);

        request.onStart();
        api.subscriptionCheckout({ interval, successUrl: redirect, cancelUrl: redirect })
            .then((resp) => {
                window.location.href = resp.data.url;
            })
            .catch((err: unknown) => {
                console.error('subscriptionCheckout: ', err);
                request.onFailure(err);
            });
    };

    return (
        <Container sx={{ py: 5 }}>
            <RequestSnackbar request={request} />
            <Grid2 container spacing={3} justifyContent='center'>
                <Grid2 textAlign='center' size={12}>
                    <Typography variant='subtitle1' color='text.secondary'>
                        Choose your pricing plan
                    </Typography>
                </Grid2>

                <PriceMatrix
                    onSubscribe={onSubscribe}
                    request={request}
                    interval={interval}
                    onFreeTier={onFreeTier}
                />

                <Grid2 textAlign='center' size={12}>
                    <Typography variant='body2' color='text.secondary'>
                        Plans automatically renew until canceled
                    </Typography>
                </Grid2>
            </Grid2>
        </Container>
    );
};

export default PricingPage;
