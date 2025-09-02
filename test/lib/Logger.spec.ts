import { expect } from "chai"
import { Logger, LogLevel, MemoryLogger } from "../../src/lib/Logger";

function ComponentA() {
}

/**
 * Log's in a browser is usually only something a developer looks at.
 * 
 * We might want to send warnings and error to the backend, but at the
 * moment that's in the future.
 * 
 * Current scope is to assist in debugging, especially when running tests.
 * 
 * So when running tests, we may increase the log level of the unit under
 * test to get some insights on what the heck it thinks it's doin'. And we
 * want that output remain in the code.
 * 
 * NOTE: In the browser log, each log level get's it's own icon and error also
 * has a stack trace with it.
 * 
 * Implementation is based on 
 * https://github.com/markandre13/corba.cc/blob/026721f91dfdf76797eb0f57e2fe2de8cbd89a29/src/corba/util/logger.hh
 * 
 */
describe("Logger", () => {
    it("log level WARN is the default and logs only ERROR and WARN", () => {
        const logger = Logger.get(ComponentA)
        const memory = new MemoryLogger()
        logger.setDestination(memory)
        logger.error("error conditions")
        logger.warn("warning conditions")
        logger.info("informational")
        logger.debug("debug-level messages")

        // memory.dump()

        expect(memory.logs).to.have.lengthOf(2)
        expect(memory.logs[0].level).to.equal(LogLevel.ERROR)
        expect(memory.logs[1].level).to.equal(LogLevel.WARN)
    })
    it("log level DEBUG logs all", () => {
        const logger = Logger.get(ComponentA)
        logger.setLogLevel(LogLevel.DEBUG)
        const memory = new MemoryLogger()
        logger.setDestination(memory)
        logger.error("error conditions")
        logger.warn("warning conditions")
        logger.info("informational")
        logger.debug("debug-level messages")

        // memory.dump()

        expect(memory.logs).to.have.lengthOf(4)
        expect(memory.logs[0].level).to.equal(LogLevel.ERROR)
        expect(memory.logs[0].message).to.equal("error conditions")

        expect(memory.logs[1].level).to.equal(LogLevel.WARN)
        expect(memory.logs[1].message).to.equal("warning conditions")

        expect(memory.logs[2].level).to.equal(LogLevel.INFO)
        expect(memory.logs[2].message).to.equal("informational")

        expect(memory.logs[3].level).to.equal(LogLevel.DEBUG)
        expect(memory.logs[3].message).to.equal("debug-level messages")
    })
    it("Logger.setLogLevel(id, level)", () => {
        const logger = Logger.get(ComponentA)
        logger.setLogLevel(LogLevel.WARN)
        const memory = new MemoryLogger()
        logger.setDestination(memory)

        logger.debug("before")
        Logger.setLogLevel(ComponentA, LogLevel.DEBUG)
        logger.debug("after")

        expect(memory.logs).to.have.lengthOf(1)
        expect(memory.logs[0].level).to.equal(LogLevel.DEBUG)
        expect(memory.logs[0].message).to.equal("after")
    })
    it("Logger.setDestination(destination)", () => {
        const logger = Logger.get(ComponentA)
        logger.setLogLevel(LogLevel.WARN)

        logger.error("before")
        const memory = new MemoryLogger()
        Logger.setDestination(ComponentA, memory)
        logger.error("after")

        memory.dump()

        expect(memory.logs).to.have.lengthOf(1)
        expect(memory.logs[0].level).to.equal(LogLevel.ERROR)
        expect(memory.logs[0].message).to.equal("after")
    })
})