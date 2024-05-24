import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createMemoryRouter } from 'react-router-dom';

type Router = ReturnType<typeof createMemoryRouter>;

export default function useRouterMarker(router: Router) {
	const index = useRef<number | null>(null);
	const set = useCallback((v = 0) => (index.current = v), []);
	const reset = useCallback(() => (index.current = null), []);

	useEffect(() => {
		return router.subscribe((event) => {
			if (index.current === null) return;
			if (event.historyAction === 'PUSH') index.current++;
			else if (event.historyAction === 'POP') index.current--;
		});
	}, [router]);

	return useMemo(() => ({ index, set, reset }), [index, set, reset]);
}
