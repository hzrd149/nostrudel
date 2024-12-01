import { ConnectorFilter } from './ConnectorFilter';
import { WebLNProviderConfig } from './WebLNProviderConfig';
export declare type BitcoinConnectConfig = {
    /**
     * Name of the application that the user is interacting with.
     *   May be passed to the connector the user chooses to connect with (e.g. NWC)
     */
    appName?: string;
    /**
     * Limit which connectors are shown in the connect flow
     */
    filters?: ConnectorFilter[];
    /**
     * Set to false to not request or show the user's wallet balance
     */
    showBalance?: boolean;
    /**
     * Customize individual providers (NWC, LNC, LNbits etc)
     */
    providerConfig?: WebLNProviderConfig;
};
export declare const DEFAULT_BITCOIN_CONNECT_CONFIG: BitcoinConnectConfig;
