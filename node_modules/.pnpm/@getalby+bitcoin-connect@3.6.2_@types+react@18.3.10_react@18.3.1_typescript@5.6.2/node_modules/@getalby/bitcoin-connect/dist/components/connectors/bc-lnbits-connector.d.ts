import { ConnectorElement } from './ConnectorElement';
export declare const lnbitsConnectorTitle = "LNbits";
export declare class GenericNWCConnector extends ConnectorElement {
    constructor();
    protected _onClick(): Promise<void>;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-lnbits-connector': GenericNWCConnector;
    }
}
