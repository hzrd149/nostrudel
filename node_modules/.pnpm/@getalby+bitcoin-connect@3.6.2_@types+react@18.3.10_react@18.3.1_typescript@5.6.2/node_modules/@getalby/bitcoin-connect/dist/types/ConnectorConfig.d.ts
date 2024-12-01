import { ConnectorType } from './ConnectorType';
export declare type ConnectorConfig = {
    connectorName: string;
    connectorType: ConnectorType;
    nwcUrl?: string;
    lnbitsInstanceUrl?: string;
    lnbitsAdminKey?: string;
};
