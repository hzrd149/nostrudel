import { ConnectorElement } from './ConnectorElement';
export declare class UmbrelNWCConnector extends ConnectorElement {
    constructor();
    protected _onClick(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-umbrel-nwc-connector': UmbrelNWCConnector;
    }
}
