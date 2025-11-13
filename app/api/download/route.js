import ytdl from '@distube/ytdl-core'

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

    const contentType = format.hasVideo ? 'video/mp4' : 'audio/mpeg'
    const extension = format.hasVideo ? 'mp4' : 'mp3'
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

    return new Response(readableStream, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error downloading video:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to download. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
