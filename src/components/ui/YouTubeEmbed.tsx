'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

interface YouTubeEmbedProps {
  videoId: string
  isShorts?: boolean
  className?: string
}

export default function YouTubeEmbed({ videoId, isShorts = false, className = "" }: YouTubeEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
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
    <div className={`relative ${isShorts ? 'aspect-[9/16] max-w-[350px] mx-auto' : 'aspect-video'} ${className}`}>
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
        allowFullScreen
        className="w-full h-full rounded-lg"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  )
}