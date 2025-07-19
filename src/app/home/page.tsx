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

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: newPostContent,
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500/20 border-t-blue-400 mx-auto mb-4"></div>
          <p className="text-slate-400 text-sm">Loading your gaming dashboard...</p>
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Enhanced Header */}
      <header className="bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-xl">
                  <Gamepad2 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Pinged.gg
                </span>
              </div>
              
              <div className="hidden md:flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                {[
                  { key: 'all', label: 'All Posts', icon: TrendingUp },
                  { key: 'lfg', label: 'LFG', icon: Users },
                  { key: 'clips', label: 'Clips', icon: Play }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveFilter(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeFilter === key 
                        ? 'bg-blue-500/20 text-blue-400 shadow-lg' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors relative">
                <Search className="h-5 w-5 text-slate-400" />
              </button>
              <button className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors relative">
                <Bell className="h-5 w-5 text-slate-400" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              </button>
              <button 
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              >
                <Settings className="h-5 w-5 text-slate-400" />
              </button>
              <button 
                onClick={handleSignOut}
                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Enhanced Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* User Profile Card */}
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
              <div className="text-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {profile?.display_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isCurrentlyAvailable && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{profile?.display_name}</h3>
                <p className="text-blue-400 text-sm mb-2">@{profile?.username}</p>
                <p className="text-slate-400 text-xs">{profile?.region}</p>
                
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className={`w-2 h-2 rounded-full ${isCurrentlyAvailable ? 'bg-green-400' : 'bg-slate-500'}`} />
                  <span className="text-xs text-slate-400">
                    {isCurrentlyAvailable ? 'Available to play' : 'Not available'}
                  </span>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-slate-300 text-sm mb-6 leading-relaxed">{profile.bio}</p>
              )}

              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/explore')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Find Teammates
                </button>
                <button 
                  onClick={() => router.push(`/u/${profile?.username}`)}
                  className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-white py-3 px-4 rounded-xl font-medium transition-all border border-slate-600/50"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Games Card */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-5 w-5 text-purple-400" />
                <h4 className="font-semibold text-white">Your Games</h4>
              </div>
              <div className="space-y-3">
                {userGames.slice(0, 3).map((game) => (
                  <div key={game.id} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <p className="font-medium text-sm text-white">{game.game_name}</p>
                      <p className="text-xs text-slate-400">{game.platform}</p>
                    </div>
                    {game.rank && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">
                        {game.rank}
                      </span>
                    )}
                  </div>
                ))}
                {userGames.length > 3 && (
                  <p className="text-xs text-slate-500 text-center">+{userGames.length - 3} more games</p>
                )}
                {userGames.length === 0 && (
                  <p className="text-slate-500 text-sm text-center py-4">No games added yet</p>
                )}
              </div>
            </div>

            {/* Availability Card */}
            {availability.length > 0 && (
              <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-green-400" />
                  <h4 className="font-semibold text-white">This Week</h4>
                </div>
                <div className="space-y-2">
                  {availability.slice(0, 4).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between text-sm py-2">
                      <span className="text-slate-300 font-medium">{DAYS[slot.day_of_week]}</span>
                      <span className="text-slate-400 text-xs">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Enhanced Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {/* New Post Card */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              {!showNewPost ? (
                <button
                  onClick={() => setShowNewPost(true)}
                  className="w-full text-left p-4 bg-slate-800/30 hover:bg-slate-700/30 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-slate-400">What&apos;s happening in your gaming world?</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share an update, look for teammates, or post a clip..."
                        className="w-full bg-slate-800/50 border border-slate-600/50 rounded-xl p-4 resize-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-slate-400"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <select
                      value={newPostGame}
                      onChange={(e) => setNewPostGame(e.target.value)}
                      className="bg-slate-800/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="">Select game (optional)</option>
                      {userGames.map((game) => (
                        <option key={game.id} value={game.game_name}>
                          {game.game_name}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowNewPost(false)}
                        className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createPost}
                        disabled={!newPostContent.trim()}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium text-white transition-all"
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
                <div key={post.id} className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="font-bold text-white">
                        {post.user.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-white">{post.user.display_name}</h4>
                        <span className="text-blue-400 text-sm">@{post.user.username}</span>
                        {post.user.region && (
                          <span className="text-xs text-slate-500">• {post.user.region}</span>
                        )}
                        {post.game_tag && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full border border-purple-500/20">
                            {post.game_tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-slate-200 mb-4 leading-relaxed">{post.content}</p>

                  {post.media_url && (
                    <div className="mb-4">
                      <div className="bg-slate-800/50 rounded-lg p-6 text-center border border-slate-700/50">
                        <Play className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">Media content</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-slate-400">
                    <button className="flex items-center gap-2 hover:text-red-400 transition-colors group">
                      <Heart className="h-5 w-5 group-hover:fill-current" />
                      <span className="text-sm">Like</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                      <MessageCircle className="h-5 w-5" />
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-green-400 transition-colors">
                      <UserPlus className="h-5 w-5" />
                      <span className="text-sm">Connect</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-slate-200 transition-colors">
                      <Share className="h-5 w-5" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-12 text-center border border-slate-700/50">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">Welcome to your feed!</h3>
                  <p className="text-slate-400 mb-6">
                    Start connecting with other gamers to see posts in your feed.
                  </p>
                  <button 
                    onClick={() => router.push('/explore')}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-3 rounded-xl font-medium text-white transition-all shadow-lg"
                  >
                    Explore Gamers
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Trending Games */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-orange-400" />
                <h4 className="font-semibold text-white">Trending Games</h4>
              </div>
              <div className="space-y-3">
                {trendingGamesData.map((game) => (
                  <div key={game.name} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg hover:bg-slate-700/30 transition-colors cursor-pointer">
                    <div>
                      <p className="font-medium text-sm text-white">{game.name}</p>
                      <p className="text-xs text-slate-400">{game.active} active</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-orange-400 font-medium">#{game.rank}</span>
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-lg flex items-center justify-center border border-orange-500/20">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Connections */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h4 className="font-semibold mb-4 text-white">Suggested Connections</h4>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-700/30 transition-colors">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-white">G{i}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-white">Gamer{i}</p>
                      <p className="text-xs text-slate-400">Valorant • Diamond</p>
                    </div>
                    <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded-md text-xs border border-blue-500/20 transition-colors">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => router.push('/explore')}
                className="w-full mt-4 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
              >
                See all suggestions
              </button>
            </div>

            {/* Activity Stats */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-green-400" />
                <h4 className="font-semibold text-white">Your Stats</h4>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    <span className="text-slate-300 text-sm">Games</span>
                  </div>
                  <span className="font-bold text-white">{userGames.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <span className="text-slate-300 text-sm">Posts</span>
                  </div>
                  <span className="font-bold text-white">{posts.filter(p => p.user_id === user?.id).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span className="text-slate-300 text-sm">Connections</span>
                  </div>
                  <span className="font-bold text-white">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-400" />
                    <span className="text-slate-300 text-sm">Hours Played</span>
                  </div>
                  <span className="font-bold text-white">{fakeHoursPlayed}h</span>
                </div>
              </div>
              
              {/* Mini activity chart */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">Weekly Activity</span>
                  <span className="text-xs text-green-400">+12%</span>
                </div>
                <div className="flex items-end gap-1 h-8">
                  {weeklyActivityData.map((height, i) => (
                    <div 
                      key={i}
                      className="bg-gradient-to-t from-blue-500/50 to-purple-500/50 rounded-sm flex-1"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl p-6 border border-slate-700/50">
              <h4 className="font-semibold mb-4 text-white">Recent Activity</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center border border-green-500/20">
                    <Gamepad2 className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300">Played Valorant</p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/20">
                    <UserPlus className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300">New connection request</p>
                    <p className="text-xs text-slate-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/30">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center border border-purple-500/20">
                    <Calendar className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-300">3 friends available now</p>
                    <p className="text-xs text-slate-500">Just now</p>
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