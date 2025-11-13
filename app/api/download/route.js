import ytdl from '@distube/ytdl-core'
import { spawn } from 'child_process'

export async function POST(request) {
  try {
    const { url, itag } = await request.json()

    if (!url || !ytdl.validateURL(url)) {
      return new Response(
        JSON.stringify({ error: 'Invalid YouTube URL' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const info = await ytdl.getInfo(url)
    const format = info.formats.find(f => f.itag === itag)

    if (!format) {
      return new Response(
        JSON.stringify({ error: 'Format not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (format.hasAudio && format.hasVideo) {
      const extension = format.container || 'mp4'
      const filename = `${info.videoDetails.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`
      const stream = ytdl(url, { quality: itag })

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(chunk)
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      const contentType = format.mimeType || 'video/mp4'
      return new Response(readableStream, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else if (format.hasVideo && !format.hasAudio) {
      const audioFormat = info.formats
        .filter(f => f.hasAudio && !f.hasVideo)
        .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))[0]

      if (!audioFormat) {
        return new Response(
          JSON.stringify({ error: 'No audio format available' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
      }

      const videoCodec = format.codecs?.toLowerCase() || ''
      const isVP9orAV1 = videoCodec.includes('vp9') || videoCodec.includes('vp09') || 
                         videoCodec.includes('av01') || videoCodec.includes('av1')
      
      const outputFormat = isVP9orAV1 ? 'webm' : 'mp4'
      const filename = `${info.videoDetails.title.replace(/[^a-z0-9]/gi, '_')}.${outputFormat}`

      const videoStream = ytdl(url, { quality: itag })
      const audioStream = ytdl(url, { quality: audioFormat.itag })

      const ffmpegArgs = [
        '-loglevel', '8', '-hide_banner',
        '-i', 'pipe:3',
        '-i', 'pipe:4',
        '-map', '0:v',
        '-map', '1:a',
        '-c:v', 'copy',
        '-c:a', isVP9orAV1 ? 'libopus' : 'aac',
        '-f', outputFormat,
      ]

      if (outputFormat === 'mp4') {
        ffmpegArgs.push('-movflags', 'frag_keyframe+empty_moov')
      }

      ffmpegArgs.push('pipe:1')

      const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
        stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe']
      })

      videoStream.pipe(ffmpeg.stdio[3])
      audioStream.pipe(ffmpeg.stdio[4])

      let hasError = false

      const readableStream = new ReadableStream({
        async start(controller) {
          ffmpeg.stdout.on('data', (chunk) => {
            controller.enqueue(chunk)
          })

          ffmpeg.stdout.on('end', () => {
            if (!hasError) {
              controller.close()
            }
          })

          ffmpeg.on('error', (error) => {
            hasError = true
            console.error('FFmpeg process error:', error)
            controller.error(error)
          })

          ffmpeg.on('exit', (code) => {
            if (code !== 0 && code !== null) {
              hasError = true
              console.error('FFmpeg exited with code:', code)
              controller.error(new Error(`FFmpeg process exited with code ${code}`))
            }
          })

          ffmpeg.stderr.on('data', (data) => {
            console.error('FFmpeg stderr:', data.toString())
          })
        },
      })

      const contentType = isVP9orAV1 ? 'video/webm' : 'video/mp4'
      return new Response(readableStream, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } else if (!format.hasVideo && format.hasAudio) {
      const stream = ytdl(url, { quality: itag })
      const extension = format.container || 'mp3'
      const audioFilename = `${info.videoDetails.title.replace(/[^a-z0-9]/gi, '_')}.${extension}`

      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(chunk)
            }
            controller.close()
          } catch (error) {
            controller.error(error)
          }
        },
      })

      const contentType = format.mimeType || 'audio/mpeg'
      return new Response(readableStream, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${audioFilename}"`,
        },
      })
    }
  } catch (error) {
    console.error('Error downloading video:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to download. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
