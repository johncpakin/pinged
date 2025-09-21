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
  Trophy,
  Trash2
} from 'lucide-react'
import ClipsCarousel from '@/components/ui/ClipsCarousel'
import { isYouTubeUrl, extractYouTubeVideoId, isYouTubeShorts } from '@/lib/youtube'
import { isTwitchUrl, extractTwitchInfo } from '@/lib/twitch'
import YouTubeEmbed from '@/components/ui/YouTubeEmbed'
import TwitchEmbed from '@/components/ui/TwitchEmbed'
import FullscreenVideoPlayer from '@/components/ui/FullscreenVideoPlayer'

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

  const cleanPostContent = (content: string, mediaUrl?: string) => {
    if (!mediaUrl || (!isYouTubeUrl(mediaUrl) && !isTwitchUrl(mediaUrl))) {
      return content
    }
    
    // Remove the YouTube/Twitch URL from the content if it exists
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return content.replace(urlRegex, (url) => {
      return (isYouTubeUrl(url) || isTwitchUrl(url)) ? '' : url
    }).trim().replace(/\s+/g, ' ') // Clean up extra whitespace
  }

  // Static/memoized fake data to prevent re-calculation on every render
  const trendingGamesData = useMemo(() => [
    { name: 'Valorant', active: 1247, rank: 1 },
    { name: 'League of Legends', active: 892, rank: 2 },
    { name: 'CS2', active: 743, rank: 3 },
    { name: 'Overwatch 2', active: 521, rank: 4 }
  ], [])

  const [fullscreenVideo, setFullscreenVideo] = useState<{
    isOpen: boolean
    videoId: string
    isShorts: boolean
    post?: Post
  }>({
    isOpen: false,
    videoId: '',
    isShorts: false,
    post: undefined
  })

  const openFullscreenVideo = (videoId: string, isShorts: boolean, post: Post) => {
    setFullscreenVideo({
      isOpen: true,
      videoId,
      isShorts,
      post
    })
  }

  const closeFullscreenVideo = () => {
    setFullscreenVideo({
      isOpen: false,
      videoId: '',
      isShorts: false,
      post: undefined
    })
  }

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
    if (newPostYouTubeUrl && (isYouTubeUrl(newPostYouTubeUrl) || isTwitchUrl(newPostYouTubeUrl))) {
      mediaUrl = newPostYouTubeUrl
    } else {
      // If no dedicated URL, check content for YouTube/Twitch URLs
      const urlRegex = /(https?:\/\/[^\s]+)/g
      const urls = newPostContent.match(urlRegex)
      
      if (urls) {
        const videoUrl = urls.find(url => isYouTubeUrl(url) || isTwitchUrl(url))
        if (videoUrl) {
          mediaUrl = videoUrl
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

  const deletePost = async (postId: string) => {
    if (!user) {
      console.error('No user found for deletion')
      return
    }

    console.log('Attempting to delete post:', postId, 'by user:', user.id)

    try {
      const { data, error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id) // Ensure user can only delete their own posts
        .select() // Return deleted rows to confirm deletion

      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }

      console.log('Delete successful, deleted:', data)

      // Remove post from local state
      setPosts(prev => prev.filter(post => post.id !== postId))
    } catch (error) {
      console.error('Error deleting post:', error)
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
      <div className="min-h-screen bg-ui-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-brand-primary/20 border-t-brand-primary mx-auto mb-4"></div>
          <p className="text-text-secondary text-sm">Loading your gaming dashboard...</p>
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
    <div className="min-h-screen bg-ui-background text-text-primary">
      {/* Enhanced Header */}
      <header className="bg-ui-surface/80 backdrop-blur-xl border-b border-brand-primary/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              {/* Desktop Logo */}
              <div className="hidden lg:flex items-center gap-3">
                <div className="bg-brand-gradient p-2 rounded-xl">
                  <img src="icon.png" alt="Pinged" className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  PINGED.GG
                </span>
              </div>
              
              {/* Navigation Tabs - Full width on mobile */}
              <div className="flex items-center gap-1 bg-ui-surface-hover/50 rounded-lg p-1 flex-1 lg:flex-initial">
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
                        ? 'bg-brand-primary/20 text-brand-primary shadow-lg' 
                        : 'text-text-secondary hover:text-text-primary hover:bg-ui-surface-hover/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-ui-surface-hover/50 rounded-lg transition-colors relative">
                <Search className="h-5 w-5 text-text-secondary" />
              </button>
              <button className="p-2 hover:bg-ui-surface-hover/50 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-text-secondary" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-primary rounded-full"></div>
              </button>
              
              {/* Settings Dropdown */}
              <div className="relative group">
                <button className="p-2 hover:bg-ui-surface-hover/50 rounded-lg transition-colors">
                  <Settings className="h-5 w-5 text-text-secondary" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-ui-surface-hover border border-ui-border/50 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button 
                      onClick={() => router.push('/settings')}
                      className="w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-ui-surface/50 transition-colors flex items-center gap-3"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </button>
                    <button 
                      onClick={() => router.push(`/u/${profile?.username}`)}
                      className="w-full text-left px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-ui-surface/50 transition-colors flex items-center gap-3"
                    >
                      <Users className="h-4 w-4" />
                      View Profile
                    </button>
                    <div className="border-t border-ui-border/30 my-2"></div>
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
            <div className="bg-gradient-to-br from-ui-surface-hover/90 to-ui-surface/50 backdrop-blur-xl rounded-2xl p-6 border border-ui-border/50 shadow-2xl">
              <div className="text-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-brand-gradient rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <span className="text-2xl font-bold text-text-primary">
                      {profile?.display_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isCurrentlyAvailable && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-ui-background flex items-center justify-center">
                      <div className="w-2 h-2 bg-text-primary rounded-full"></div>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-1">{profile?.display_name}</h3>
                <p className="text-brand-primary text-sm mb-2">@{profile?.username}</p>
                <p className="text-text-secondary text-xs">{profile?.region}</p>
                
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${isCurrentlyAvailable ? 'bg-green-400' : 'bg-ui-border'}`} />
                  <span className="text-xs text-text-secondary">
                    {isCurrentlyAvailable ? 'Available to play' : 'Not available'}
                  </span>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-text-secondary text-sm mb-6 leading-relaxed">{profile.bio}</p>
              )}

              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/explore')}
                  className="w-full bg-brand-gradient hover:opacity-90 text-text-primary py-3 px-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Find Teammates
                </button>
              </div>
            </div>

            {/* Games Card */}
            <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-6 border border-ui-border/50">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-brand-primary" />
                <h4 className="font-semibold text-text-primary">Your Games</h4>
              </div>
              <div className="space-y-3">
                {userGames.slice(0, 3).map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-ui-surface/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-text-primary">{game.game_name}</p>
                      <p className="text-xs text-text-secondary">{game.platform}</p>
                    </div>
                    {game.rank && (
                      <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded-md border border-brand-primary/20">
                        {game.rank}
                      </span>
                    )}
                  </div>
                ))}
                {userGames.length > 3 && (
                  <p className="text-xs text-text-muted text-center">+{userGames.length - 3} more games</p>
                )}
                {userGames.length === 0 && (
                  <p className="text-text-muted text-sm text-center py-4">No games added yet</p>
                )}
              </div>
            </div>

            {/* Availability Card */}
            {availability.length > 0 && (
              <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-6 border border-ui-border/50">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold text-text-primary">This Week</h4>
                </div>
                <div className="space-y-2">
                  {availability.slice(0, 4).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between text-sm py-2">
                      <span className="text-text-secondary font-medium">{DAYS[slot.day_of_week]}</span>
                      <span className="text-text-muted text-xs">
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
            <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-4 border border-ui-border/50">
              {!showNewPost ? (
                <button
                  onClick={() => setShowNewPost(true)}
                  className="w-full text-left p-3 bg-ui-surface/30 hover:bg-ui-surface/50 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-text-primary">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-text-secondary text-sm">What&apos;s happening in your gaming world?</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-gradient rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-text-primary">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share an update, look for teammates, or post a clip..."
                        className="w-full bg-ui-surface/50 border border-ui-border/50 rounded-lg p-3 resize-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary/50 text-text-primary placeholder-text-muted text-sm"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <select
                      value={newPostGame}
                      onChange={(e) => setNewPostGame(e.target.value)}
                      className="bg-ui-surface/50 border border-ui-border/50 rounded-lg px-3 py-2 text-xs text-text-primary"
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
                        className="px-3 py-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createPost}
                        disabled={!newPostContent.trim()}
                        className="bg-brand-gradient hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium text-text-primary transition-all text-sm"
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
              {posts.map((post) => {
                const hasYouTubeVideo = post.media_url && isYouTubeUrl(post.media_url)
                const hasTwitchVideo = post.media_url && isTwitchUrl(post.media_url)
                const hasVideo = hasYouTubeVideo || hasTwitchVideo
                
                const youtubeVideoId = hasYouTubeVideo ? extractYouTubeVideoId(post.media_url) : null
                const isVideoShorts = hasYouTubeVideo ? isYouTubeShorts(post.media_url) : false
                
                const twitchInfo = hasTwitchVideo ? extractTwitchInfo(post.media_url) : null
                
                const cleanedContent = cleanPostContent(post.content, post.media_url)
                
                return (
                  <div key={post.id} className="bg-ui-surface/50 backdrop-blur-xl rounded-xl overflow-hidden border border-ui-border/50 hover:border-brand-primary/30 transition-all">
                    {/* User Info - Always at the top */}
                    <div className="p-6 pb-0">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 bg-brand-gradient rounded-full flex items-center justify-center">
                          <span className="font-bold text-text-primary">
                            {post.user.display_name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-text-primary">{post.user.display_name}</h4>
                            <span className="text-brand-primary text-sm">@{post.user.username}</span>
                            {post.user.region && (
                              <span className="text-xs text-text-muted">• {post.user.region}</span>
                            )}
                            {post.game_tag && (
                              <span className="text-xs bg-brand-secondary/20 text-brand-secondary px-2 py-1 rounded-full border border-brand-secondary/20">
                                {post.game_tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{formatTimeAgo(post.created_at)}</p>
                        </div>
                        
                        {/* Delete button - only show for post author */}
                        {user?.id === post.user_id && (
                          <button
                            onClick={() => deletePost(post.id)}
                            className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-text-secondary hover:text-red-400"
                            title="Delete post"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Post Content - Only show if there's actual content after cleaning */}
                      {cleanedContent && (
                        <p className="text-text-secondary mb-4 leading-relaxed">{cleanedContent}</p>
                      )}
                    </div>

                    {/* Video Section - Full width, no padding */}
                    {hasYouTubeVideo && youtubeVideoId && (
                      <div className="relative">
                        <YouTubeEmbed 
                          videoId={youtubeVideoId} 
                          isShorts={isVideoShorts}
                          onFullscreen={() => openFullscreenVideo(youtubeVideoId, isVideoShorts, post)}
                          showPlayButton={true}
                          className="rounded-none"
                        />
                      </div>
                    )}
                    
                    {/* Twitch Video Section */}
                    {hasTwitchVideo && twitchInfo && (
                      <div className="relative">
                        <TwitchEmbed 
                          type={twitchInfo.type}
                          id={twitchInfo.id}
                          showPlayButton={true}
                          className="rounded-none"
                        />
                      </div>
                    )}

                    {/* Non-YouTube/Twitch Media */}
                    {post.media_url && !isYouTubeUrl(post.media_url) && !isTwitchUrl(post.media_url) && (
                      <div className="px-6 pb-4">
                        <div className="bg-ui-surface/50 rounded-lg p-6 text-center border border-ui-border/50">
                          <Play className="h-8 w-8 text-text-muted mx-auto mb-2" />
                          <p className="text-sm text-text-muted">Media content</p>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons - Always at the bottom */}
                    <div className="p-6 pt-4">
                      <div className="flex items-center gap-6 text-text-secondary">
                        <button className="flex items-center gap-2 hover:text-red-400 transition-colors group">
                          <Heart className="h-5 w-5 group-hover:fill-current" />
                          <span className="text-sm">Like</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-brand-primary transition-colors">
                          <MessageCircle className="h-5 w-5" />
                          <span className="text-sm">Comment</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-green-400 transition-colors">
                          <UserPlus className="h-5 w-5" />
                          <span className="text-sm">Connect</span>
                        </button>
                        <button className="flex items-center gap-2 hover:text-text-primary transition-colors">
                          <Share className="h-5 w-5" />
                          <span className="text-sm">Share</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {posts.length === 0 && (
                <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-12 text-center border border-ui-border/50">
                  <div className="w-16 h-16 bg-ui-surface/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-text-muted" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-text-primary">Welcome to your feed!</h3>
                  <p className="text-text-secondary mb-6">
                    Start connecting with other gamers to see posts in your feed.
                  </p>
                  <button 
                    onClick={() => router.push('/explore')}
                    className="bg-brand-gradient hover:opacity-90 px-6 py-3 rounded-xl font-medium text-text-primary transition-all shadow-lg"
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
            <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-6 border border-ui-border/50">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-brand-primary" />
                <h4 className="font-semibold text-text-primary">Trending Games</h4>
              </div>
              <div className="space-y-3">
                {trendingGamesData.map((game) => (
                  <div key={game.name} className="flex items-center justify-between p-3 bg-ui-surface/30 rounded-lg hover:bg-ui-surface/50 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm text-text-primary">{game.name}</p>
                      <p className="text-xs text-text-secondary">{game.active} active</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-brand-primary font-medium">#{game.rank}</span>
                      <div className="w-8 h-8 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-lg flex items-center justify-center border border-brand-primary/20">
                        <TrendingUp className="h-4 w-4 text-brand-primary" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Connections */}
            <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-6 border border-ui-border/50">
              <h4 className="font-semibold mb-4 text-text-primary">Suggested Connections</h4>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-ui-surface/30 rounded-lg hover:bg-ui-surface/50 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-secondary to-brand-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-text-primary">G{i}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-text-primary">Gamer{i}</p>
                      <p className="text-xs text-text-secondary">Valorant • Diamond</p>
                    </div>
                    <button className="bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary px-3 py-1 rounded-md text-xs border border-brand-primary/20 transition-colors">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => router.push('/explore')}
                className="w-full mt-4 text-brand-primary hover:text-brand-primary/80 text-sm font-medium transition-colors"
              >
                See all suggestions
              </button>
            </div>

            {/* Activity Stats */}
            <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-6 border border-ui-border/50">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-green-400" />
                <h4 className="font-semibold text-text-primary">Your Stats</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-text-secondary text-sm">Games</span>
                  </div>
                  <span className="font-bold text-text-primary">{userGames.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-brand-primary" />
                    <span className="text-text-secondary text-sm">Posts</span>
                  </div>
                  <span className="font-bold text-text-primary">{posts.filter(p => p.user_id === user?.id).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-brand-primary" />
                    <span className="text-text-secondary text-sm">Connections</span>
                  </div>
                  <span className="font-bold text-text-primary">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span className="text-text-secondary text-sm">Hours Played</span>
                  </div>
                  <span className="font-bold text-text-primary">{fakeHoursPlayed}h</span>
                </div>
              </div>
              
              {/* Mini activity chart */}
              <div className="mt-4 pt-4 border-t border-ui-border/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-text-secondary">Weekly Activity</span>
                  <span className="text-xs text-green-400">+12%</span>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {weeklyActivityData.map((height, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-t from-brand-primary/50 to-brand-secondary/50 rounded-sm flex-1"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-ui-surface/50 backdrop-blur-xl rounded-xl p-6 border border-ui-border/50">
              <h4 className="font-semibold mb-4 text-text-primary">Recent Activity</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-ui-surface/30">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/20">
                    <Gamepad2 className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-secondary">Played Valorant</p>
                    <p className="text-xs text-text-muted">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-ui-surface/30">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded-lg flex items-center justify-center border border-brand-primary/20">
                    <UserPlus className="h-4 w-4 text-brand-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-secondary">New connection request</p>
                    <p className="text-xs text-text-muted">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-ui-surface/30">
                  <div className="w-8 h-8 bg-brand-secondary/20 rounded-lg flex items-center justify-center border border-brand-secondary/20">
                    <Calendar className="h-4 w-4 text-brand-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-text-secondary">3 friends available now</p>
                    <p className="text-xs text-text-muted">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Fullscreen Video Player Modal */}
      <FullscreenVideoPlayer
        isOpen={fullscreenVideo.isOpen}
        onClose={closeFullscreenVideo}
        videoId={fullscreenVideo.videoId}
        isShorts={fullscreenVideo.isShorts}
        post={fullscreenVideo.post}
      />
    </div>
  )
}