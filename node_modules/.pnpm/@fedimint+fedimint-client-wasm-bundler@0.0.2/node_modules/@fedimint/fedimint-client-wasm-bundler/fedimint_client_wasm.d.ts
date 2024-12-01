/* tslint:disable */
/* eslint-disable */
/**
*/
export class RpcHandle {
  free(): void;
/**
*/
  cancel(): void;
}
/**
*/
export class WasmClient {
  free(): void;
/**
* Open fedimint client with already joined federation.
*
* After you have joined a federation, you can reopen the fedimint client
* with same client_name. Opening client with same name at same time is
* not supported. You can close the current client by calling
* `client.free()`. NOTE: The client will remain active until all the
* running rpc calls have finished.
* @param {string} client_name
* @returns {Promise<WasmClient | undefined>}
*/
  static open(client_name: string): Promise<WasmClient | undefined>;
/**
* Open a fedimint client by join a federation.
* @param {string} client_name
* @param {string} invite_code
* @returns {Promise<WasmClient>}
*/
  static join_federation(client_name: string, invite_code: string): Promise<WasmClient>;
/**
* Call a fedimint client rpc the responses are returned using `cb`
* callback. Each rpc call *can* return multiple responses by calling
* `cb` multiple times. The returned RpcHandle can be used to cancel the
* operation.
* @param {string} module
* @param {string} method
* @param {string} payload
* @param {Function} cb
* @returns {RpcHandle}
*/
  rpc(module: string, method: string, payload: string, cb: Function): RpcHandle;
}
