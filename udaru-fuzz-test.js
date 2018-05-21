const expect = require('code').expect
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const SmartFuzz = require('../../smart-fuzz')
const UdaruServer = require('../lib/server/index')

lab.experiment('routes', () => {
  lab.test('are reachable, do not time out, and any errors are caught', async () => {
    try {
      await UdaruServer.start()
      await SmartFuzz({
        defaultHeaders: {
          authorization: 'ROOTid',
          org: 'WONKA'
        },
        server: UdaruServer
      })
    }
    finally {
      await UdaruServer.stop()
    }
  })
})
