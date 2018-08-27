# smart-fuzz
Fuzz test Hapi APIs based on route validation rules

Example code used in "[Avoiding Common Hurdles in Unit Testing](https://www.nearform.com/blog/avoiding-common-hurdles-in-unit-testing/)." 

## About…

While there are differing opinions on what level of code coverage is desirable and whether there are diminishing returns when moving from say 90% to 100% code coverage, many developers agree that code coverage tests are beneficial.

Just loading your code gets you 60-70% code coverage, so we are really only talking about coverage for that last 30-40%. Using smart fuzzing can boost that starting point a little more towards 100%, with little additional effort on your part.

According to MongoDB, they find many more bugs before they reach production by using smart fuzzing than they do with unit tests (see https://engineering.mongodb.com/post/mongodbs-javascript-fuzzer-creating-chaos). While MongoDB uses an advanced smart fuzzing technique that mutates unit test code, we do not have to go this far to benefit from smart fuzzing. By using Hapi’s built in validation functionality to define what requests and/or responses look like, we not only get the benefit of validation we can also use this information to run smart fuzzing tests.

```javascript
const createServer = async () => {
  const server = Hapi.server({ port: 7357 })

  server.route({
    method: 'GET',
    path: '/{name}/{size}',
    handler: (request) => request.params,
    options: {
      response: {
        sample: 10,
        schema: Joi.object().keys({
          name: Joi.string().min(1).max(10),
          size: Joi.number()
        })
      },
      validate: {
        params: {
          name: Joi.string().min(1).max(10),
          size: Joi.number()
        }
      }
    }
  })

  await server.start()
  console.log('Server running at: ${server.info.uri}')
  return server
}

test('endpoints do not time out and any errors are caught', async () => {
    const testServer = await createServer()
    try {
      await SmartFuzz(testServer)
    }
    finally {
      await testServer.stop()
    }
  })
})
```
