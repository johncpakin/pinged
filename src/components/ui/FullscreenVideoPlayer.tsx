'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Volume2, VolumeX, Play, Pause, RotateCcw, Share, Heart, MessageCircle } from 'lucide-react'

interface FullscreenVideoPlayerProps {
  isOpen: boolean
  onClose: () => void
  videoId: string
  isShorts: boolean
  post?: {
    id: string
    user: {
      display_name: string
      username: string
    }
    content: string
    created_at: string
  }
}

export default function FullscreenVideoPlayer({ 
  isOpen, 
  onClose, 
  videoId, 
  isShorts,
  post 
}: FullscreenVideoPlayerProps) {
  const [isMuted, setIsMuted] = useState(false)
  const [embedKey, setEmbedKey] = useState(0) // Force iframe refresh
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Reset embed when opening
      setEmbedKey(prev => prev + 1)
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Handle mute toggle by refreshing iframe with new parameters
  const toggleMute = () => {
    setIsMuted(!isMuted)
    // Force iframe refresh with new mute parameter
    setEmbedKey(prev => prev + 1)
  }

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
      >
        <X className="h-6 w-6" />
      </button>

      {/* Video Player Container */}
      <div className={`relative ${isShorts ? 'w-full max-w-[400px] h-[80vh]' : 'w-[90vw] max-w-6xl h-[80vh]'}`}>
        {/* YouTube iframe */}
        <iframe
          key={embedKey} // Force refresh when key changes
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&fs=0&disablekb=1&iv_load_policy=3${isMuted ? '&mute=1' : ''}`}
          title="YouTube video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full rounded-lg"
        />

        {/* Video Controls Overlay - only show for shorts */}
        {isShorts && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6">
            {/* Post Info */}
            {post && (
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FF9C00] to-[#AC3601] rounded-full flex items-center justify-center">
                    <span className="font-bold text-white text-sm">
                      {post.user.display_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{post.user.display_name}</p>
                    <p className="text-white/70 text-xs">@{post.user.username} • {formatTimeAgo(post.created_at)}</p>
                  </div>
                </div>
                <p className="text-white text-sm leading-relaxed">{post.content}</p>
              </div>
            )}
          </div>
        )}

        {/* Side Controls for Shorts */}
        {isShorts && (
          <div className="absolute right-4 bottom-20 flex flex-col gap-4">
            <button className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors backdrop-blur-sm">
              <Heart className="h-6 w-6" />
            </button>
            <button className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors backdrop-blur-sm">
              <MessageCircle className="h-6 w-6" />
            </button>
            <button className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors backdrop-blur-sm">
              <Share className="h-6 w-6" />
            </button>
            <button 
              onClick={toggleMute}
              className="bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors backdrop-blur-sm"
            >
              {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
            </button>
          </div>
        )}
      </div>

      {/* Regular video controls */}
      {!isShorts && post && (
        <div className="absolute bottom-6 left-6 right-6 bg-black/50 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#FF9C00] to-[#AC3601] rounded-full flex items-center justify-center">
              <span className="font-bold text-white">
                {post.user.display_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-white">{post.user.display_name}</h4>
                <span className="text-[#FF9C00] text-sm">@{post.user.username}</span>
              </div>
              <p className="text-white/70 text-sm">{post.content}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-white/70 hover:text-white p-2 rounded-lg transition-colors">
                <Heart className="h-5 w-5" />
              </button>
              <button className="text-white/70 hover:text-white p-2 rounded-lg transition-colors">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button className="text-white/70 hover:text-white p-2 rounded-lg transition-colors">
                <Share className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}