'use client'

import { useState } from 'react'
import { Play, Maximize } from 'lucide-react'

interface YouTubeEmbedProps {
  videoId: string
  isShorts?: boolean
  className?: string
  onFullscreen?: () => void
  showPlayButton?: boolean
}

export default function YouTubeEmbed({ 
  videoId, 
  isShorts = false, 
  className = "",
  onFullscreen,
  showPlayButton = true
}: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onFullscreen && showPlayButton) {
      e.preventDefault()
      e.stopPropagation()
      onFullscreen()
    }
  }

  if (hasError) {
    return (
      <div className="bg-[#1A1A1A]/50 rounded-lg p-6 text-center border border-[#666666]/50">
        <Play className="h-8 w-8 text-[#666666] mx-auto mb-2" />
        <p className="text-sm text-[#666666]">Failed to load video</p>
      </div>
    )
  }

  return (
    <div 
      className={`relative group ${isShorts ? 'aspect-[9/16] max-w-[350px] mx-auto' : 'aspect-video'} ${className} ${showPlayButton && onFullscreen ? 'cursor-pointer' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-[#1A1A1A]/50 rounded-lg flex items-center justify-center border border-[#666666]/50">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#FF9C00]/20 border-t-[#FF9C00]"></div>
        </div>
      )}
      
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0`}
        title="YouTube video"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen={false} // Disable iframe fullscreen since we're handling it ourselves
        className={`w-full h-full pointer-events-none ${className.includes('rounded') ? className.split(' ').find(c => c.includes('rounded')) : 'rounded-lg'}`} // Use custom rounding or default
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* Fullscreen Play Button Overlay */}
      {showPlayButton && onFullscreen && (
        <div className={`absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-200 flex items-center justify-center rounded-lg ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-black/70 backdrop-blur-sm rounded-full p-4 transform transition-transform group-hover:scale-110">
            <Maximize className="h-8 w-8 text-white" />
          </div>
        </div>
      )}

      {/* Corner Play Indicator for Shorts */}
      {isShorts && showPlayButton && onFullscreen && (
        <div className="absolute top-3 right-3">
          <div className={`bg-black/70 backdrop-blur-sm rounded-full p-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-60'}`}>
            <Play className="h-4 w-4 text-white fill-white" />
          </div>
        </div>
      )}
    </div>
  )
}