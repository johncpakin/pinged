'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Calendar,
  Gamepad2,
  Users,
  UserPlus,
  UserCheck,
  MessageCircle,
  Settings,
  Share,
  Trophy,
  Target,
  Zap
} from 'lucide-react'
import Link from 'next/link'

interface UserProfile {
  id: string
  display_name: string
  username: string
  avatar_url?: string
  bio?: string
  region?: string
  timezone?: string
  created_at: string
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

interface Post {
  id: string
  content: string
  media_url?: string
  game_tag?: string
  created_at: string
}

interface Connection {
  id: string
  status: 'pending' | 'accepted' | 'blocked'
  user_id: string
  target_user_id: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function UserProfilePage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [games, setGames] = useState<UserGame[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [connection, setConnection] = useState<Connection | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionLoading, setConnectionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const router = useRouter()
  const params = useParams()
  const username = params.username as string
  const supabase = createClient()

  useEffect(() => {
    const initializePage = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setCurrentUser(user)

      // Load profile data
      await loadProfileData()
      setLoading(false)
    }

    initializePage()
  }, [username, router])

  const loadProfileData = async () => {
    try {
      console.log('Looking up username:', username)
      
      // Load user profile by username
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single()

      if (profileError) {
        console.error('Profile not found:', profileError)
        router.push('/home')
        return
      }

      console.log('Profile found:', profileData)
      setProfile(profileData)
      const profileId = profileData.id

      // Load user games
      const { data: gamesData } = await supabase
        .from('user_games')
        .select('*')
        .eq('user_id', profileId)

      setGames(gamesData || [])

      // Load availability
      const { data: availabilityData } = await supabase
        .from('availability')
        .select('*')
        .eq('user_id', profileId)
        .order('day_of_week')

      setAvailability(availabilityData || [])

      // Load recent posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', profileId)
        .order('created_at', { ascending: false })
        .limit(5)

      setPosts(postsData || [])

      // Check connection status (if viewing someone else's profile)
      if (currentUser && currentUser.id !== profileId) {
        const { data: connectionData } = await supabase
          .from('connections')
          .select('*')
          .or(`and(user_id.eq.${currentUser.id},target_user_id.eq.${profileId}),and(user_id.eq.${profileId},target_user_id.eq.${currentUser.id})`)
          .single()

        setConnection(connectionData)
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
      router.push('/home')
    }
  }

  const handleConnect = async () => {
    if (!currentUser || !profile || currentUser.id === profile.id) return

    setConnectionLoading(true)
    try {
      if (connection) {
        if (connection.status === 'pending' && connection.user_id === currentUser.id) {
          // Cancel pending request
          await supabase
            .from('connections')
            .delete()
            .eq('id', connection.id)
          setConnection(null)
        } else if (connection.status === 'pending' && connection.target_user_id === currentUser.id) {
          // Accept incoming request
          await supabase
            .from('connections')
            .update({ status: 'accepted' })
            .eq('id', connection.id)
          setConnection({ ...connection, status: 'accepted' })
        }
      } else {
        // Send new connection request
        const { data, error } = await supabase
          .from('connections')
          .insert({
            user_id: currentUser.id,
            target_user_id: profile.id,
            status: 'pending'
          })
          .select()
          .single()

        if (!error && data) {
          setConnection(data)
        }
      }
    } catch (error) {
      console.error('Error managing connection:', error)
    } finally {
      setConnectionLoading(false)
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

  const getConnectionButtonText = () => {
    if (!connection) return 'Connect'
    if (connection.status === 'accepted') return 'Connected'
    if (connection.status === 'pending' && connection.user_id === currentUser?.id) return 'Request Sent'
    if (connection.status === 'pending' && connection.target_user_id === currentUser?.id) return 'Accept Request'
    return 'Connect'
  }

  const getConnectionButtonIcon = () => {
    if (!connection) return UserPlus
    if (connection.status === 'accepted') return UserCheck
    if (connection.status === 'pending') return Clock
    return UserPlus
  }

  const isOwnProfile = currentUser?.id === profile?.id

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-gray-400 mb-6">This user doesn&apos;t exist or has been removed.</p>
          <Link href="/home" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const ConnectionIcon = getConnectionButtonIcon()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`)}
                className="p-2 hover:bg-gray-700 rounded-lg"
                title="Copy profile link"
              >
                <Share className="h-5 w-5" />
              </button>
              {isOwnProfile && (
                <Link href="/settings" className="p-2 hover:bg-gray-700 rounded-lg">
                  <Settings className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-4xl font-bold">
                {profile.display_name?.charAt(0).toUpperCase()}
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2">{profile.display_name}</h1>
                  <p className="text-blue-400 text-lg mb-2">@{profile.username}</p>
                  <div className="flex items-center gap-4 text-gray-400">
                    {profile.region && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.region}</span>
                      </div>
                    )}
                    {profile.timezone && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{profile.timezone.replace('_', ' ')}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <div className="flex gap-3 mt-4 md:mt-0">
                    <button
                      onClick={handleConnect}
                      disabled={connectionLoading}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        connection?.status === 'accepted'
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <ConnectionIcon className="h-5 w-5" />
                      {connectionLoading ? 'Loading...' : getConnectionButtonText()}
                    </button>
                    <button className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg">
                      <MessageCircle className="h-5 w-5" />
                      Message
                    </button>
                  </div>
                )}
              </div>

              {profile.bio && (
                <p className="text-gray-300 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8">
          {['overview', 'games', 'activity'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Games Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Gamepad2 className="h-5 w-5 text-blue-400" />
                    Games & Ranks
                  </h2>
                  {games.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {games.map((game) => (
                        <div key={game.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold">{game.game_name}</h3>
                            {game.rank && (
                              <span className="bg-blue-600 text-sm px-2 py-1 rounded">
                                {game.rank}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{game.platform}</p>
                          {game.tags && game.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {game.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="bg-gray-600 text-xs px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No games added yet.</p>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-400" />
                    Recent Activity
                  </h2>
                  {posts.length > 0 ? (
                    <div className="space-y-4">
                      {posts.map((post) => (
                        <div key={post.id} className="bg-gray-700 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            {post.game_tag && (
                              <span className="bg-purple-600 text-xs px-2 py-1 rounded-full">
                                {post.game_tag}
                              </span>
                            )}
                            <span className="text-gray-400 text-sm">
                              {formatTimeAgo(post.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-200">{post.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No recent activity.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'games' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">All Games</h2>
                {games.length > 0 ? (
                  <div className="grid gap-4">
                    {games.map((game) => (
                      <div key={game.id} className="bg-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold">{game.game_name}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">{game.platform}</span>
                            {game.rank && (
                              <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                                {game.rank}
                              </span>
                            )}
                          </div>
                        </div>
                        {game.tags && game.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {game.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="bg-gray-600 px-3 py-1 rounded-full text-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No games added yet.</p>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">All Posts</h2>
                {posts.length > 0 ? (
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <div key={post.id} className="bg-gray-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-3">
                          {post.game_tag && (
                            <span className="bg-purple-600 px-3 py-1 rounded-full text-sm">
                              {post.game_tag}
                            </span>
                          )}
                          <span className="text-gray-400">
                            {formatTimeAgo(post.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-200 leading-relaxed">{post.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No posts yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Availability */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-green-400" />
                Availability
              </h3>
              {availability.length > 0 ? (
                <div className="space-y-3">
                  {availability.map((slot, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{DAYS_SHORT[slot.day_of_week]}</span>
                      <span className="text-gray-400 text-sm">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No availability set</p>
              )}
            </div>

            {/* Stats */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Profile Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Games</span>
                  <span className="font-medium">{games.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Posts</span>
                  <span className="font-medium">{posts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Member since</span>
                  <span className="font-medium">
                    {new Date(profile.created_at).getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}