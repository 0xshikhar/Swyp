import { generateNonce, SiweMessage } from 'siwe';
import { prisma } from './prisma';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

export async function createAuthMessage(address: string, chainId: number) {
    const nonce = generateNonce();
    const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Next Demo application',
        uri: window.location.origin,
        version: '1',
        chainId,
        nonce
    });

    return message.prepareMessage();
}

export async function verifySignature(message: string, signature: string) {
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.verify({ signature });
    return fields.data;
}

// Define the user type for the JWT payload
export interface JwtPayload {
    userId: string;
    address: string;
    iat?: number;
    exp?: number;
}

export interface AuthUser {
    id: string;
    walletAddress: string;
    username?: string;
    bio?: string;
    avatar?: string;
    createdAt: Date;
    lastLoginAt: Date;
}

// Generate a JWT token
export function generateJwtToken(payload: Omit<JwtPayload, 'iat' | 'exp'>) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, secret, { expiresIn: '1d' });
}

// Verify a JWT token
export async function verifyJwtToken(token: string): Promise<JwtPayload> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded as JwtPayload);
            }
        });
    });
}

// Debug function to check token validity
export function debugJwtToken(token: string): { valid: boolean; payload?: JwtPayload; error?: string } {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return { valid: false, error: 'JWT_SECRET is not defined' };
    }

    try {
        const decoded = jwt.verify(token, secret);
        return { valid: true, payload: decoded as JwtPayload };
    } catch (error) {
        return {
            valid: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

// Extract token from request headers
export function extractToken(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

// Get or create user
export async function getOrCreateUser(walletAddress: string): Promise<AuthUser> {
    const existingUser = await prisma.user.findUnique({
        where: { walletAddress: walletAddress.toLowerCase() },
    });

    if (existingUser) {
        // Update last login
        const updatedUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLoginAt: new Date() },
        });
        return updatedUser;
    }

    // Create new user
    const newUser = await prisma.user.create({
        data: {
            walletAddress: walletAddress.toLowerCase(),
            lastLoginAt: new Date(),
        },
    });

    return newUser;
}

// Middleware to authenticate requests
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
    const token = extractToken(request);
    if (!token) {
        return null;
    }

    try {
        const payload = await verifyJwtToken(token);
        const user = await prisma.user.findUnique({
            where: { id: payload.userId },
        });
        return user;
    } catch (error) {
        console.error('Failed to authenticate request:', error);
        return null;
    }
}

// Store nonce temporarily (in production, use Redis or similar)
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();

export function storeNonce(address: string, nonce: string): void {
    nonceStore.set(address.toLowerCase(), {
        nonce,
        timestamp: Date.now(),
    });
    
    // Clean up old nonces (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    Array.from(nonceStore.entries()).forEach(([key, value]) => {
        if (value.timestamp < tenMinutesAgo) {
            nonceStore.delete(key);
        }
    });
}

export function getNonce(address: string): string | null {
    const stored = nonceStore.get(address.toLowerCase());
    if (!stored) return null;
    
    // Check if nonce is still valid (10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    if (stored.timestamp < tenMinutesAgo) {
        nonceStore.delete(address.toLowerCase());
        return null;
    }
    
    return stored.nonce;
}

export function removeNonce(address: string): void {
    nonceStore.delete(address.toLowerCase());
}
