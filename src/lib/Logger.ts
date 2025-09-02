import { Temporal } from "temporal-polyfill"

export enum LogLevel {
    ERROR = 3,
    WARN = 4,
    INFO = 6,
    DEBUG = 7
}

export abstract class LogDestination {
    abstract log(time: Temporal.ZonedDateTime, level: LogLevel, facility: string, message?: any, ...optionalParams: any[]): void
}

export class SysLogger implements LogDestination {
    private static _singleton: SysLogger | undefined
    static get() {
        if (this._singleton === undefined) {
            this._singleton = new SysLogger()
        }
        return this._singleton
    }
    log(time: Temporal.ZonedDateTime, level: LogLevel, facility: string, message?: any, ...optionalParams: any[]): void {
        const x = new Error().stack?.split('\n')[3].split('/')!
        facility = x[x.length-1]
        switch (level) {
            case LogLevel.ERROR:
                console.error(`${time.toJSON()} ${LogLevel[level]} [${facility}] ${message}`, ...optionalParams)
                break
            case LogLevel.WARN:
                console.warn(`${time.toJSON()} ${LogLevel[level]} [${facility}] ${message}`, ...optionalParams)
                break
            case LogLevel.INFO:
                console.info(`${time.toJSON()} ${LogLevel[level]} [${facility}] ${message}`, ...optionalParams)
                break
            case LogLevel.DEBUG:
                console.debug(`${time.toJSON()} ${LogLevel[level]} [${facility}] ${message}`, ...optionalParams)
                break
        }
    }
}

export interface LogEntry {
    time: Temporal.ZonedDateTime,
    level: LogLevel
    facility: string
    message?: any
    optionalParams: any[]
}

export class MemoryLogger implements LogDestination {
    readonly logs: LogEntry[] = []
    log(time: Temporal.ZonedDateTime, level: LogLevel, facility: string, message?: any, ...optionalParams: any[]): void {
        this.logs.push({ time, level, facility, message, optionalParams })
    }
    dump() {
        const logger = SysLogger.get()
        for (const log of this.logs) {
            logger.log(log.time, log.level, log.facility, log.message, ...log.optionalParams)
        }
    }
}

export class Logger {
    private static allLoggers = new Map<Function, Logger>()

    private maxLevel: LogLevel
    private facility: string
    private destination: LogDestination = SysLogger.get()

    private constructor(id: Function, maxLevel: LogLevel) {
        this.maxLevel = maxLevel
        this.facility = id.name
        Logger.allLoggers.set(id, this)
    }

    public static get(id: Function, maxLevel: LogLevel = LogLevel.WARN): Logger {
        let logger = Logger.allLoggers.get(id)
        if (logger !== undefined) {
            return logger
        }
        logger = new Logger(id, maxLevel)
        Logger.allLoggers.set(id, logger)
        return logger
    }
    static setLogLevel(id: Function, level: LogLevel): void {
        Logger.get(id).setLogLevel(level)
    }
    static setDestination(id: Function, destination: LogDestination): void {
        Logger.get(id).setDestination(destination)
    }
    setLogLevel(level: LogLevel): void {
        this.maxLevel = level
    }
    setDestination(destination: LogDestination) {
        this.destination = destination
    }

    error(message?: any, ...optionalParams: any[]): void {
        this.log(Temporal.Now.zonedDateTimeISO(), LogLevel.ERROR, message, ...optionalParams)
    }
    warn(message?: any, ...optionalParams: any[]): void {
        this.log(Temporal.Now.zonedDateTimeISO(), LogLevel.WARN, message, ...optionalParams)
    }
    info(message?: any, ...optionalParams: any[]): void {
        this.log(Temporal.Now.zonedDateTimeISO(), LogLevel.INFO, message, ...optionalParams)
    }
    debug(message?: any, ...optionalParams: any[]): void {
        this.log(Temporal.Now.zonedDateTimeISO(), LogLevel.DEBUG, message, ...optionalParams)
    }
    private log(time: Temporal.ZonedDateTime, level: LogLevel, message?: any, ...optionalParams: any[]): void {
        if (level > this.maxLevel) {
            return
        }
        this.destination.log(time, level, this.facility, message, ...optionalParams)
    }
}
