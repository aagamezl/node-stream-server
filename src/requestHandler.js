import { IncomingMessage, ServerResponse } from 'http'
import { createReadStream } from 'fs'
import { join } from 'path'
import { readFile, stat } from 'fs/promises'

import { ReasonPhrases, StatusCodes } from 'http-status-codes'

const PATHS = {
  public: 'public',
  videos: 'videos',
}

/**
 * This function manage a HTTP request
 *
 * @param {IncomingMessage} request
 * @param {ServerResponse} response
 */
export const requestHandler = async (request, response) => {
  const { method, url } = request
  const { address, port } = request.socket.server.address()
  const fullEndpoint = `http://${address}:${port}${url}`

  // console.log(url)
  const path = url.split('/')[1]

  switch (path) {
    case '':
      const html = await readFile(join(process.cwd(), PATHS.public, 'index.html'), 'utf8')

      response.setHeader('Content-Type', 'text/html')
      response.statusCode = StatusCodes.OK
      response.write(html)
      response.end()

      break

    case 'video': {
      const videoPath = join(process.cwd(), PATHS.videos, 'BigBuckBunny.mp4')

      const range = request.headers.range
      const properties = await stat(videoPath)
      const videoSize = properties.size
      const chunkSize = 10 ** 6
      const start = Number(range.replace(/\D/g, ''))
      const end = Math.min(start + chunkSize, videoSize - 1)
      const contentLength = end - start + 1

      const headers = {
        'Content-Range': `bytes ${start}-${end}/${videoSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': contentLength,
        'Content-Type': 'video/mp4'
      }

      console.log(`STREAMING VIDEO CHUNK: ${start} - ${end}`)

      response.writeHead(206, headers)

      const stream = createReadStream(videoPath, {
        start,
        end
      })

      stream.pipe(response)

      break
    }
  }
}