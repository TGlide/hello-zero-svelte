import { SignJWT } from 'jose';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ZERO_AUTH_SECRET } from '$env/static/private';

// See seed.sql
// In real life you would of course authenticate the user however you like.
const userIDs = [
	'6z7dkeVLNm',
	'ycD76wW4R2',
	'IoQSaxeVO5',
	'WndZWmGkO4',
	'ENzoNm7g4E',
	'dLKecN3ntd',
	'7VoEoJWEwn',
	'enVvyDlBul',
	'9ogaDuDNFx'
];

function randomInt(max: number) {
	return Math.floor(Math.random() * max);
}

function must<T>(val: T | undefined): T {
	if (val === undefined) {
		throw new Error('Expected value to be defined');
	}
	return val;
}

export const GET: RequestHandler = async ({ cookies }) => {
	const jwtPayload = {
		sub: userIDs[randomInt(userIDs.length)],
		iat: Math.floor(Date.now() / 1000)
	};

	try {
		const jwt = await new SignJWT(jwtPayload)
			.setProtectedHeader({ alg: 'HS256' })
			.setExpirationTime('30days')
			.sign(new TextEncoder().encode(must(ZERO_AUTH_SECRET)));

		cookies.set('jwt', jwt, {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 30 * 24 * 60 * 60 // 30 days in seconds
		});

		return new Response('ok');
	} catch (err) {
		console.error('Error signing JWT:', err);
		throw error(500, 'Unable to create authentication token');
	}
};
