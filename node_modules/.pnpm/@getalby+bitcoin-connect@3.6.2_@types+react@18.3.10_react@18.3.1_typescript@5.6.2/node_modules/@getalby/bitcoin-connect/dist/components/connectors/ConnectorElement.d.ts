import { TemplateResult } from 'lit';
import { BitcoinConnectElement } from '../BitcoinConnectElement';
import { ConnectorType } from '../../types/ConnectorType';
import { ConnectorConfig } from '../../types/ConnectorConfig';
declare const ConnectorElement_base: typeof BitcoinConnectElement;
export declare abstract class ConnectorElement extends ConnectorElement_base {
    private _background;
    private _icon;
    protected _title: string;
    protected _connectorType: ConnectorType;
    protected abstract _onClick(): void;
    constructor(connectorType: ConnectorType, title: string, background: string, icon: TemplateResult<2>);
    render(): TemplateResult<1>;
    protected _connect(config: Omit<ConnectorConfig, 'connectorName' | 'connectorType'>): void;
}
export {};
