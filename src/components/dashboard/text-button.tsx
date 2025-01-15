import { Button, ButtonProps } from '@chakra-ui/react';

export default function TextButton({ children, ...props }: ButtonProps) {
	return (
		<Button variant="link" fontFamily="monospace" {...props}>
			{children}
		</Button>
	);
}
