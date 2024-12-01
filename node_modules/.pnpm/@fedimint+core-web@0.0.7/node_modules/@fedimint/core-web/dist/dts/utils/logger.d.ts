declare const logLevels: readonly ["debug", "info", "warn", "error", "none"];
export type LogLevel = (typeof logLevels)[number];
export declare class Logger {
    private level;
    constructor(level?: LogLevel);
    setLevel(level: LogLevel): void;
    coerceLevel(level: string): LogLevel;
    log(level: string, message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    private shouldLog;
}
export declare const logger: Logger;
export {};
//# sourceMappingURL=logger.d.ts.map