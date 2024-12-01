import { ExtensionConnector } from './ExtensionConnector';
import { LnbitsConnector } from './LnbitsConnector';
import { LNCConnector } from './LNCConnector';
import { NWCConnector } from './NWCConnector';
export declare const connectors: {
    'extension.generic': typeof ExtensionConnector;
    'nwc.alby': typeof NWCConnector;
    'nwc.generic': typeof NWCConnector;
    'nwc.mutiny': typeof NWCConnector;
    'nwc.umbrel': typeof NWCConnector;
    'nwc.lnfi': typeof NWCConnector;
    lnbits: typeof LnbitsConnector;
    lnc: typeof LNCConnector;
};
