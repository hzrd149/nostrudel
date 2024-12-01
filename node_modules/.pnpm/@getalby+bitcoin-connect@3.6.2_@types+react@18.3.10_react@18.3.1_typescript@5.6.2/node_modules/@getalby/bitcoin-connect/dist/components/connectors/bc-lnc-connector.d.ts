import { ConnectorElement } from './ConnectorElement';
export declare class LNCConnector extends ConnectorElement {
    constructor();
    protected _onClick(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-lnc-connector': LNCConnector;
    }
}
