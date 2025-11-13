'use client'

import { useState } from 'react'

export default function Home() {
  const [url, setUrl] = useState('')
  const [videoInfo, setVideoInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchVideoInfo = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setVideoInfo(null)

    try {
      const response = await fetch('/api/video-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video info')
      }

      setVideoInfo(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (format) => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, itag: format.itag }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Download failed')
      }

      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      const extension = format.hasVideo ? 'mp4' : 'mp3'
      a.download = `${videoInfo.title}-${format.quality}.${extension}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      a.remove()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="container">
      <div className="header">
        <h1>YouTube Downloader</h1>
        <p>Download your favorite YouTube videos and audio</p>
      </div>

      <div className="card">
        <form onSubmit={fetchVideoInfo}>
          <div className="input-group">
            <label htmlFor="url">YouTube URL</label>
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Loading...' : 'Get Video Info'}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Fetching video information...</p>
          </div>
        )}

        {videoInfo && (
          <div className="video-info">
            <h3>Video Information</h3>
            <img 
              src={videoInfo.thumbnail} 
              alt={videoInfo.title}
              className="video-thumbnail"
            />
            <div className="video-title">{videoInfo.title}</div>
            <div className="video-details">
              <span>Duration: {videoInfo.duration}</span>
              <span>Views: {videoInfo.views}</span>
            </div>

            <div className="formats">
              <h4>Download Options</h4>
              <div className="format-buttons">
                {videoInfo.formats.map((format) => (
                  <button
                    key={format.itag}
                    onClick={() => handleDownload(format)}
                    className="format-btn"
                  >
                    <span className="format-quality">{format.quality}</span>
                    <span className="format-type">{format.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
