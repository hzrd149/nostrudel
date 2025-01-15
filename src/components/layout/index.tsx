import MobileLayout from './mobile';
import DesktopLayout from './desktop';
import { useBreakpointValue } from '../../providers/global/breakpoint-provider';

export default function AppLayout() {
	const mobile = useBreakpointValue({ base: true, md: false });

	if (mobile) return <MobileLayout />;
	else return <DesktopLayout />;
}
