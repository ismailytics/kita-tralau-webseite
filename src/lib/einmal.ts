/** Merkt sich das Ergebnis pro Schlüssel: Inhalte werden einmal pro Build geladen, auch wenn viele Seiten sie brauchen. */
export function einmal<T>(laden: () => Promise<T>): () => Promise<T>;
export function einmal<K, T>(laden: (schluessel: K) => Promise<T>): (schluessel: K) => Promise<T>;
export function einmal<K, T>(laden: (schluessel: K) => Promise<T>): (schluessel: K) => Promise<T> {
	const cache = new Map<K, Promise<T>>();
	return (schluessel) => {
		if (!cache.has(schluessel)) cache.set(schluessel, laden(schluessel));
		return cache.get(schluessel) as Promise<T>;
	};
}
