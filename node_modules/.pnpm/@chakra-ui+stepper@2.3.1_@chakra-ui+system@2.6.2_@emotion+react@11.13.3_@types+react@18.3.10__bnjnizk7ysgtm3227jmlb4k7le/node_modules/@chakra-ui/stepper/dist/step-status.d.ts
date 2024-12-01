import * as react_jsx_runtime from 'react/jsx-runtime';
import { StepStatusType, StepContext } from './step-context.js';
import '@chakra-ui/system';
import 'react';

type MaybeRenderProp = React.ReactNode | ((props: StepContext) => React.ReactNode);
interface StepStatusProps extends Partial<Record<StepStatusType, MaybeRenderProp>> {
}
declare function StepStatus(props: StepStatusProps): react_jsx_runtime.JSX.Element | null;

export { StepStatus, StepStatusProps };
