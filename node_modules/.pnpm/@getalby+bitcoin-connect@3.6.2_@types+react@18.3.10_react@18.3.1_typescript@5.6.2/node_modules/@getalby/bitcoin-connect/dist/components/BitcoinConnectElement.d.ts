import { InternalElement } from './internal/InternalElement';
import { ConnectorFilter } from '../types/ConnectorFilter';
import { Route } from './routes';
export declare class BitcoinConnectElement extends InternalElement {
    protected _modalOpen: boolean;
    protected _connected: boolean;
    protected _connecting: boolean;
    protected _connectorName: string | undefined;
    protected _appName: string | undefined;
    protected _filters: ConnectorFilter[] | undefined;
    protected _error: string | undefined;
    protected _route: Route;
    constructor();
}
