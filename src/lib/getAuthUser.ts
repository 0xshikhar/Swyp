import { headers } from 'next/headers';
import { AuthUser } from './auth';

export function getAuthUser(): AuthUser | null {
    const headersList = headers();
    const userId = headersList.get('x-user-id');
    const address = headersList.get('x-user-address');

    if (!userId || !address) {
        return null;
    }

    return {
        id: userId,
        walletAddress: address,
        username: null,
        bio: null,
        avatar: null,
        createdAt: new Date(),
        lastLoginAt: null
    };
}