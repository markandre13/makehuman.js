process.env.NODE_ENV = 'test'
const WTRSpecReporter = require('./test/WTRSpecReporter.js')

module.exports = {
    nodeResolve: true,
    plugins: [
    ],
    coverage: false,
    coverageConfig: {},
    reporters: [
        WTRSpecReporter({ reportTestResults: true, reportTestProgress: true }),
    ],
    files: 'build/test/**/*.spec.js'
}
