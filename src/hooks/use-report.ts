import { useEffect, useMemo, useState } from 'react';
import { ReportArguments } from '@satellite-earth/core/types';
import { nanoid } from 'nanoid';

import reportManagerService from '../services/reports';

export default function useReport<T extends keyof ReportArguments>(type: T, id?: string, args?: ReportArguments[T]) {
	const [hookId] = useState(() => nanoid());
	const argsKey = JSON.stringify(args);

	const report = useMemo(() => {
		if (id && args) return reportManagerService?.getOrCreateReport(type, id, args);
	}, [type, id, argsKey]);

	useEffect(() => {
		if (args && report) {
			// @ts-expect-error
			report.setArgs(args);
			report.fireThrottle();
		}
	}, [argsKey, report]);

	useEffect(() => {
		if (report) {
			reportManagerService?.addDependency(hookId, report);
			return () => reportManagerService?.removeDependency(hookId, report);
		}
	}, [report]);

	return report;
}
