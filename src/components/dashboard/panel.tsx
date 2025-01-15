import { useState } from 'react';
import { Flex, FlexProps, Heading } from '@chakra-ui/react';
import TextButton from './text-button';

export default function Panel({ label, children, ...props }: FlexProps & { label?: string }) {
	const [open, setOpen] = useState(true);

	return (
		<Flex borderWidth={1} rounded="lg" p="4" direction="column" {...props}>
			<Flex justifyContent="space-between" mb={open ? 2 : 0}>
				<Heading size="sm">{label}</Heading>
				<TextButton onClick={() => setOpen(!open)} type="button">
					[{open ? '-' : '+'}]
				</TextButton>
			</Flex>
			{open && children}
		</Flex>
	);
}
