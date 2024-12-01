let wasm;
export function __wbg_set_wasm(val) {
    wasm = val;
}


const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

const lTextDecoder = typeof TextDecoder === 'undefined' ? (0, module.require)('util').TextDecoder : TextDecoder;

let cachedTextDecoder = new lTextDecoder('utf-8', { ignoreBOM: true, fatal: true });

cachedTextDecoder.decode();

let cachedUint8Memory0 = null;

function getUint8Memory0() {
    if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
        cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8Memory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

let WASM_VECTOR_LEN = 0;

const lTextEncoder = typeof TextEncoder === 'undefined' ? (0, module.require)('util').TextEncoder : TextEncoder;

let cachedTextEncoder = new lTextEncoder('utf-8');

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
        return cachedTextEncoder.encodeInto(arg, view);
    }
    : function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    });

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8Memory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8Memory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

let cachedInt32Memory0 = null;

function getInt32Memory0() {
    if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
        cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
    }
    return cachedInt32Memory0;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for (let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => { }, unregister: () => { } }
    : new FinalizationRegistry(state => {
        wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b)
    });

function makeMutClosure(arg0, arg1, dtor, f) {
    const state = { a: arg0, b: arg1, cnt: 1, dtor };
    const real = (...args) => {
        // First up with a closure we increment the internal reference
        // count. This ensures that the Rust closure environment won't
        // be deallocated while we're invoking it.
        state.cnt++;
        const a = state.a;
        state.a = 0;
        try {
            return f(a, state.b, ...args);
        } finally {
            if (--state.cnt === 0) {
                wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
                CLOSURE_DTORS.unregister(state);
            } else {
                state.a = a;
            }
        }
    };
    real.original = state;
    CLOSURE_DTORS.register(real, state, state);
    return real;
}
function __wbg_adapter_32(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h74ee0aa9d6796e45(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_37(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h2e3953a051ad83d9(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_40(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h85c0db7d59d21d18(arg0, arg1);
}

function __wbg_adapter_47(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hb0eaa26544d2f671(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_50(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h092019f160f24b1a(arg0, arg1);
}

function __wbg_adapter_53(arg0, arg1, arg2) {
    wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hc9bf91ffddedbea9(arg0, arg1, addHeapObject(arg2));
}

function __wbg_adapter_56(arg0, arg1) {
    wasm._dyn_core__ops__function__FnMut_____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__hfc40bf9b854f8274(arg0, arg1);
}

let stack_pointer = 128;

function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack');
    heap[--stack_pointer] = obj;
    return stack_pointer;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_exn_store(addHeapObject(e));
    }
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8Memory0().subarray(ptr / 1, ptr / 1 + len);
}
function __wbg_adapter_289(arg0, arg1, arg2, arg3) {
    wasm.wasm_bindgen__convert__closures__invoke2_mut__h10235f6a9066484b(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}

const RpcHandleFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => { }, unregister: () => { } }
    : new FinalizationRegistry(ptr => wasm.__wbg_rpchandle_free(ptr >>> 0));
/**
*/
export class RpcHandle {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RpcHandle.prototype);
        obj.__wbg_ptr = ptr;
        RpcHandleFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RpcHandleFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_rpchandle_free(ptr);
    }
    /**
    */
    cancel() {
        wasm.rpchandle_cancel(this.__wbg_ptr);
    }
}

const WasmClientFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => { }, unregister: () => { } }
    : new FinalizationRegistry(ptr => wasm.__wbg_wasmclient_free(ptr >>> 0));
/**
*/
export class WasmClient {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(WasmClient.prototype);
        obj.__wbg_ptr = ptr;
        WasmClientFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        WasmClientFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_wasmclient_free(ptr);
    }
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
    static open(client_name) {
        const ptr0 = passStringToWasm0(client_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ret = wasm.wasmclient_open(ptr0, len0);
        return takeObject(ret);
    }
    /**
    * Open a fedimint client by join a federation.
    * @param {string} client_name
    * @param {string} invite_code
    * @returns {Promise<WasmClient>}
    */
    static join_federation(client_name, invite_code) {
        const ptr0 = passStringToWasm0(client_name, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(invite_code, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.wasmclient_join_federation(ptr0, len0, ptr1, len1);
        return takeObject(ret);
    }
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
    rpc(module, method, payload, cb) {
        try {
            const ptr0 = passStringToWasm0(module, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len0 = WASM_VECTOR_LEN;
            const ptr1 = passStringToWasm0(method, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            const ptr2 = passStringToWasm0(payload, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len2 = WASM_VECTOR_LEN;
            const ret = wasm.wasmclient_rpc(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, addBorrowedObject(cb));
            return RpcHandle.__wrap(ret);
        } finally {
            heap[stack_pointer++] = undefined;
        }
    }
}

export function __wbg_wasmclient_new(arg0) {
    const ret = WasmClient.__wrap(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_object_drop_ref(arg0) {
    takeObject(arg0);
};

export function __wbindgen_cb_drop(arg0) {
    const obj = takeObject(arg0).original;
    if (obj.cnt-- == 1) {
        obj.a = 0;
        return true;
    }
    const ret = false;
    return ret;
};

export function __wbindgen_string_new(arg0, arg1) {
    const ret = getStringFromWasm0(arg0, arg1);
    return addHeapObject(ret);
};

export function __wbindgen_error_new(arg0, arg1) {
    const ret = new Error(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbindgen_object_clone_ref(arg0) {
    const ret = getObject(arg0);
    return addHeapObject(ret);
};

export function __wbindgen_string_get(arg0, arg1) {
    const obj = getObject(arg1);
    const ret = typeof (obj) === 'string' ? obj : undefined;
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_fetch_f8d735ba6fe1b719(arg0) {
    const ret = fetch(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbindgen_is_string(arg0) {
    const ret = typeof (getObject(arg0)) === 'string';
    return ret;
};

export function __wbindgen_is_null(arg0) {
    const ret = getObject(arg0) === null;
    return ret;
};

export function __wbindgen_is_undefined(arg0) {
    const ret = getObject(arg0) === undefined;
    return ret;
};

export function __wbg_fetch_693453ca3f88c055(arg0, arg1) {
    const ret = getObject(arg0).fetch(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_data_ba3ea616b5392abf(arg0) {
    const ret = getObject(arg0).data;
    return addHeapObject(ret);
};

export function __wbg_signal_3c701f5f40a5f08d(arg0) {
    const ret = getObject(arg0).signal;
    return addHeapObject(ret);
};

export function __wbg_new_0ae46f44b7485bb2() {
    return handleError(function () {
        const ret = new AbortController();
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_abort_2c4fb490d878d2b2(arg0) {
    getObject(arg0).abort();
};

export function __wbg_instanceof_Response_4c3b1446206114d1(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Response;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_url_83a6a4f65f7a2b38(arg0, arg1) {
    const ret = getObject(arg1).url;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_status_d6d47ad2837621eb(arg0) {
    const ret = getObject(arg0).status;
    return ret;
};

export function __wbg_headers_24def508a7518df9(arg0) {
    const ret = getObject(arg0).headers;
    return addHeapObject(ret);
};

export function __wbg_arrayBuffer_5b2688e3dd873fed() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).arrayBuffer();
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_text_668782292b0bc561() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).text();
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_length_acb2c4bcbfef2f1a(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_get_f31a9f341421cffd(arg0, arg1, arg2) {
    const ret = getObject(arg1)[arg2 >>> 0];
    var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    var len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_target_52ddf6955f636bf5(arg0) {
    const ret = getObject(arg0).target;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_key_f5b181c13a2893c4() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).key;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_request_094c06a17783366f(arg0) {
    const ret = getObject(arg0).request;
    return addHeapObject(ret);
};

export function __wbg_advance_4a9fc46f41566dd7() {
    return handleError(function (arg0, arg1) {
        getObject(arg0).advance(arg1 >>> 0);
    }, arguments)
};

export function __wbg_continue_ff6b09291a37ea4f() {
    return handleError(function (arg0) {
        getObject(arg0).continue();
    }, arguments)
};

export function __wbg_continue_decd9c152c20112f() {
    return handleError(function (arg0, arg1) {
        getObject(arg0).continue(getObject(arg1));
    }, arguments)
};

export function __wbg_instanceof_IdbCursorWithValue_ff14a4e199ee5ff8(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBCursorWithValue;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_value_818a84b71c8d6a92() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).value;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_instanceof_IdbRequest_e453a203913b1f6b(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBRequest;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_result_915d75a0bb0397a1() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).result;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_error_a093a4b69c2260a3() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).error;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    }, arguments)
};

export function __wbg_transaction_fe8e1f87ae7ea4cc(arg0) {
    const ret = getObject(arg0).transaction;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_setonsuccess_a04d5d5a703ed886(arg0, arg1) {
    getObject(arg0).onsuccess = getObject(arg1);
};

export function __wbg_setonerror_80c9bac4e4864adf(arg0, arg1) {
    getObject(arg0).onerror = getObject(arg1);
};

export function __wbg_readyState_c8f9a5deaec3bb41(arg0) {
    const ret = getObject(arg0).readyState;
    return ret;
};

export function __wbg_setbinaryType_68fc3c6feda7310c(arg0, arg1) {
    getObject(arg0).binaryType = takeObject(arg1);
};

export function __wbg_new_2575c598b4006174() {
    return handleError(function (arg0, arg1) {
        const ret = new WebSocket(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_close_328b8b803521cbdd() {
    return handleError(function (arg0) {
        getObject(arg0).close();
    }, arguments)
};

export function __wbg_send_5bf3f962e9ffe0f6() {
    return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getStringFromWasm0(arg1, arg2));
    }, arguments)
};

export function __wbg_send_2ba7d32fcb03b9a4() {
    return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).send(getArrayU8FromWasm0(arg1, arg2));
    }, arguments)
};

export function __wbg_addEventListener_9bf60ea8a362e5e4() {
    return handleError(function (arg0, arg1, arg2, arg3) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
    }, arguments)
};

export function __wbg_addEventListener_374cbfd2bbc19ccf() {
    return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).addEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
    }, arguments)
};

export function __wbg_dispatchEvent_40c3472e9e4dcf5e() {
    return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).dispatchEvent(getObject(arg1));
        return ret;
    }, arguments)
};

export function __wbg_removeEventListener_66ee1536a0b32c11() {
    return handleError(function (arg0, arg1, arg2, arg3) {
        getObject(arg0).removeEventListener(getStringFromWasm0(arg1, arg2), getObject(arg3));
    }, arguments)
};

export function __wbindgen_number_new(arg0) {
    const ret = arg0;
    return addHeapObject(ret);
};

export function __wbg_wasClean_1efd9561c5671b45(arg0) {
    const ret = getObject(arg0).wasClean;
    return ret;
};

export function __wbg_code_72a380a2ce61a242(arg0) {
    const ret = getObject(arg0).code;
    return ret;
};

export function __wbg_reason_ad453a16ee68a1b9(arg0, arg1) {
    const ret = getObject(arg1).reason;
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbg_newwitheventinitdict_744eb6eb61245b7c() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = new CloseEvent(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_new_7a20246daa6eec7e() {
    return handleError(function () {
        const ret = new Headers();
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_append_aa3f462f9e2b5ff2() {
    return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        getObject(arg0).append(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
    }, arguments)
};

export function __wbg_keyPath_402007c31586a879() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).keyPath;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_multiEntry_808850c0f5d4b204(arg0) {
    const ret = getObject(arg0).multiEntry;
    return ret;
};

export function __wbg_unique_6191479ea10c2439(arg0) {
    const ret = getObject(arg0).unique;
    return ret;
};

export function __wbg_indexNames_cd26d0c4a3e2e6d3(arg0) {
    const ret = getObject(arg0).indexNames;
    return addHeapObject(ret);
};

export function __wbg_createIndex_e1a9dfc378a45abb() {
    return handleError(function (arg0, arg1, arg2, arg3, arg4) {
        const ret = getObject(arg0).createIndex(getStringFromWasm0(arg1, arg2), getObject(arg3), getObject(arg4));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_delete_e8e3bfaf1ea215be() {
    return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).delete(getObject(arg1));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_deleteIndex_fdc764ebf52d4c6e() {
    return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).deleteIndex(getStringFromWasm0(arg1, arg2));
    }, arguments)
};

export function __wbg_index_e7603c51b9a919eb() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).index(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_openCursor_218846b7f56f5d54() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).openCursor();
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_openCursor_31878cfe72aac75c() {
    return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).openCursor(getObject(arg1));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_openCursor_028e15e1e8bc1d13() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).openCursor(getObject(arg1), takeObject(arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_put_23b163c3aeb63c96() {
    return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).put(getObject(arg1));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_put_f50a8dd6e4a8a13a() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).put(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_instanceof_IdbFactory_32ca5b61b481d0d4(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBFactory;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_open_65e0826fa9c7929c() {
    return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2), arg3 >>> 0);
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_open_7cc5c5a15ff86a65() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).open(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_instanceof_IdbOpenDbRequest_12d009f35ef32f6b(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBOpenDBRequest;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_setonupgradeneeded_73793bc200a4f7b8(arg0, arg1) {
    getObject(arg0).onupgradeneeded = getObject(arg1);
};

export function __wbg_instanceof_IdbTransaction_10df3bef3829e0dc(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBTransaction;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_error_2d8a3e284956924b(arg0) {
    const ret = getObject(arg0).error;
    return isLikeNone(ret) ? 0 : addHeapObject(ret);
};

export function __wbg_setonabort_568145f0fa09b9be(arg0, arg1) {
    getObject(arg0).onabort = getObject(arg1);
};

export function __wbg_setoncomplete_e9993a45b7bfaec4(arg0, arg1) {
    getObject(arg0).oncomplete = getObject(arg1);
};

export function __wbg_setonerror_d17408c3482b10eb(arg0, arg1) {
    getObject(arg0).onerror = getObject(arg1);
};

export function __wbg_abort_7691b818613905b3() {
    return handleError(function (arg0) {
        getObject(arg0).abort();
    }, arguments)
};

export function __wbg_commit_07f92304c2c4ba17() {
    return handleError(function (arg0) {
        getObject(arg0).commit();
    }, arguments)
};

export function __wbg_objectStore_b0e52dee7e737df7() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).objectStore(getStringFromWasm0(arg1, arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_instanceof_IdbDatabase_66fc433c8d02b0ee(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof IDBDatabase;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_objectStoreNames_71c3096b04c76bcd(arg0) {
    const ret = getObject(arg0).objectStoreNames;
    return addHeapObject(ret);
};

export function __wbg_setonversionchange_141a13607ed5b1bb(arg0, arg1) {
    getObject(arg0).onversionchange = getObject(arg1);
};

export function __wbg_close_9830b4b2c785845c(arg0) {
    getObject(arg0).close();
};

export function __wbg_createObjectStore_45c05e7be9907fde() {
    return handleError(function (arg0, arg1, arg2, arg3) {
        const ret = getObject(arg0).createObjectStore(getStringFromWasm0(arg1, arg2), getObject(arg3));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_deleteObjectStore_517effefcf018434() {
    return handleError(function (arg0, arg1, arg2) {
        getObject(arg0).deleteObjectStore(getStringFromWasm0(arg1, arg2));
    }, arguments)
};

export function __wbg_transaction_632c349fd48458fb() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).transaction(getObject(arg1), takeObject(arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_newwithstrandinit_f581dff0d19a8b03() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_clearTimeout_541ac0980ffcef74(arg0) {
    const ret = clearTimeout(takeObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_7d81d052875b0f4f() {
    return handleError(function (arg0, arg1) {
        const ret = setTimeout(getObject(arg0), arg1);
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_queueMicrotask_481971b0d87f3dd4(arg0) {
    queueMicrotask(getObject(arg0));
};

export function __wbg_queueMicrotask_3cbae2ec6b6cd3d6(arg0) {
    const ret = getObject(arg0).queueMicrotask;
    return addHeapObject(ret);
};

export function __wbindgen_is_function(arg0) {
    const ret = typeof (getObject(arg0)) === 'function';
    return ret;
};

export function __wbg_clearTimeout_76877dbc010e786d(arg0) {
    const ret = clearTimeout(takeObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_setTimeout_75cb9b6991a4031d() {
    return handleError(function (arg0, arg1) {
        const ret = setTimeout(getObject(arg0), arg1);
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_crypto_1d1f22824a6a080c(arg0) {
    const ret = getObject(arg0).crypto;
    return addHeapObject(ret);
};

export function __wbindgen_is_object(arg0) {
    const val = getObject(arg0);
    const ret = typeof (val) === 'object' && val !== null;
    return ret;
};

export function __wbg_process_4a72847cc503995b(arg0) {
    const ret = getObject(arg0).process;
    return addHeapObject(ret);
};

export function __wbg_versions_f686565e586dd935(arg0) {
    const ret = getObject(arg0).versions;
    return addHeapObject(ret);
};

export function __wbg_node_104a2ff8d6ea03a2(arg0) {
    const ret = getObject(arg0).node;
    return addHeapObject(ret);
};

export function __wbg_require_cca90b1a94a0255b() {
    return handleError(function () {
        const ret = module.require;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_msCrypto_eb05e62b530a1508(arg0) {
    const ret = getObject(arg0).msCrypto;
    return addHeapObject(ret);
};

export function __wbg_randomFillSync_5c9c955aa56b6049() {
    return handleError(function (arg0, arg1) {
        getObject(arg0).randomFillSync(takeObject(arg1));
    }, arguments)
};

export function __wbg_getRandomValues_3aa56aa6edec874c() {
    return handleError(function (arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments)
};

export function __wbg_get_bd8e338fbd5f5cc8(arg0, arg1) {
    const ret = getObject(arg0)[arg1 >>> 0];
    return addHeapObject(ret);
};

export function __wbg_length_cd7af8117672b8b8(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_new_16b304a2cfa7ff4a() {
    const ret = new Array();
    return addHeapObject(ret);
};

export function __wbg_newnoargs_e258087cd0daa0ea(arg0, arg1) {
    const ret = new Function(getStringFromWasm0(arg0, arg1));
    return addHeapObject(ret);
};

export function __wbg_next_40fc327bfc8770e6(arg0) {
    const ret = getObject(arg0).next;
    return addHeapObject(ret);
};

export function __wbg_next_196c84450b364254() {
    return handleError(function (arg0) {
        const ret = getObject(arg0).next();
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_done_298b57d23c0fc80c(arg0) {
    const ret = getObject(arg0).done;
    return ret;
};

export function __wbg_value_d93c65011f51a456(arg0) {
    const ret = getObject(arg0).value;
    return addHeapObject(ret);
};

export function __wbg_iterator_2cee6dadfd956dfa() {
    const ret = Symbol.iterator;
    return addHeapObject(ret);
};

export function __wbg_get_e3c254076557e348() {
    return handleError(function (arg0, arg1) {
        const ret = Reflect.get(getObject(arg0), getObject(arg1));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_call_27c0f87801dedf93() {
    return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_new_72fb9a18b5ae2624() {
    const ret = new Object();
    return addHeapObject(ret);
};

export function __wbg_self_ce0dbfc45cf2f5be() {
    return handleError(function () {
        const ret = self.self;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_window_c6fb939a7f436783() {
    return handleError(function () {
        const ret = window.window;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_globalThis_d1e6af4856ba331b() {
    return handleError(function () {
        const ret = globalThis.globalThis;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_global_207b558942527489() {
    return handleError(function () {
        const ret = global.global;
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_isArray_2ab64d95e09ea0ae(arg0) {
    const ret = Array.isArray(getObject(arg0));
    return ret;
};

export function __wbg_push_a5b05aedc7234f9f(arg0, arg1) {
    const ret = getObject(arg0).push(getObject(arg1));
    return ret;
};

export function __wbg_instanceof_ArrayBuffer_836825be07d4c9d2(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof ArrayBuffer;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_instanceof_Error_e20bb56fd5591a93(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Error;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_message_5bf28016c2b49cfb(arg0) {
    const ret = getObject(arg0).message;
    return addHeapObject(ret);
};

export function __wbg_name_e7429f0dda6079e2(arg0) {
    const ret = getObject(arg0).name;
    return addHeapObject(ret);
};

export function __wbg_toString_ffe4c9ea3b3532e9(arg0) {
    const ret = getObject(arg0).toString();
    return addHeapObject(ret);
};

export function __wbg_call_b3ca7c6051f9bec1() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbg_getTime_2bc4375165f02d15(arg0) {
    const ret = getObject(arg0).getTime();
    return ret;
};

export function __wbg_new0_7d84e5b2cd9fdc73() {
    const ret = new Date();
    return addHeapObject(ret);
};

export function __wbg_new_81740750da40724f(arg0, arg1) {
    try {
        var state0 = { a: arg0, b: arg1 };
        var cb0 = (arg0, arg1) => {
            const a = state0.a;
            state0.a = 0;
            try {
                return __wbg_adapter_289(a, state0.b, arg0, arg1);
            } finally {
                state0.a = a;
            }
        };
        const ret = new Promise(cb0);
        return addHeapObject(ret);
    } finally {
        state0.a = state0.b = 0;
    }
};

export function __wbg_resolve_b0083a7967828ec8(arg0) {
    const ret = Promise.resolve(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_then_0c86a60e8fcfe9f6(arg0, arg1) {
    const ret = getObject(arg0).then(getObject(arg1));
    return addHeapObject(ret);
};

export function __wbg_then_a73caa9a87991566(arg0, arg1, arg2) {
    const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
};

export function __wbg_buffer_12d079cc21e14bdb(arg0) {
    const ret = getObject(arg0).buffer;
    return addHeapObject(ret);
};

export function __wbg_newwithbyteoffsetandlength_aa4a17c33a06e5cb(arg0, arg1, arg2) {
    const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_new_63b92bc8671ed464(arg0) {
    const ret = new Uint8Array(getObject(arg0));
    return addHeapObject(ret);
};

export function __wbg_set_a47bac70306a19a7(arg0, arg1, arg2) {
    getObject(arg0).set(getObject(arg1), arg2 >>> 0);
};

export function __wbg_length_c20a40f15020d68a(arg0) {
    const ret = getObject(arg0).length;
    return ret;
};

export function __wbg_instanceof_Uint8Array_2b3bbecd033d19f6(arg0) {
    let result;
    try {
        result = getObject(arg0) instanceof Uint8Array;
    } catch (_) {
        result = false;
    }
    const ret = result;
    return ret;
};

export function __wbg_newwithlength_e9b4878cebadb3d3(arg0) {
    const ret = new Uint8Array(arg0 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_subarray_a1f73cd4b5b42fe1(arg0, arg1, arg2) {
    const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
    return addHeapObject(ret);
};

export function __wbg_has_0af94d20077affa2() {
    return handleError(function (arg0, arg1) {
        const ret = Reflect.has(getObject(arg0), getObject(arg1));
        return ret;
    }, arguments)
};

export function __wbg_set_1f9b04f170055d33() {
    return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments)
};

export function __wbg_stringify_8887fe74e1c50d81() {
    return handleError(function (arg0) {
        const ret = JSON.stringify(getObject(arg0));
        return addHeapObject(ret);
    }, arguments)
};

export function __wbindgen_debug_string(arg0, arg1) {
    const ret = debugString(getObject(arg1));
    const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    getInt32Memory0()[arg0 / 4 + 1] = len1;
    getInt32Memory0()[arg0 / 4 + 0] = ptr1;
};

export function __wbindgen_throw(arg0, arg1) {
    throw new Error(getStringFromWasm0(arg0, arg1));
};

export function __wbindgen_memory() {
    const ret = wasm.memory;
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2205(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1241, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper2207(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 1241, __wbg_adapter_32);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper12250(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6135, __wbg_adapter_37);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper12252(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6135, __wbg_adapter_40);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper12254(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6135, __wbg_adapter_37);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper12256(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6135, __wbg_adapter_37);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper12341(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6170, __wbg_adapter_47);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper13652(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6588, __wbg_adapter_50);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper14356(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6756, __wbg_adapter_53);
    return addHeapObject(ret);
};

export function __wbindgen_closure_wrapper14402(arg0, arg1, arg2) {
    const ret = makeMutClosure(arg0, arg1, 6777, __wbg_adapter_56);
    return addHeapObject(ret);
};

