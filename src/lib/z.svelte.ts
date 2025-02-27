import { Z } from 'zero-svelte';

import Cookies from 'js-cookie';
import { schema } from './schema';

const encodedJWT = Cookies.get('jwt');
const decodedJWT = encodedJWT && decodeJwt(encodedJWT);
const userID = decodedJWT?.sub ? (decodedJWT.sub as string) : 'anon';

import { decodeJwt } from 'jose';

export const z = new Z({
	userID,
	auth: () => encodedJWT,
	server: import.meta.env.VITE_PUBLIC_SERVER,
	schema,
	// This is often easier to develop with if you're frequently changing
	// the schema. Switch to 'idb' for local-persistence.
	kvStore: 'idb'
});
