'use client'

import { useEffect, useRef } from 'react'
import { Play } from 'lucide-react'

interface TwitchEmbedProps {
  type: 'clip' | 'video' | 'channel'
  id: string
  onFullscreen?: () => void
  showPlayButton?: boolean
  className?: string
}

declare global {
  interface Window {
    Twitch: {
      Embed: new (elementId: string, options: any) => any
    }
  }
}

export default function TwitchEmbed({ 
  type, 
  id, 
  onFullscreen, 
  showPlayButton = false, 
  className = "" 
}: TwitchEmbedProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const embedRef = useRef<any>(null)
  const embedId = `twitch-embed-${id}-${type}`

  useEffect(() => {
    if (!containerRef.current) return

    const loadTwitchEmbed = () => {
      if (!window.Twitch) {
        console.error('Twitch embed script not loaded')
        return
      }

      // Clean up existing embed
      if (embedRef.current) {
        embedRef.current = null
      }

      // Clear container
      const container = containerRef.current
      if (container) {
        container.innerHTML = `<div id="${embedId}"></div>`
      }

      // Create embed options based on type
      let embedOptions: any = {
        width: "100%",
        height: 400,
        parent: [window.location.hostname],
        autoplay: false,
        theme: "dark",
        layout: "video" // Only show video, no chat
      }

      switch (type) {
        case 'clip':
          embedOptions.clip = id
          break
        case 'video':
          embedOptions.video = id
          break
        case 'channel':
          embedOptions.channel = id
          break
      }

      try {
        embedRef.current = new window.Twitch.Embed(embedId, embedOptions)
      } catch (error) {
        console.error('Error creating Twitch embed:', error)
      }
    }

    // Load Twitch script if not already loaded
    if (!window.Twitch) {
      const script = document.createElement('script')
      script.src = 'https://embed.twitch.tv/embed/v1.js'
      script.onload = loadTwitchEmbed
      script.onerror = () => console.error('Failed to load Twitch embed script')
      document.head.appendChild(script)
    } else {
      loadTwitchEmbed()
    }

    return () => {
      if (embedRef.current) {
        embedRef.current = null
      }
    }
  }, [type, id, embedId])

  const handlePlayClick = () => {
    if (onFullscreen) {
      onFullscreen()
    }
  }

  return (
    <div className={`relative bg-gray-900 ${className}`}>
      <div 
        ref={containerRef}
        className="w-full"
        style={{ aspectRatio: '16/9' }}
      >
        {/* Loading placeholder */}
        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500/20 border-t-purple-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading Twitch {type}...</p>
          </div>
        </div>
      </div>
      
      {/* Play button overlay */}
      {showPlayButton && onFullscreen && (
        <button
          onClick={handlePlayClick}
          className="absolute inset-0 bg-black/20 hover:bg-black/40 transition-all duration-200 flex items-center justify-center group"
        >
          <div className="bg-purple-600/90 hover:bg-purple-600 text-white p-4 rounded-full transition-all duration-200 group-hover:scale-110 shadow-lg">
            <Play className="h-8 w-8 ml-1" />
          </div>
        </button>
      )}
    </div>
  )
}