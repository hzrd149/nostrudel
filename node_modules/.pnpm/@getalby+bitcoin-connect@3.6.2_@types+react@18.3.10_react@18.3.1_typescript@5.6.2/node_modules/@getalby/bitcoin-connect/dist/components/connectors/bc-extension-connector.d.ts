import { ConnectorElement } from './ConnectorElement';
export declare class ExtensionConnector extends ConnectorElement {
    constructor();
    protected _onClick(): void;
}
declare global {
    interface HTMLElementTagNameMap {
        'bc-extension-connector': ExtensionConnector;
    }
}
