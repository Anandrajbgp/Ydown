import './globals.css'

export const metadata = {
  title: 'YouTube Downloader',
  description: 'Download YouTube videos and audio',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
