// lib/server/apiAdapter.js
// Adapts a Next.js Request to the Express app mounted in server/app.js, so the
// existing API handlers keep their exact request/response semantics.

import { Readable } from 'node:stream'
import app from '../../server/app.js'

function toHeaderObject(headers) {
    const result = {}
    headers.forEach((value, key) => {
        result[key.toLowerCase()] = value
    })
    return result
}

function clientIp(request, headers) {
    const forwarded = headers['x-forwarded-for']
    if (forwarded) return forwarded.split(',')[0].trim()
    if (headers['x-real-ip']) return headers['x-real-ip']
    if (request.ip) return request.ip
    return '127.0.0.1'
}

export async function handleApiRequest(request) {
    const url = new URL(request.url)
    const headers = toHeaderObject(request.headers)

    const bodyBuffer = Buffer.from(await request.arrayBuffer())
    const contentType = String(headers['content-type'] || '')
        .split(';')[0]
        .trim()
        .toLowerCase()

    // Parse the body once and mark it as parsed so express.json()/express.raw()
    // do not try to consume the (already-buffered) request stream again.
    let parsedBody
    let hasBody = bodyBuffer.length > 0
    if (hasBody) {
        if (contentType === 'application/json' || contentType.endsWith('+json')) {
            const MAX_JSON_BYTES = 100 * 1024
            if (bodyBuffer.length > MAX_JSON_BYTES) {
                return Response.json({ error: 'Request body is too large.' }, { status: 413 })
            }
            try {
                parsedBody = JSON.parse(bodyBuffer.toString('utf8'))
            } catch {
                return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
            }
        } else if (contentType === 'application/octet-stream') {
            // The adapter pre-parses the body, which bypasses express.raw()'s
            // own limit, so enforce the route's limit here.
            const isAvatarUpload = /^\/api\/users\/me\/avatar(?:\?|$)/.test(url.pathname)
            const MAX_UPLOAD_BYTES = isAvatarUpload ? 5 * 1024 * 1024 : 25 * 1024 * 1024
            if (bodyBuffer.length > MAX_UPLOAD_BYTES) {
                return Response.json(
                    { error: isAvatarUpload ? 'Avatar must be 5 MB or smaller.' : 'Attachment must be 25 MB or smaller.' },
                    { status: 413 }
                )
            }
            parsedBody = bodyBuffer
        } else {
            parsedBody = bodyBuffer.toString('utf8')
        }
    }

    headers['content-length'] = String(bodyBuffer.length)

    const ip = clientIp(request, headers)

    // A real Readable lets express.json()/express.raw() consume the body.
    const req = Readable.from(bodyBuffer)
    req.method = request.method
    req.url = `${url.pathname}${url.search}`
    req.originalUrl = req.url
    req.baseUrl = ''
    req.headers = headers
    req.httpVersion = '1.1'
    req.httpVersionMajor = 1
    req.httpVersionMinor = 1
    req.complete = true
    req.aborted = false
    req.socket = {
        remoteAddress: ip,
        remotePort: 0,
        encrypted: url.protocol === 'https:',
    }
    req.connection = req.socket
    req.ip = ip
    req.ips = []
    req.protocol = url.protocol.replace(':', '')
    req.secure = req.protocol === 'https'
    req.hostname = (headers.host || 'localhost').split(':')[0]
    req.query = {}

    for (const [key, value] of url.searchParams) {
        if (key in req.query) {
            const existing = req.query[key]
            req.query[key] = Array.isArray(existing) ? [...existing, value] : [existing, value]
        } else {
            req.query[key] = value
        }
    }

    req.params = {}
    req.get = (name) => headers[String(name).toLowerCase()]
    req.header = req.get
    req.cookies = {}
    req.body = parsedBody
    req._body = hasBody

    const responseHeaders = new Headers()
    let settled = false
    let resolveResponse
    const responsePromise = new Promise((resolve) => {
        resolveResponse = resolve
    })

    const res = {
        statusCode: 200,

        setHeader(name, value) {
            if (value === undefined) return
            if (Array.isArray(value)) {
                for (const item of value) responseHeaders.append(name, String(item))
            } else {
                responseHeaders.set(name, String(value))
            }
        },

        getHeader(name) {
            return responseHeaders.get(name)
        },

        removeHeader(name) {
            responseHeaders.delete(name)
        },

        set(name, value) {
            if (name && typeof name === 'object') {
                for (const [key, item] of Object.entries(name)) res.setHeader(key, item)
            } else {
                res.setHeader(name, value)
            }
            return res
        },

        header(name, value) {
            return res.set(name, value)
        },

        status(code) {
            res.statusCode = code
            return res
        },

        sendStatus(code) {
            res.status(code)
            return res.send(String(code))
        },

        json(payload) {
            const body = JSON.stringify(payload ?? null)
            if (!responseHeaders.has('content-type')) {
                responseHeaders.set('content-type', 'application/json; charset=utf-8')
            }
            responseHeaders.set('content-length', String(Buffer.byteLength(body)))
            finish(body)
            return res
        },

        send(payload) {
            if (payload === undefined || payload === null) {
                finish(null)
                return res
            }
            if (Buffer.isBuffer(payload) || payload instanceof Uint8Array) {
                const buffer = Buffer.from(payload)
                if (!responseHeaders.has('content-type')) {
                    responseHeaders.set('content-type', 'application/octet-stream')
                }
                responseHeaders.set('content-length', String(buffer.length))
                finish(buffer)
                return res
            }
            if (typeof payload === 'object') return res.json(payload)
            const body = String(payload)
            if (!responseHeaders.has('content-type')) {
                responseHeaders.set('content-type', 'text/html; charset=utf-8')
            }
            responseHeaders.set('content-length', String(Buffer.byteLength(body)))
            finish(body)
            return res
        },

        end(payload) {
            if (payload === undefined || payload === null) finish(null)
            else if (Buffer.isBuffer(payload) || payload instanceof Uint8Array) finish(Buffer.from(payload))
            else finish(String(payload))
            return res
        },

        write() {
            return true
        },

        writeHead(code, values) {
            res.status(code)
            if (values) res.set(values)
            return res
        },

        on() {
            return res
        },

        once() {
            return res
        },

        emit() {
            return true
        },

        flushHeaders() {},

        get headersSent() {
            return settled
        },
    }

    function finish(payload) {
        if (settled) return
        settled = true
        const status = res.statusCode
        const body = status === 204 || status === 304 ? null : payload
        resolveResponse(new Response(body, { status, headers: responseHeaders }))
    }

    try {
        app.handle(req, res, (err) => {
            if (settled) return
            if (err) {
                console.error('[api]', err)
                res.status(err.status || 500).json({ error: 'Server error.' })
                return
            }
            res.status(404).json({ error: 'Not found.' })
        })
    } catch (err) {
        console.error('[api]', err)
        if (!settled) res.status(500).json({ error: 'Server error.' })
    }

    return responsePromise
}
