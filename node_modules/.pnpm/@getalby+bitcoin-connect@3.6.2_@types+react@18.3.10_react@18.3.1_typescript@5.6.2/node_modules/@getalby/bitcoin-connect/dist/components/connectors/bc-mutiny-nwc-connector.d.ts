import { ConnectorElement } from './ConnectorElement';
export declare const mutinyNWCConnectorTitle = "Mutiny";
export declare class MutinyNWCConnector extends ConnectorElement {
    constructor();
    protected _onClick(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-mutiny-nwc-connector': MutinyNWCConnector;
    }
}
