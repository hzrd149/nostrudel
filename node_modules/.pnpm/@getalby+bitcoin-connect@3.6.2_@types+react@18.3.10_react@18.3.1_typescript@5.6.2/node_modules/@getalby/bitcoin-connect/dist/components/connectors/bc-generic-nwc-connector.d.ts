import { ConnectorElement } from './ConnectorElement';
export declare const genericConnectorTitle = "Nostr Wallet Connect";
export declare class GenericNWCConnector extends ConnectorElement {
    constructor();
    protected _onClick(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-nwc-connector': GenericNWCConnector;
    }
}
