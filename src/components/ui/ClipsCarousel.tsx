'use client'

import { useState, useRef } from 'react'
import { Play, ChevronLeft, ChevronRight } from 'lucide-react'

interface Clip {
  id: string
  username: string
  game: string
  views: string
  duration: string
}

const mockClips: Clip[] = [
  { id: '1', username: 'ProGamer1', game: 'Valorant', views: '12.5K', duration: '0:15' },
  { id: '2', username: 'SnipeKing', game: 'CS2', views: '8.2K', duration: '0:22' },
  { id: '3', username: 'RocketQueen', game: 'Rocket League', views: '15.1K', duration: '0:18' },
  { id: '4', username: 'ApexLegend', game: 'Apex Legends', views: '9.8K', duration: '0:28' },
  { id: '5', username: 'FortniteGod', game: 'Fortnite', views: '22.3K', duration: '0:35' },
  { id: '6', username: 'LOLMaster', game: 'League of Legends', views: '18.7K', duration: '0:42' }
]

export default function ClipsCarousel() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(true)

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -240, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 240, behavior: 'smooth' })
    }
  }

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setShowLeftButton(scrollLeft > 0)
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  return (
    <div className="w-full relative">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Play className="h-5 w-5 text-[#FF9C00]" />
          Latest Clips
        </h3>
        <button className="text-[#FF9C00] text-sm font-medium hover:text-[#FF9C00]/80 transition-colors">
          View All
        </button>
      </div>
      
      {/* Horizontal Scrollable Clips with Navigation */}
      <div className="relative">
        {/* Left scroll button */}
        {showLeftButton && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full shadow-lg transition-all backdrop-blur-sm border border-[#666666]/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right scroll button */}
        {showRightButton && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/80 hover:bg-black/90 text-white p-2 rounded-full shadow-lg transition-all backdrop-blur-sm border border-[#666666]/30"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        >
          {mockClips.map((clip) => (
            <div key={clip.id} className="flex-shrink-0 w-28 sm:w-32">
              <div className="relative bg-[#333333]/80 rounded-xl overflow-hidden border border-[#666666]/30 hover:border-[#FF9C00]/50 transition-all cursor-pointer group">
                {/* 9:16 Thumbnail Container */}
                <div className="aspect-[9/16] bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#333333] flex items-center justify-center relative overflow-hidden">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-2 left-2 w-4 h-4 bg-[#FF9C00] rounded-full"></div>
                    <div className="absolute top-8 right-3 w-2 h-2 bg-[#AC3601] rounded-full"></div>
                    <div className="absolute bottom-6 left-3 w-3 h-3 bg-[#FF9C00] rounded-full"></div>
                    <div className="absolute bottom-12 right-2 w-2.5 h-2.5 bg-[#AC3601] rounded-full"></div>
                  </div>
                  
                  {/* Play Button */}
                  <div className="relative z-10 group-hover:scale-110 transition-transform duration-200">
                    <Play className="h-8 w-8 text-[#FF9C00] opacity-80 drop-shadow-lg" />
                  </div>
                  
                  {/* Game Badge */}
                  <div className="absolute top-2 left-2 bg-black/80 text-[#FF9C00] text-xs px-2 py-1 rounded-md font-medium backdrop-blur-sm">
                    {clip.game}
                  </div>
                  
                  {/* Duration */}
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                    {clip.duration}
                  </div>
                  
                  {/* Views */}
                  <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-1.5 py-1 rounded-md backdrop-blur-sm">
                    {clip.views}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-[#FF9C00]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </div>
                
                {/* User Info */}
                <div className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-[#FF9C00] to-[#AC3601] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {clip.username.charAt(0)}
                      </span>
                    </div>
                    <span className="text-xs text-[#CCCCCC] font-medium truncate">
                      {clip.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scrollbar Hiding Styles */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}