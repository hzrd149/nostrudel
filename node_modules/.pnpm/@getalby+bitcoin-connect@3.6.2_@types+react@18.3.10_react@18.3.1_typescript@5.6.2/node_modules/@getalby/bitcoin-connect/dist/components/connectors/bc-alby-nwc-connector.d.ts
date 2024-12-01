import { ConnectorElement } from './ConnectorElement';
export declare class AlbyNWCConnector extends ConnectorElement {
    constructor();
    protected _onClick(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-alby-nwc-connector': AlbyNWCConnector;
    }
}
