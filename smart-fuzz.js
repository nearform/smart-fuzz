'use strict'

const Felicity = require('felicity')
const Fetch = require('node-fetch')
const Joi = require('joi')
const QueryString = require('querystring')
const XRegExp = require('xregexp')

const matchPathParameter = (name = '[^}]+') => XRegExp(`
  [{]     # the opening brace of the path parameter
  ${name} # the name of the path parameter (can be a regular expression string)
  [*]?    # the name is optionally followed by an asterisk
  [}]     # the closing brace of the path parameter
`, 'x')

module.exports = async ({ defaultHeaders, server }) => {
  // Hapi 17 returns the array of routes directly, while Hapi 16 has a
  // different structure.
  const routes = server.table()[0].table ? server.table()[0].table : server.table()
  // We're OK with any 2xx, 3xx, 4xx, should not get 5xx.  This is testing that
  // the code runs, and that any errors that might be encountered are
  // appropriately caught, handled, and reflected in the response.  BUT it's
  // important to note the caveat that this may not be exhaustive or cover every
  // or even the normal code path.
  const routeTests = routes.map(async (route) => {
    const { method, path, settings } = route
    const { response, validate } = settings
    const { schema } = response

    const { headers, params, payload, query } = validate

    const validBody = payload ? Felicity.example(payload) : null
    const validHeaders = headers ? Felicity.example(headers) : null
    const validParams = params ? Felicity.example(params) : null
    const validPath = validParams ?
      Object.entries(validParams)
        .reduce((a, b) => a.replace(matchPathParameter(b[0]), b[1]), path)
      : path.replace(matchPathParameter(), 'ajklsdfjklasdf')
    const validQuery = query ? Felicity.example(query) : null
    const validQueryString = validQuery ? `?${QueryString.stringify(validQuery)}` : ''

    const url = `${server.info.uri}${validPath}${validQueryString}`

    const testResponse = await Fetch(url, {
      body: validBody,
      headers: Object.assign({}, validHeaders, defaultHeaders),
      method
    })

    const { size, status } = testResponse

    if (status >= 500) {
      throw new Error(`Fuzz test caused a ${status} response.`)
    }

    // Only validate the body if it is present.
    if (size === 0) {
      return
    }

    // Assume a JSON body for now.
    const responseBody = await response.json()
    const validationResult = Joi.validate(responseBody, schema)

    if (validationResult.error) {
      throw new Error(validationResult.error)
    }
  })

  await Promise.all(routeTests)
}
