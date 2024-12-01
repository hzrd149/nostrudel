import { ConnectorElement } from './ConnectorElement';
export declare const lnfiConnectorTitle = "LN Link";
export declare class LnfiNWCConnector extends ConnectorElement {
    constructor();
    protected _onClick(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-lnfi-nwc-connector': LnfiNWCConnector;
    }
}
