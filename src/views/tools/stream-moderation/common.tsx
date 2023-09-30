import { CardHeader, CardHeaderProps, CardProps, Heading } from "@chakra-ui/react";
import { ParsedStream } from "../../../helpers/nostr/stream";

export type DashboardCardProps = CardProps & { stream: ParsedStream };
