import { SendPaymentResponse, WebLNProvider } from '@webbtc/webln-types';
import { PaymentMethods } from './types/PaymentMethods';
import { BitcoinConnectConfig } from './types/BitcoinConnectConfig';
declare type LaunchPaymentModalArgs = {
    /**
     * Launch a payment flow to pay a BOLT11 invoice
     */
    invoice: string;
    /**
     * Supported payment methods in payment flow
     */
    paymentMethods?: PaymentMethods;
    /**
     * Called when a payment is made (either with WebLN or externally)
     * @param response response of the WebLN send payment call
     */
    onPaid?: (response: SendPaymentResponse) => void;
    /**
     * Called when modal is closed without completing the payment
     */
    onCancelled?: () => void;
};
/**
 * Subscribe to onConnected events which will fire when a wallet is connected (either
 * the user connects to a new wallet or when Bitcoin Connect boots and connects to a previously-connected wallet).
 *
 * If a provider is already available when the subscription is created, the callback will be immediately fired.
 * @param callback includes the webln provider that was (or is already) connected
 * @returns unsubscribe function
 */
export declare function onConnected(callback: (provider: WebLNProvider) => void): () => void;
/**
 * Listen to onConnecting events which will fire when a user is connecting to their wallet
 * Subscribe to onConnecting events which will fire when a user is connecting to their wallet
 *
 * If a provider is already being connected to when the subscription is created, the callback will be immediately fired.
 * @param callback
 * @returns unsubscribe function
 */
export declare function onConnecting(callback: () => void): () => void;
/**
 * Listen to onDisconnected events which will fire when a user disconnects from their wallet
 * @param callback
 * @returns unsubscribe function
 */
export declare function onDisconnected(callback: () => void): () => void;
/**
 * Listen to onModalOpened events which will fire when a Bitcoin Connect modal is opened
 * @param callback
 * @returns unsubscribe function
 */
export declare function onModalOpened(callback: () => void): () => void;
/**
 * Listen to onModalOpened events which will fire when a Bitcoin Connect modal is closed
 * @param callback
 * @returns unsubscribe function
 */
export declare function onModalClosed(callback: () => void): () => void;
/**
 * If a WebLN provider already exists, returns the current WebLN provider. Otherwise
 *   will launch the modal to allow the user to connect to a wallet,
 *   and then enable the WebLN provider for that wallet.
 * @returns an enabled WebLN provider.
 * @throws Error if user cancels flow (by closing the modal)
 */
export declare function requestProvider(): Promise<WebLNProvider>;
/**
 * @returns true if user is connected to a wallet and WebLN is enabled
 * @deprecated will be removed in v4.
 */
export declare function isConnected(): boolean;
/**
 * Configures Bitcoin Connect
 * @param config
 */
export declare function init(config?: BitcoinConnectConfig): void;
/**
 * Programmatically launch the Bitcoin Connect modal
 */
export declare function launchModal(): void;
/**
 * Programmatically launch the Bitcoin Connect modal to receive a payment
 * @param args configure the payment modal
 *
 * @returns an object allowing you to mark the payment as made (for external payments)
 */
export declare function launchPaymentModal({ invoice, paymentMethods, onPaid, onCancelled, }: LaunchPaymentModalArgs): {
    setPaid: (sendPaymentResponse: SendPaymentResponse) => void;
};
/**
 * Programmatically close the modal
 */
export declare function closeModal(): void;
/**
 * Programmatically disconnect from a user's wallet and remove saved configuration
 */
export declare function disconnect(): void;
/**
 * @returns the configuration of the current connector (if connected)
 */
export declare function getConnectorConfig(): import("./types/ConnectorConfig").ConnectorConfig | undefined;
export {};
