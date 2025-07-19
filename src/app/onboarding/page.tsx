'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { 
  Gamepad2, 
  User as UserIcon, 
  Calendar, 
  Check, 
  ArrowRight, 
  ArrowLeft,
  Plus,
  X
} from 'lucide-react'

interface UserData {
  id: string
  email?: string
  user_metadata?: any
}

interface UserProfile {
  display_name: string
  username: string
  bio: string
  region: string
  timezone: string
}

interface GameEntry {
  game_name: string
  platform: string
  rank: string
  tags: string[]
}

interface AvailabilitySlot {
  day_of_week: number
  start_time: string
  end_time: string
}

const POPULAR_GAMES = [
  'League of Legends', 'Valorant', 'CS2', 'Overwatch 2', 'Apex Legends',
  'Rocket League', 'Fortnite', 'Call of Duty', 'Dota 2', 'Minecraft'
]

const PLATFORMS = ['PC', 'PlayStation 5', 'Xbox Series X/S', 'Nintendo Switch', 'Mobile']

const PLAYSTYLE_TAGS = [
  'Competitive', 'Casual', 'Chill', 'Sweaty', 'Coach', 'Learning', 
  'Team Player', 'IGL', 'Support', 'Carry', 'Flex'
]

const TIMEZONES = [
  'America/Los_Angeles', 'America/Denver', 'America/Chicago', 'America/New_York',
  'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Seoul',
  'Australia/Sydney'
]

const REGIONS = [
  'North America', 'Europe', 'Asia', 'Oceania', 'South America', 'Africa'
]

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function OnboardingPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Form data
  const [profile, setProfile] = useState<UserProfile>({
    display_name: '',
    username: '',
    bio: '',
    region: '',
    timezone: ''
  })
  const [games, setGames] = useState<GameEntry[]>([])
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([])

  // UI state
  const [newGame, setNewGame] = useState({ game_name: '', platform: '', rank: '', tags: [] as string[] })
  const [showGameForm, setShowGameForm] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameCheckTimeout, setUsernameCheckTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      
      // Pre-fill display name from auth metadata if available
      const userName = user.user_metadata?.full_name || 
                      user.user_metadata?.name || 
                      user.user_metadata?.display_name ||
                      user.email?.split('@')[0] || 
                      ''
      
      if (userName && !profile.display_name) {
        setProfile(prev => ({
          ...prev,
          display_name: userName
        }))
      }
      
      setLoading(false)
    }

    getUser()
  }, [supabase.auth, router, profile.display_name])

  const handleProfileUpdate = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
    
    // Special handling for username
    if (field === 'username') {
      const cleanUsername = value.toLowerCase().replace(/[^a-z0-9_]/g, '')
      setProfile(prev => ({ ...prev, username: cleanUsername }))
      
      // Clear existing timeout
      if (usernameCheckTimeout) {
        clearTimeout(usernameCheckTimeout)
      }
      
      // Validate format first
      if (cleanUsername.length === 0) {
        setUsernameStatus('idle')
        return
      }
      
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        setUsernameStatus('invalid')
        return
      }
      
      // Set checking status and debounce the API call
      setUsernameStatus('checking')
      const timeout = setTimeout(() => {
        checkUsernameAvailability(cleanUsername)
      }, 500)
      
      setUsernameCheckTimeout(timeout)
    }
  }

  const checkUsernameAvailability = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single()
      
      if (error && error.code === 'PGRST116') {
        // No rows returned - username is available
        setUsernameStatus('available')
      } else if (data) {
        // Username exists - taken
        setUsernameStatus('taken')
      } else {
        // Other error
        setUsernameStatus('invalid')
      }
    } catch (error) {
      console.error('Error checking username:', error)
      setUsernameStatus('invalid')
    }
  }

  const addGame = () => {
    if (newGame.game_name && newGame.platform) {
      setGames(prev => [...prev, { ...newGame }])
      setNewGame({ game_name: '', platform: '', rank: '', tags: [] })
      setShowGameForm(false)
    }
  }

  const removeGame = (index: number) => {
    setGames(prev => prev.filter((_, i) => i !== index))
  }

  const toggleGameTag = (tag: string) => {
    setNewGame(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }))
  }

  const addAvailabilitySlot = (day: number) => {
    setAvailability(prev => [...prev, {
      day_of_week: day,
      start_time: '18:00',
      end_time: '22:00'
    }])
  }

  const updateAvailabilitySlot = (index: number, field: string, value: string) => {
    setAvailability(prev => prev.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    ))
  }

  const removeAvailabilitySlot = (index: number) => {
    setAvailability(prev => prev.filter((_, i) => i !== index))
  }

  const handleFinish = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      // Save user profile
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          display_name: profile.display_name,
          username: profile.username,
          bio: profile.bio,
          region: profile.region,
          timezone: profile.timezone,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      // Save games
      if (games.length > 0) {
        const { error: gamesError } = await supabase
          .from('user_games')
          .insert(games.map(game => ({ ...game, user_id: user.id })))

        if (gamesError) throw gamesError
      }

      // Save availability
      if (availability.length > 0) {
        const { error: availabilityError } = await supabase
          .from('availability')
          .insert(availability.map(slot => ({ ...slot, user_id: user.id })))

        if (availabilityError) throw availabilityError
      }

      router.push('/home')
    } catch (error) {
      console.error('Error saving onboarding data:', error)
      alert('Error saving your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Welcome to <span className="text-blue-400">Pinged.gg</span></h1>
          <p className="text-gray-400">Let&apos;s set up your gaming profile</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {step > stepNum ? <Check className="h-5 w-5" /> : stepNum}
              </div>
              {stepNum < 3 && (
                <div className={`w-20 h-1 mx-2 ${
                  step > stepNum ? 'bg-blue-600' : 'bg-gray-700'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg p-8">
          {/* Step 1: Profile Info */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <UserIcon className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold">Profile Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Display Name *</label>
                  <input
                    type="text"
                    value={profile.display_name}
                    onChange={(e) => handleProfileUpdate('display_name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your gamer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Username *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-400 text-sm">@</span>
                    </div>
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) => handleProfileUpdate('username', e.target.value)}
                      className={`w-full pl-8 pr-10 py-3 bg-gray-700 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        usernameStatus === 'available' ? 'border-green-500' :
                        usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'border-red-500' :
                        'border-gray-600'
                      }`}
                      placeholder="your_username"
                      maxLength={20}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      {usernameStatus === 'checking' && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      )}
                      {usernameStatus === 'available' && (
                        <Check className="h-5 w-5 text-green-500" />
                      )}
                      {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-sm">
                    {usernameStatus === 'checking' && (
                      <span className="text-blue-400">Checking availability...</span>
                    )}
                    {usernameStatus === 'available' && (
                      <span className="text-green-400">✓ Username is available</span>
                    )}
                    {usernameStatus === 'taken' && (
                      <span className="text-red-400">✗ Username is already taken</span>
                    )}
                    {usernameStatus === 'invalid' && (
                      <span className="text-red-400">✗ Username must be 3-20 characters (letters, numbers, underscores)</span>
                    )}
                    {usernameStatus === 'idle' && (
                      <span className="text-gray-400">Your profile will be available at pinged.gg/@{profile.username || 'username'}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleProfileUpdate('bio', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Tell people about your gaming style and what you&apos;re looking for..."
                    rows={4}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Region</label>
                    <select
                      value={profile.region}
                      onChange={(e) => handleProfileUpdate('region', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select region</option>
                      {REGIONS.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Timezone</label>
                    <select
                      value={profile.timezone}
                      onChange={(e) => handleProfileUpdate('timezone', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select timezone</option>
                      {TIMEZONES.map(tz => (
                        <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Games */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Gamepad2 className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold">Your Games</h2>
              </div>

              {/* Existing Games */}
              <div className="space-y-4 mb-6">
                {games.map((game, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{game.game_name}</h3>
                      <p className="text-sm text-gray-400">
                        {game.platform} {game.rank && `• ${game.rank}`}
                      </p>
                      {game.tags.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {game.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 bg-blue-600 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeGame(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Game Form */}
              {showGameForm ? (
                <div className="bg-gray-700 p-6 rounded-lg mb-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Game</label>
                      <input
                        type="text"
                        list="popular-games"
                        value={newGame.game_name}
                        onChange={(e) => setNewGame(prev => ({ ...prev, game_name: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg"
                        placeholder="Start typing a game name..."
                      />
                      <datalist id="popular-games">
                        {POPULAR_GAMES.map(game => (
                          <option key={game} value={game} />
                        ))}
                      </datalist>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Platform</label>
                        <select
                          value={newGame.platform}
                          onChange={(e) => setNewGame(prev => ({ ...prev, platform: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg"
                        >
                          <option value="">Select platform</option>
                          {PLATFORMS.map(platform => (
                            <option key={platform} value={platform}>{platform}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Rank (optional)</label>
                        <input
                          type="text"
                          value={newGame.rank}
                          onChange={(e) => setNewGame(prev => ({ ...prev, rank: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg"
                          placeholder="e.g., Diamond, Gold, etc."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Playstyle Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {PLAYSTYLE_TAGS.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleGameTag(tag)}
                            className={`px-3 py-1 rounded-full text-sm ${
                              newGame.tags.includes(tag) 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={addGame}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                      >
                        Add Game
                      </button>
                      <button
                        onClick={() => setShowGameForm(false)}
                        className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowGameForm(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg w-full justify-center"
                >
                  <Plus className="h-5 w-5" />
                  Add a Game
                </button>
              )}
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Calendar className="h-6 w-6 text-blue-400" />
                <h2 className="text-2xl font-bold">When do you play?</h2>
              </div>

              <p className="text-gray-400 mb-6">
                Set your typical gaming hours so others can find you when you&apos;re available.
              </p>

              {/* Availability Slots */}
              <div className="space-y-4 mb-6">
                {availability.map((slot, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg flex items-center gap-4">
                    <div className="flex-1">
                      <span className="font-medium">{DAYS[slot.day_of_week]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => updateAvailabilitySlot(index, 'start_time', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-3 py-1"
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => updateAvailabilitySlot(index, 'end_time', e.target.value)}
                        className="bg-gray-600 border border-gray-500 rounded px-3 py-1"
                      />
                    </div>
                    <button
                      onClick={() => removeAvailabilitySlot(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Availability */}
              <div className="grid grid-cols-7 gap-2 mb-6">
                {DAYS.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => addAvailabilitySlot(index)}
                    disabled={availability.some(slot => slot.day_of_week === index)}
                    className={`p-3 rounded-lg text-sm ${
                      availability.some(slot => slot.day_of_week === index)
                        ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8">
            <button
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && (!profile.display_name || !profile.username || usernameStatus !== 'available')}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || !profile.display_name || !profile.username || usernameStatus !== 'available'}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Complete Setup'}
                <Check className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}