# Hello Zero Svelte

## Option 1: Run this repo

First, install dependencies:

```sh
pnpm i
```

Next, run docker:

```sh
pnpm run dev:db-up
```

**In a second terminal**, run the zero cache server:

```sh
pnpm run dev:zero-cache
```

**In a third terminal**, run the Vite dev server:

```sh
pnpm run dev:ui
```

## Option 2: Install Zero in your own project

This guide explains how to set up Zero in your React application, using this
repository as a reference implementation.

### Prerequisites

**1. PostgreSQL database with Write-Ahead Logging (WAL) enabled**

See [Connecting to Postgres](https://zero.rocicorp.dev/docs/connecting-to-postgres)

**2. Environment Variables**

Set the following environment variables. `ZSTART_UPSTREAM_DB` is the URL to your Postgres
database.

```ini
# Your application's data
ZERO_UPSTREAM_DB="postgresql://user:password@127.0.0.1/mydb"

# A Postgres database Zero can use for storing Client View Records (information
# about what has been synced to which clients). Can be same as above db, but
# nice to keep separate for cleanliness and so that it can scale separately
# when needed.
ZERO_CVR_DB="postgresql://user:password@127.0.0.1/mydb_cvr"

# A Postgres database Zero can use for storing its own replication log. Can be
# same as either of above, but nice to keep separate for same reason as cvr db.
ZERO_CHANGE_DB="postgresql://user:password@127.0.0.1/mydb_cdb"

# Secret to decode auth token.
ZERO_AUTH_SECRET="secretkey"

# Place to store sqlite replica file.
ZERO_REPLICA_FILE="/tmp/zstart_replica.db"

# Where UI will connect to zero-cache.
VITE_PUBLIC_SERVER=http://localhost:4848
```

### Setup

1. **Install Zero**

```bash
pnpm install @rocicorp/zero
```

2. **Create Schema** Define your database schema using Zero's schema builder.
   See [schema.ts](src/lib/schema.ts) for example:

```typescript
import { createSchema, createTableSchema } from '@rocicorp/zero';

const userSchema = createTableSchema({
	tableName: 'user',
	columns: {
		id: { type: 'string' },
		name: { type: 'string' }
	},
	primaryKey: ['id']
});

export const schema = createSchema({
	version: 1,
	tables: {
		user: userSchema
	}
});

export type Schema = typeof schema;
```

3. **Initialize Zero Client-Side** Set up the Zero provider . See [z.svelte.ts](src/lib/z.svelte.ts):

```tsx
import { Zero } from '@rocicorp/zero';
import { Z } from 'zero-svelte';
import { schema } from './schema';

// In a real app, you might initialize this inside of useMemo
// and use a real auth token
const z = new Z({
	userID: 'your-user-id',
	auth: 'your-auth-token',
	server: import.meta.env.VITE_PUBLIC_SERVER,
	schema,
	kvStore: 'mem' // or "idb" for IndexedDB persistence
});
```

4. **Using Zero in Components** Example usage in Svelte components. See
   [+page.svelte](src/routes/+page.svelte):

```svelte
<script lang="ts">
	const users = new Query(z.current.query.user);
</script>

import {Schema} from "./schema";

{#if users.current}
	<div>
		{#each users as user (user.id)}
			<div>{user.name}</div>
		{/each}
	</div>
{/if}
```

For more examples of queries, mutations, and relationships, explore the
[+page.svelte](src/routes/+page.svelte) file in this repository.

### Optional: Authentication

This example includes JWT-based authentication. See [login/+server.ts](src/routes/api/login/+server.ts)
for an example implementation using SvelteKit.

### Development

**1. Start the PostgreSQL database:**

If you are using Docker (referencing the example in
[docker](docker/docker-compose.yml)), run:

```bash
npm run docker-up
```

**2. Start the zero cache server (in a separate terminal):**

```bash
npx zero-cache
```

**3. Start your SVelte dev server**

```bash
npm run dev # this depends on your react app setup
```
