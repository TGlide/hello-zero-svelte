<script lang="ts">
	import { Query } from 'zero-svelte';
	import { z } from '$lib/z.svelte';
	import { escapeLike } from '@rocicorp/zero';
	import { randInt } from '$lib/rand';
	import { randomMessage } from '$lib/test-data';
	import { useInterval } from '$lib/use-interval.svelte';
	import Cookies from 'js-cookie';
	import { formatDate } from '$lib/date';

	const users = new Query(z.current.query.user);
	const mediums = new Query(z.current.query.medium);

	let filterUser = $state('');
	let filterText = $state('');

	const all = $derived(z.current.query.message);
	// svelte-ignore state_referenced_locally
	const allMessages = new Query(all);

	const filtered = $derived.by(() => {
		let res = all.related('medium').related('sender').orderBy('timestamp', 'desc');

		if (filterUser) {
			res = res.where('senderID', filterUser);
		}

		if (filterText) {
			res = res.where('body', 'LIKE', `%${escapeLike(filterText)}%`);
		}

		return res;
	});

	const filteredMessages = $derived(new Query(filtered));

	const hasFilters = $derived(filterUser || filterText);
	let action = $state<'add' | 'remove' | undefined>();
	let holdTimer: NodeJS.Timeout | null = null;

	const deleteRandomMessage = () => {
		if (allMessages.current.length === 0) {
			return false;
		}
		const index = randInt(allMessages.current.length);
		z.current.mutate.message.delete({ id: allMessages.current[index].id });

		return true;
	};

	const addRandomMessage = () => {
		z.current.mutate.message.insert(randomMessage(users.current, mediums.current));
		return true;
	};

	const handleAction = () => {
		if (action === 'add') {
			return addRandomMessage();
		} else if (action === 'remove') {
			return deleteRandomMessage();
		}

		return false;
	};

	useInterval(
		() => {
			if (!handleAction()) {
				action = undefined;
			}
		},
		() => (action !== undefined ? 1000 / 60 : null)
	);

	const INITIAL_HOLD_DELAY_MS = 300;
	const handleAddAction = () => {
		addRandomMessage();
		holdTimer = setTimeout(() => {
			action = 'add';
		}, INITIAL_HOLD_DELAY_MS);
	};

	const handleRemoveAction = (e: MouseEvent | TouchEvent) => {
		if (z.current.userID === 'anon' && 'shiftKey' in e && !e.shiftKey) {
			alert('You must be logged in to delete. Hold shift to try anyway.');
			return;
		}
		deleteRandomMessage();

		holdTimer = setTimeout(() => {
			action = 'remove';
		}, INITIAL_HOLD_DELAY_MS);
	};

	const stopAction = () => {
		if (holdTimer) {
			clearTimeout(holdTimer);
			holdTimer = null;
		}

		action = undefined;
	};

	const editMessage = (e: MouseEvent, id: string, senderID: string, prev: string) => {
		if (senderID !== z.current.userID && !e.shiftKey) {
			alert(
				"You aren't logged in as the sender of this message. Editing won't be permitted. Hold the shift key to try anyway."
			);
			return;
		}
		const body = prompt('Edit message', prev);
		z.current.mutate.message.update({
			id,
			body: body ?? prev
		});
	};

	const toggleLogin = async () => {
		console.log(z.current.userID);
		if (z.current.userID === 'anon') {
			await fetch('/api/login');
		} else {
			Cookies.remove('jwt');
		}
		location.reload();
	};

	// // If initial sync hasn't completed, these can be empty.
	// if (!users.length || !mediums.length) {
	// 	return null;
	// }

	const user = $derived(users.current.find((user) => user.id === z.current.userID)?.name ?? 'anon');
</script>

{#if users.current.length && mediums.current.length}
	<div class="controls">
		<div>
			<button
				onmousedown={handleAddAction}
				onmouseup={stopAction}
				onmouseleave={stopAction}
				ontouchstart={handleAddAction}
				ontouchend={stopAction}
			>
				Add Messages
			</button>
			<button
				onmousedown={handleRemoveAction}
				onmouseup={stopAction}
				onmouseleave={stopAction}
				ontouchstart={handleRemoveAction}
				ontouchend={stopAction}
			>
				Remove Messages
			</button>
			<em>(hold down buttons to repeat)</em>
		</div>
		<div style:justifyContent="end">
			{user === 'anon' ? '' : `Logged in as ${user}`}
			<button onmousedown={() => toggleLogin()}>
				{user === 'anon' ? 'Login' : 'Logout'}
			</button>
		</div>
	</div>
	<div class="controls">
		<div>
			From:
			<select
				onchange={(e) => (filterUser = (e.target as unknown as { value: string }).value)}
				style:flex="1"
			>
				<option value=""> Sender </option>
				{#each users.current as user (user.id)}
					<option value={user.id}>
						{user.name}
					</option>
				{/each}
			</select>
		</div>
		<div>
			Contains:
			<input
				type="text"
				placeholder="message"
				onchange={(e) => (filterText = (e.target as unknown as { value: string }).value)}
				style:flex="1"
			/>
		</div>
	</div>
	<div class="controls">
		<em>
			{#if hasFilters}
				Showing all {filteredMessages.current.length} messages
			{:else}
				Showing {filteredMessages.current.length} of {allMessages.current.length} messages. Try opening{' '}
				<a href="/" target="_blank"> another tab </a>{' '}
				to see them all!
			{/if}
		</em>
	</div>
	{#if !filteredMessages.current.length}
		<h3>
			<em>No posts found 😢</em>
		</h3>
	{:else}
		<table border={1} cellSpacing={0} cellPadding={6} width="100%">
			<thead>
				<tr>
					<th>Sender</th>
					<th>Medium</th>
					<th>Message</th>
					<th>Sent</th>
					<th>Edit</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredMessages.current as message (message.id)}
					<tr>
						<td align="left">{message.sender?.name}</td>
						<td align="left">{message.medium?.name}</td>
						<td align="left">{message.body}</td>
						<td align="right">{formatDate(message.timestamp)}</td>
						<td onmousedown={(e) => editMessage(e, message.id, message.senderID, message.body)}>
							✏️
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
{/if}
