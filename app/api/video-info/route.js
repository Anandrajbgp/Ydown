import ytdl from '@distube/ytdl-core'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      )
    }

    const info = await ytdl.getInfo(url)

    const formatDuration = (seconds) => {
      const hrs = Math.floor(seconds / 3600)
      const mins = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      
      if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      }
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const formatViews = (views) => {
      if (views >= 1000000) {
        return `${(views / 1000000).toFixed(1)}M`
      } else if (views >= 1000) {
        return `${(views / 1000).toFixed(1)}K`
      }
      return views.toString()
    }

    const videoFormats = info.formats
      .filter(f => f.hasVideo)
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel || f.quality,
        type: f.container,
        hasVideo: true,
        hasAudio: f.hasAudio,
        container: f.container,
      }))
      .filter((f, i, arr) => 
        arr.findIndex(t => t.quality === f.quality) === i
      )
      .sort((a, b) => {
        const qualityOrder = { '2160p': 7, '1440p': 6, '1080p': 5, '720p': 4, '480p': 3, '360p': 2, '240p': 1, '144p': 0 }
        return (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0)
      })

    const audioFormats = info.formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .map(f => ({
        itag: f.itag,
        quality: f.audioBitrate ? `${f.audioBitrate}kbps` : 'Audio',
        type: f.container,
        hasVideo: false,
        container: f.container,
      }))
      .filter((f, i, arr) => 
        arr.findIndex(t => t.quality === f.quality && t.container === f.container) === i
      )
      .sort((a, b) => {
        const getBitrate = (q) => parseInt(q.replace('kbps', '')) || 0
        return getBitrate(b.quality) - getBitrate(a.quality)
      })

    const videoData = {
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      duration: formatDuration(parseInt(info.videoDetails.lengthSeconds)),
      views: formatViews(parseInt(info.videoDetails.viewCount)),
      videoFormats: videoFormats,
      audioFormats: audioFormats,
    }

    return NextResponse.json(videoData)
  } catch (error) {
    console.error('Error fetching video info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video information. Please check the URL and try again.' },
      { status: 500 }
    )
  }
}
