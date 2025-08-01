'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  Search, 
  Users, 
  Calendar, 
  Heart,
  MessageCircle,
  Share,
  Clock,
  Gamepad2,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
  UserPlus,
  Play,
  BarChart3,
  Zap,
  Target,
  Trophy
} from 'lucide-react'
import ClipsCarousel from '@/components/ui/ClipsCarousel'
import { isYouTubeUrl, extractYouTubeVideoId, isYouTubeShorts } from '@/lib/youtube'
import YouTubeEmbed from '@/components/ui/YouTubeEmbed'



interface UserProfile {
  id: string
  display_name: string
  username: string
  avatar_url?: string
  bio?: string
  region?: string
  timezone?: string
}

interface UserData {
  id: string
  email?: string
}

interface Post {
  id: string
  user_id: string
  content: string
  media_url?: string
  game_tag?: string
  created_at: string
  user: UserProfile
}

interface UserGame {
  id: string
  game_name: string
  platform: string
  rank?: string
  tags?: string[]
}

interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function HomePage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [userGames, setUserGames] = useState<UserGame[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostGame, setNewPostGame] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [newPostYouTubeUrl, setNewPostYouTubeUrl] = useState('')

  
  const router = useRouter()
  const supabase = createClient()

  // Static/memoized fake data to prevent re-calculation on every render
  const trendingGamesData = useMemo(() => [
    { name: 'Valorant', active: 1247, rank: 1 },
    { name: 'League of Legends', active: 892, rank: 2 },
    { name: 'CS2', active: 743, rank: 3 },
    { name: 'Overwatch 2', active: 521, rank: 4 }
  ], [])

  const fakeHoursPlayed = useMemo(() => Math.floor(Math.random() * 80) + 40, [])
  const weeklyActivityData = useMemo(() => [40, 65, 30, 80, 45, 70, 90], [])

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          console.log('No authenticated user, redirecting to home')
          router.push('/')
          return
        }
        
        setUser(user)
        await loadUserData(user.id)
        await loadPosts()
      } catch (error) {
        console.error('Error getting user:', error)
        router.push('/')
        return
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError)
        return
      }
      
      setProfile(profileData)

      // Load user games
      const { data: gamesData, error: gamesError } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', userId)
      
      if (gamesError) {
        console.error('Error loading games:', gamesError)
      } else {
        setUserGames(gamesData || [])
      }

      // Load availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week')
      
      if (availabilityError) {
        console.error('Error loading availability:', availabilityError)
      } else {
        setAvailability(availabilityData || [])
      }
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, display_name, username, avatar_url, region)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (error) {
        console.error('Error loading posts:', error)
        return
      }
      
      setPosts(postsData || [])
    } catch (error) {
      console.error('Error loading posts:', error)
    }
  }


const createPost = async () => {
  if (!user || !newPostContent.trim()) return

  // Check for YouTube URLs in two places:
  // 1. Dedicated YouTube URL field (takes priority)
  // 2. URLs within the post content
  let mediaUrl = null
  
  // First check the dedicated YouTube URL field
  if (newPostYouTubeUrl && isYouTubeUrl(newPostYouTubeUrl)) {
    mediaUrl = newPostYouTubeUrl
  } else {
    // If no dedicated URL, check content for YouTube URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = newPostContent.match(urlRegex)
    
    if (urls) {
      const youtubeUrl = urls.find(url => isYouTubeUrl(url))
      if (youtubeUrl) {
        mediaUrl = youtubeUrl
      }
    }
  }

  try {
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: newPostContent,
        media_url: mediaUrl,
        game_tag: newPostGame || null
      })
      .select(`
        *,
        user:users(id, display_name, username, avatar_url, region)
      `)
      .single()

    if (error) throw error

    setPosts(prev => [data, ...prev])
    setNewPostContent('')
    setNewPostGame('')
    setNewPostYouTubeUrl('')  // Clear the YouTube URL field
    setShowNewPost(false)
  } catch (error) {
    console.error('Error creating post:', error)
  }
}

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Sign out error:', error)
        return
      }
      window.location.href = '/'
    } catch (error) {
      console.error('Unexpected sign out error:', error)
      window.location.href = '/'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const getCurrentAvailability = () => {
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.toTimeString().slice(0, 5)
    
    return availability.find(slot => 
      slot.day_of_week === currentDay &&
      currentTime >= slot.start_time &&
      currentTime <= slot.end_time
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#FF9C00]/20 border-t-[#FF9C00] mx-auto mb-4"></div>
          <p className="text-[#CCCCCC] text-sm">Loading your gaming dashboard...</p>
        </div>
      </div>
    )
  }

  if (!loading && !user) {
    router.push('/')
    return null
  }

  const isCurrentlyAvailable = getCurrentAvailability()

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Enhanced Header */}
      <header className="bg-[#1A1A1A]/80 backdrop-blur-xl border-b border-[#FF9C00]/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              {/* Desktop Logo */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="bg-gradient-to-br from-[#FF9C00] to-[#AC3601] p-2 rounded-xl">
                  <img src="icon.png" alt="Pinged" className="h-6 w-6" />
                </div>

           
                <span className="text-xl font-bold bg-gradient-to-r from-[#FF9C00] to-[#AC3601] bg-clip-text text-transparent">
                  PINGED.GG
                </span>
              </div>
              
              {/* Navigation Tabs - Full width on mobile */}
              <div className="flex items-center gap-1 bg-[#333333]/50 rounded-lg p-1 flex-1 lg:flex-initial">
                {[
                  { key: 'all', label: 'All Posts', icon: TrendingUp },
                  { key: 'lfg', label: 'LFG', icon: Users },
                  { key: 'clips', label: 'Clips', icon: Play }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 lg:flex-initial justify-center ${
                      activeFilter === key 
                        ? 'bg-[#FF9C00]/20 text-[#FF9C00] shadow-lg' 
                        : 'text-[#CCCCCC] hover:text-white hover:bg-[#333333]/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-[#333333]/50 rounded-lg transition-colors relative">
                <Search className="h-5 w-5 text-[#CCCCCC]" />
              </button>
              <button className="p-2 hover:bg-[#333333]/50 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-[#CCCCCC]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF9C00] rounded-full"></div>
              </button>
              
              {/* Settings Dropdown */}
              <div className="relative group">
                <button className="p-2 hover:bg-[#333333]/50 rounded-lg transition-colors">
                  <Settings className="h-5 w-5 text-[#CCCCCC]" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#333333] border border-[#666666]/50 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button 
                      onClick={() => router.push('/settings')}
                      className="w-full text-left px-4 py-2 text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A]/50 transition-colors flex items-center gap-3"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button 
                      onClick={() => router.push(`/u/${profile?.username}`)}
                      className="w-full text-left px-4 py-2 text-[#CCCCCC] hover:text-white hover:bg-[#1A1A1A]/50 transition-colors flex items-center gap-3"
                    >
                      <Users className="h-4 w-4" />
                      View Profile
                    </button>
                    <div className="border-t border-[#666666]/30 my-2"></div>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Mobile: Single column layout, Desktop: Three column layout */}
        <div className="lg:grid lg:grid-cols-4 lg:gap-6 space-y-6 lg:space-y-0">
          {/* Enhanced Left Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-[#333333]/90 to-[#1A1A1A]/50 backdrop-blur-xl rounded-2xl p-6 border border-[#666666]/50 shadow-2xl">
              <div className="text-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#FF9C00] to-[#AC3601] rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {profile?.display_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isCurrentlyAvailable && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-black flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{profile?.display_name}</h3>
                <p className="text-[#FF9C00] text-sm mb-2">@{profile?.username}</p>
                <p className="text-[#CCCCCC] text-xs">{profile?.region}</p>
                
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${isCurrentlyAvailable ? 'bg-green-400' : 'bg-[#666666]'}`} />
                  <span className="text-xs text-[#CCCCCC]">
                    {isCurrentlyAvailable ? 'Available to play' : 'Not available'}
                  </span>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-[#CCCCCC] text-sm mb-6 leading-relaxed">{profile.bio}</p>
              )}

              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/explore')}
                  className="w-full bg-gradient-to-r from-[#FF9C00] to-[#AC3601] hover:from-[#FF9C00]/90 hover:to-[#AC3601]/90 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Find Teammates
                </button>
              </div>
            </div>

            {/* Games Card */}
            <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-6 border border-[#666666]/50">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-[#FF9C00]" />
                <h4 className="font-semibold text-white">Your Games</h4>
              </div>
              <div className="space-y-3">
                {userGames.slice(0, 3).map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-[#1A1A1A]/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-white">{game.game_name}</p>
                      <p className="text-xs text-[#CCCCCC]">{game.platform}</p>
                    </div>
                    {game.rank && (
                      <span className="text-xs bg-[#FF9C00]/20 text-[#FF9C00] px-2 py-1 rounded-md border border-[#FF9C00]/20">
                        {game.rank}
                      </span>
                    )}
                  </div>
                ))}
                {userGames.length > 3 && (
                  <p className="text-xs text-[#666666] text-center">+{userGames.length - 3} more games</p>
                )}
                {userGames.length === 0 && (
                  <p className="text-[#666666] text-sm text-center py-4">No games added yet</p>
                )}
              </div>
            </div>

            {/* Availability Card */}
            {availability.length > 0 && (
              <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-6 border border-[#666666]/50">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold text-white">This Week</h4>
                </div>
                <div className="space-y-2">
                  {availability.slice(0, 4).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between text-sm py-2">
                      <span className="text-[#CCCCCC] font-medium">{DAYS[slot.day_of_week]}</span>
                      <span className="text-[#666666] text-xs">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Main Feed - Full width on mobile, centered on desktop */}
          <div className="lg:col-span-2 space-y-6">
             {/* Clips Carousel - Mobile only */}
  
    <ClipsCarousel />
  
            {/* New Post Card - Compact */}
            <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-4 border border-[#666666]/50">
              {!showNewPost ? (
                <button
                  onClick={() => setShowNewPost(true)}
                  className="w-full text-left p-3 bg-[#1A1A1A]/30 hover:bg-[#1A1A1A]/50 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FF9C00] to-[#AC3601] rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[#CCCCCC] text-sm">What&apos;s happening in your gaming world?</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FF9C00] to-[#AC3601] rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share an update, look for teammates, or post a clip..."
                        className="w-full bg-[#1A1A1A]/50 border border-[#666666]/50 rounded-lg p-3 resize-none focus:ring-2 focus:ring-[#FF9C00]/50 focus:border-[#FF9C00]/50 text-white placeholder-[#666666] text-sm"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <select
                      value={newPostGame}
                      onChange={(e) => setNewPostGame(e.target.value)}
                      className="bg-[#1A1A1A]/50 border border-[#666666]/50 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value="">Select game (optional)</option>
                      {userGames.map((game) => (
                        <option key={game.id} value={game.game_name}>
                          {game.game_name}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowNewPost(false)}
                        className="px-3 py-2 text-[#CCCCCC] hover:text-white transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createPost}
                        disabled={!newPostContent.trim()}
                        className="bg-gradient-to-r from-[#FF9C00] to-[#AC3601] hover:from-[#FF9C00]/90 hover:to-[#AC3601]/90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium text-white transition-all text-sm"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-6 border border-[#666666]/50 hover:border-[#FF9C00]/30 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#FF9C00] to-[#AC3601] rounded-full flex items-center justify-center">
                      <span className="font-bold text-white">
                        {post.user.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{post.user.display_name}</h4>
                        <span className="text-[#FF9C00] text-sm">@{post.user.username}</span>
                        {post.user.region && (
                          <span className="text-xs text-[#666666]">• {post.user.region}</span>
                        )}
                        {post.game_tag && (
                          <span className="text-xs bg-[#AC3601]/20 text-[#AC3601] px-2 py-1 rounded-full border border-[#AC3601]/20">
                            {post.game_tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#CCCCCC]">{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-[#CCCCCC] mb-4 leading-relaxed">{post.content}</p>

    {post.media_url && (
      <div className="mb-4">
        {isYouTubeUrl(post.media_url) ? (
          (() => {
            const videoId = extractYouTubeVideoId(post.media_url)
            if (videoId) {
              return (
                <YouTubeEmbed 
                  videoId={videoId} 
                  isShorts={isYouTubeShorts(post.media_url)}
                />
              )
            }
            return (
              <div className="bg-[#1A1A1A]/50 rounded-lg p-6 text-center border border-[#666666]/50">
                <Play className="h-8 w-8 text-[#666666] mx-auto mb-2" />
                <p className="text-sm text-[#666666]">Invalid video URL</p>
              </div>
            )
          })()
        ) : (
          // Handle other media types (images, etc.) - keep your existing placeholder for now
          <div className="bg-[#1A1A1A]/50 rounded-lg p-6 text-center border border-[#666666]/50">
            <Play className="h-8 w-8 text-[#666666] mx-auto mb-2" />
            <p className="text-sm text-[#666666]">Media content</p>
          </div>
        )}
      </div>
    )}

                  <div className="flex items-center gap-6 text-[#CCCCCC]">
                    <button className="flex items-center gap-2 hover:text-red-400 transition-colors group">
                      <Heart className="h-5 w-5 group-hover:fill-current" />
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-[#FF9C00] transition-colors">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-400 transition-colors">
                      <UserPlus className="h-5 w-5" />
                      <span className="text-sm">Connect</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-white transition-colors">
                      <Share className="h-5 w-5" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-12 text-center border border-[#666666]/50">
                  <div className="w-16 h-16 bg-[#1A1A1A]/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-[#666666]" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Welcome to your feed!</h3>
                  <p className="text-[#CCCCCC] mb-6">
                    Start connecting with other gamers to see posts in your feed.
                  </p>
                  <button 
                    onClick={() => router.push('/explore')}
                    className="bg-gradient-to-r from-[#FF9C00] to-[#AC3601] hover:from-[#FF9C00]/90 hover:to-[#AC3601]/90 px-6 py-3 rounded-xl font-medium text-white transition-all shadow-lg"
                  >
                    Explore Gamers
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Right Sidebar - Hidden on Mobile/Tablet */}
          <div className="hidden xl:block lg:col-span-1 space-y-6">
            {/* Trending Games */}
            <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-6 border border-[#666666]/50">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[#FF9C00]" />
                <h4 className="font-semibold text-white">Trending Games</h4>
              </div>
              <div className="space-y-3">
                {trendingGamesData.map((game) => (
                  <div key={game.name} className="flex items-center justify-between p-3 bg-[#1A1A1A]/30 rounded-lg hover:bg-[#1A1A1A]/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm text-white">{game.name}</p>
                      <p className="text-xs text-[#CCCCCC]">{game.active} active</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[#FF9C00] font-medium">#{game.rank}</span>
                      <div className="w-8 h-8 bg-gradient-to-br from-[#FF9C00]/20 to-[#AC3601]/20 rounded-lg flex items-center justify-center border border-[#FF9C00]/20">
                        <TrendingUp className="h-4 w-4 text-[#FF9C00]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Connections */}
            <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-6 border border-[#666666]/50">
              <h4 className="font-semibold mb-4 text-white">Suggested Connections</h4>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-[#1A1A1A]/30 rounded-lg hover:bg-[#1A1A1A]/50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#AC3601] to-[#FF9C00] rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">G{i}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-white">Gamer{i}</p>
                      <p className="text-xs text-[#CCCCCC]">Valorant • Diamond</p>
                    </div>
                    <button className="bg-[#FF9C00]/20 hover:bg-[#FF9C00]/30 text-[#FF9C00] px-3 py-1 rounded-md text-xs border border-[#FF9C00]/20 transition-colors">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => router.push('/explore')}
                className="w-full mt-4 text-[#FF9C00] hover:text-[#FF9C00]/80 text-sm font-medium transition-colors"
              >
                See all suggestions
              </button>
            </div>

            {/* Activity Stats */}
            <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-6 border border-[#666666]/50">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-green-400" />
                <h4 className="font-semibold text-white">Your Stats</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-[#CCCCCC] text-sm">Games</span>
                  </div>
                  <span className="font-bold text-white">{userGames.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#FF9C00]" />
                    <span className="text-[#CCCCCC] text-sm">Posts</span>
                  </div>
                  <span className="font-bold text-white">{posts.filter(p => p.user_id === user?.id).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#FF9C00]" />
                    <span className="text-[#CCCCCC] text-sm">Connections</span>
                  </div>
                  <span className="font-bold text-white">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span className="text-[#CCCCCC] text-sm">Hours Played</span>
                  </div>
                  <span className="font-bold text-white">{fakeHoursPlayed}h</span>
                </div>
              </div>
              
              {/* Mini activity chart */}
              <div className="mt-4 pt-4 border-t border-[#666666]/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#CCCCCC]">Weekly Activity</span>
                  <span className="text-xs text-green-400">+12%</span>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {weeklyActivityData.map((height, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-t from-[#FF9C00]/50 to-[#AC3601]/50 rounded-sm flex-1"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#333333]/50 backdrop-blur-xl rounded-xl p-6 border border-[#666666]/50">
              <h4 className="font-semibold mb-4 text-white">Recent Activity</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-[#1A1A1A]/30">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/20">
                    <Gamepad2 className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#CCCCCC]">Played Valorant</p>
                    <p className="text-xs text-[#666666]">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-[#1A1A1A]/30">
                  <div className="w-8 h-8 bg-[#FF9C00]/20 rounded-lg flex items-center justify-center border border-[#FF9C00]/20">
                    <UserPlus className="h-4 w-4 text-[#FF9C00]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#CCCCCC]">New connection request</p>
                    <p className="text-xs text-[#666666]">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-[#1A1A1A]/30">
                  <div className="w-8 h-8 bg-[#AC3601]/20 rounded-lg flex items-center justify-center border border-[#AC3601]/20">
                    <Calendar className="h-4 w-4 text-[#AC3601]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#CCCCCC]">3 friends available now</p>
                    <p className="text-xs text-[#666666]">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}