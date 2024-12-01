import { Connector } from './Connector';
import { ConnectorConfig } from '../types/ConnectorConfig';
import { GetBalanceResponse, GetInfoResponse, KeysendArgs, LookupInvoiceArgs, LookupInvoiceResponse, MakeInvoiceResponse, RequestInvoiceArgs, SendPaymentResponse, SignMessageResponse, WebLNProvider, WebLNRequestMethod } from '@webbtc/webln-types';
import type LNC from '@lightninglabs/lnc-web';
declare let lnc: LNC;
export declare function getLNC(): Promise<LNC>;
export { lnc };
export declare class LNCConnector extends Connector {
    constructor(config: ConnectorConfig);
    init(): Promise<WebLNProvider>;
    unload(): Promise<void>;
}
export declare class LNCWebLNProvider implements WebLNProvider {
    lnc: LNC;
    constructor(lnc: LNC);
    enable(): Promise<void>;
    getInfo(): Promise<GetInfoResponse>;
    makeInvoice(_args: string | number | RequestInvoiceArgs): Promise<MakeInvoiceResponse>;
    sendPayment(paymentRequest: string): Promise<SendPaymentResponse>;
    getBalance(): Promise<GetBalanceResponse>;
    keysend(_args: KeysendArgs): Promise<SendPaymentResponse>;
    lnurl(_lnurl: string): Promise<{
        status: 'OK';
    } | {
        status: 'ERROR';
        reason: string;
    }>;
    lookupInvoice(_args: LookupInvoiceArgs): Promise<LookupInvoiceResponse>;
    request: ((method: WebLNRequestMethod, args?: unknown) => Promise<unknown>) | undefined;
    signMessage(_message: string): Promise<SignMessageResponse>;
    verifyMessage(_signature: string, _message: string): Promise<void>;
}
