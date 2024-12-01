import { Connector } from './Connector';
import { ConnectorConfig } from '../types/ConnectorConfig';
import { GetBalanceResponse, GetInfoResponse, KeysendArgs, LookupInvoiceArgs, LookupInvoiceResponse, MakeInvoiceResponse, RequestInvoiceArgs, SendPaymentResponse, SignMessageResponse, WebLNProvider, WebLNRequestMethod } from '@webbtc/webln-types';
export declare class LnbitsConnector extends Connector {
    constructor(config: ConnectorConfig);
    init(): Promise<WebLNProvider>;
}
export declare class LnbitsWebLNProvider implements WebLNProvider {
    private _instanceUrl;
    private _adminKey;
    constructor(lnbitsUrl: string, lnbitsAdminKey: string);
    enable(): Promise<void>;
    getInfo(): Promise<GetInfoResponse>;
    makeInvoice(args: string | number | RequestInvoiceArgs): Promise<MakeInvoiceResponse>;
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
    requestLnbits<T>(method: string, path: string, args?: Record<string, unknown>): Promise<T>;
}
