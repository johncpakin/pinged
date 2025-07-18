'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/auth-helpers-nextjs'
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
  Play
} from 'lucide-react'

interface UserProfile {
  id: string
  display_name: string
  avatar_url?: string
  bio?: string
  region?: string
  timezone?: string
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
  const [user, setUser] = useState<User | null>(null)
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
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      await loadUserData(user.id)
      await loadPosts()
      setLoading(false)
    }

    getUser()
  }, [supabase.auth, router]) // Removed loadUserData and loadPosts from deps to avoid infinite loop

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      setProfile(profileData)

      // Load user games
      const { data: gamesData } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', userId)
      
      setUserGames(gamesData || [])

      // Load availability
      const { data: availabilityData } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', userId)
        .order('day_of_week')
      
      setAvailability(availabilityData || [])
    } catch (error) {
      console.error('Error loading user data:', error)
    }
  }

  const loadPosts = async () => {
    try {
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          user:users(id, display_name, avatar_url, region)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      
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
          user:users(id, display_name, avatar_url, region)
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
    await supabase.auth.signOut()
    router.push('/')
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const isCurrentlyAvailable = getCurrentAvailability()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Gamepad2 className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">Pinged.gg</span>
              </div>
              
              <div className="hidden md:flex items-center gap-4 ml-8">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeFilter === 'all' ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`}
                >
                  All Posts
                </button>
                <button
                  onClick={() => setActiveFilter('lfg')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeFilter === 'lfg' ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`}
                >
                  LFG
                </button>
                <button
                  onClick={() => setActiveFilter('clips')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    activeFilter === 'clips' ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`}
                >
                  Clips
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-700 rounded-lg">
                <Search className="h-5 w-5" />
              </button>
              <button className="p-2 hover:bg-gray-700 rounded-lg">
                <Bell className="h-5 w-5" />
              </button>
              <button 
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-gray-700 rounded-lg"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button 
                onClick={handleSignOut}
                className="p-2 hover:bg-gray-700 rounded-lg text-red-400"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Left Sidebar - User Profile */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="text-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold">
                    {profile?.display_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold">{profile?.display_name}</h3>
                <p className="text-gray-400 text-sm">{profile?.region}</p>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className={`w-2 h-2 rounded-full ${isCurrentlyAvailable ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <span className="text-xs text-gray-400">
                    {isCurrentlyAvailable ? 'Available to play' : 'Not available'}
                  </span>
                </div>
              </div>

              {profile?.bio && (
                <p className="text-gray-300 text-sm mb-4">{profile.bio}</p>
              )}

              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/explore')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Find Teammates
                </button>
                <button 
                  onClick={() => router.push('/profile')}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h4 className="font-semibold mb-4">Your Games</h4>
              <div className="space-y-3">
                {userGames.slice(0, 3).map((game) => (
                  <div key={game.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{game.game_name}</p>
                      <p className="text-xs text-gray-400">{game.platform}</p>
                    </div>
                    {game.rank && (
                      <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                        {game.rank}
                      </span>
                    )}
                  </div>
                ))}
                {userGames.length > 3 && (
                  <p className="text-xs text-gray-400">+{userGames.length - 3} more</p>
                )}
              </div>
            </div>

            {/* Next Available */}
            {availability.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  This Week
                </h4>
                <div className="space-y-2">
                  {availability.slice(0, 3).map((slot, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">{DAYS[slot.day_of_week]}</span>
                      <span className="text-gray-400">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2">
            {/* New Post */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              {!showNewPost ? (
                <button
                  onClick={() => setShowNewPost(true)}
                  className="w-full text-left p-4 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-400">What's happening in your gaming world?</span>
                  </div>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {profile?.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="Share an update, look for teammates, or post a clip..."
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <select
                      value={newPostGame}
                      onChange={(e) => setNewPostGame(e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
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
                        className="px-4 py-2 text-gray-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={createPost}
                        disabled={!newPostContent.trim()}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="font-bold">
                        {post.user.display_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{post.user.display_name}</h4>
                        {post.user.region && (
                          <span className="text-xs text-gray-400">• {post.user.region}</span>
                        )}
                        {post.game_tag && (
                          <span className="text-xs bg-purple-600 px-2 py-1 rounded-full">
                            {post.game_tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">{formatTimeAgo(post.created_at)}</p>
                    </div>
                  </div>

                  <p className="text-gray-200 mb-4 leading-relaxed">{post.content}</p>

                  {post.media_url && (
                    <div className="mb-4">
                      <div className="bg-gray-700 rounded-lg p-4 text-center">
                        <Play className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Media content</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-gray-400">
                    <button className="flex items-center gap-2 hover:text-red-400 transition-colors">
                      <Heart className="h-5 w-5" />
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
                    <button className="flex items-center gap-2 hover:text-gray-200 transition-colors">
                      <Share className="h-5 w-5" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              ))}

              {posts.length === 0 && (
                <div className="bg-gray-800 rounded-lg p-12 text-center">
                  <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Welcome to your feed!</h3>
                  <p className="text-gray-400 mb-6">
                    Start connecting with other gamers to see posts in your feed.
                  </p>
                  <button 
                    onClick={() => router.push('/explore')}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium"
                  >
                    Explore Gamers
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar - Suggestions & Activity */}
          <div className="lg:col-span-1">
            {/* Trending Games */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Trending Games
              </h4>
              <div className="space-y-3">
                {['Valorant', 'League of Legends', 'CS2', 'Overwatch 2'].map((game, index) => (
                  <div key={game} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{game}</p>
                      <p className="text-xs text-gray-400">{Math.floor(Math.random() * 1000) + 100} active</p>
                    </div>
                    <span className="text-xs text-blue-400">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Who to Connect */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h4 className="font-semibold mb-4">Suggested Connections</h4>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold">G{i}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">Gamer{i}</p>
                      <p className="text-xs text-gray-400">Valorant • Diamond</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs">
                      Connect
                    </button>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => router.push('/explore')}
                className="w-full mt-4 text-blue-400 hover:text-blue-300 text-sm"
              >
                See all suggestions
              </button>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h4 className="font-semibold mb-4">Recent Activity</h4>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>You played Valorant 2 hours ago</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <UserPlus className="h-4 w-4" />
                  <span>ProPlayer123 wants to connect</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar className="h-4 w-4" />
                  <span>3 friends are available now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}