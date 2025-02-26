import { watch } from 'runed';
import type { MaybeGetter } from './types';
import { extract } from './extract.svelte';

export function useInterval(callback: () => void, delay: MaybeGetter<number | null>) {
	let savedCallback = callback;
	const delay$ = $derived(extract(delay));

	// Remember the latest callback if it changes.
	watch.pre(
		() => callback,
		() => {
			savedCallback = callback;
		}
	);

	// Set up the interval.
	watch(
		() => delay$,
		() => {
			// Don't schedule if no delay is specified.
			// Note: 0 is a valid value for delay.
			if (delay$ === null) {
				return;
			}

			const id = setInterval(() => {
				savedCallback();
			}, delay$);

			return () => {
				clearInterval(id);
			};
		}
	);
}
