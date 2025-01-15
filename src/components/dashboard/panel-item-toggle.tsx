import { FormControl, FormControlProps, FormLabel, Switch } from '@chakra-ui/react';

export default function PanelItemToggle({
	label,
	value,
	onChange,
	...props
}: Omit<FormControlProps, 'children'> & {
	label?: string;
	value: boolean;
	onChange: () => void;
}) {
	return (
		<FormControl display="flex" alignItems="center" justifyContent="space-between" {...props}>
			<FormLabel mb="0">{label}</FormLabel>
			<Switch isChecked={value} onChange={onChange} />
		</FormControl>
	);
}
