import { WebLNProvider } from '@webbtc/webln-types';
import { ConnectorConfig } from '../types/ConnectorConfig';
export declare abstract class Connector {
    protected _config: ConnectorConfig;
    constructor(config: ConnectorConfig);
    abstract init(): Promise<WebLNProvider>;
    unload(): Promise<void>;
}
