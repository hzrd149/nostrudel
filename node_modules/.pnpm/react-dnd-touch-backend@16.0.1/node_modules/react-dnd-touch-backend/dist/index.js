import { TouchBackendImpl } from './TouchBackendImpl.js';
export * from './interfaces.js';
export * from './TouchBackendImpl.js';
export const TouchBackend = function createBackend(manager, context = {}, options = {}) {
    return new TouchBackendImpl(manager, context, options);
};

//# sourceMappingURL=index.js.map