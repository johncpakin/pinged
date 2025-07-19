'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Gamepad2, Users, Calendar, Search, ArrowRight, Mail, Zap, Trophy, Target, Shield } from 'lucide-react'

export default function LandingPage() {
  const [loading, setLoading] = useState(true)
  const [authLoading, setAuthLoading] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isClient, setIsClient] = useState(false)
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const router = useRouter()
  const supabase = createClient()

useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setLoading(false)
      
      // If user is already logged in, redirect to home or onboarding
      if (user) {
        // Check if user has completed onboarding by checking if they have a profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profile && profile.display_name) {
          router.push('/home')
        } else {
          router.push('/onboarding')
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push('/onboarding')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  useEffect(() => {
    setIsClient(true)
    const timer = setTimeout(() => setLoading(false), 1000)

    const handleScroll = () => setScrollY(window.scrollY)
    const handleMouseMove = (e) => {
      setMousePosition({ 
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      })
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('mousemove', handleMouseMove)
    
    // Intersection Observer for fade-in animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up')
        }
      })
    }, observerOptions)

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el))

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      observer.disconnect()
    }
  }, [])
  
const handleGoogleLogin = async () => {
    setAuthLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (error) throw error
    } catch (error) {
      console.error('Error during Google login:', error)
      setAuthLoading(false)
    }
  }

  const handleEmailSignup = () => {
    router.push('/auth/signup')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-cyan-900/30"></div>
        <div className="absolute inset-0">
          {isClient && [...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full opacity-20 animate-pulse"
              style={{
                left: `${(i * 19 + 31) % 100}%`,
                top: `${(i * 23 + 41) % 100}%`,
                width: `${(i % 3) + 1}px`,
                height: `${(i % 3) + 1}px`,
                animationDelay: `${(i * 0.04) % 2}s`,
                animationDuration: `${2 + (i % 3)}s`
              }}
            />
          ))}
        </div>
        <div className="relative z-10">
          <div className="bg-gradient-to-r from-purple-600 to-cyan-400 p-6 rounded-full animate-spin">
            <Gamepad2 className="h-16 w-16 text-white" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.5); }
          50% { box-shadow: 0 0 40px rgba(168, 85, 247, 0.8), 0 0 60px rgba(168, 85, 247, 0.4); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
        .animate-glow { animation: glow 2s ease-in-out infinite; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-slide-in-left { animation: slideInLeft 0.8s ease-out forwards; }
        .animate-slide-in-right { animation: slideInRight 0.8s ease-out forwards; }
        .parallax-bg { transform: translateY(${scrollY * 0.5}px); }
        .parallax-mid { transform: translateY(${scrollY * 0.3}px); }
        .parallax-front { transform: translateY(${scrollY * 0.1}px); }
      `}</style>

      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-cyan-900/20"></div>
        
        {/* Floating particles - only render on client */}
        {isClient && [...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-gradient-to-r from-purple-400 to-cyan-400 rounded-full opacity-10 animate-pulse"
            style={{
              left: `${(i * 17 + 23) % 100}%`,
              top: `${(i * 13 + 37) % 100}%`,
              width: `${(i % 4) + 1}px`,
              height: `${(i % 4) + 1}px`,
              animationDelay: `${(i * 0.1) % 5}s`,
              animationDuration: `${3 + (i % 4)}s`
            }}
          />
        ))}

        {/* Dynamic gradient orbs following mouse */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-purple-600/30 to-cyan-600/30 rounded-full blur-3xl transition-all duration-1000 ease-out"
          style={{
            left: `${mousePosition.x - 12}%`,
            top: `${mousePosition.y - 12}%`,
          }}
        />
        <div
          className="absolute w-64 h-64 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full blur-2xl transition-all duration-1500 ease-out"
          style={{
            left: `${mousePosition.x - 8}%`,
            top: `${mousePosition.y - 8}%`,
          }}
        />
      </div>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 parallax-bg">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 via-transparent to-cyan-900/40"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <div className="flex justify-center mb-8 animate-float">
              <div className="relative">
                <div className="bg-gradient-to-r from-purple-600 to-cyan-400 p-6 rounded-full animate-glow">
                  <Gamepad2 className="h-20 w-20 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full opacity-30 animate-ping"></div>
              </div>
            </div>
          </div>
          
          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <h1 className="text-6xl md:text-8xl font-black mb-6 bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
              PINGED<span className="text-cyan-400">.GG</span>
            </h1>
          </div>
          
          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
            <div className="relative mb-8">
              <p className="text-2xl md:text-4xl text-gray-300 mb-4 font-bold tracking-wide">
                THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">ULTIMATE</span> GAMING NETWORK
              </p>
              <p className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                Connect with elite gamers • Build unstoppable squads • Dominate every match
              </p>
            </div>
          </div>
          
          <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
              <button
                onClick={handleGoogleLogin}
                disabled={authLoading}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-12 py-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed min-w-[280px] border border-purple-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative flex items-center gap-3 justify-center">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {authLoading ? '🎮 CONNECTING...' : '🚀 JOIN THE ELITE'}
                </div>
              </button>
              
              <button
                onClick={handleEmailSignup}
                disabled={authLoading}
                className="group relative overflow-hidden bg-transparent border-2 border-cyan-400 hover:bg-cyan-400 text-cyan-400 hover:text-black px-12 py-6 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed min-w-[280px]"
              >
                <div className="absolute inset-0 bg-cyan-400 -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <div className="relative flex items-center gap-3 justify-center">
                  <Mail className="h-6 w-6" />
                  ⚡ EMAIL SIGNUP
                </div>
              </button>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-cyan-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-cyan-400 rounded-full mt-2 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Gaming-themed decorative elements */}
        <div className="absolute top-20 left-10 text-purple-400 opacity-30 animate-float" style={{ animationDelay: '1s' }}>
          <Target className="h-12 w-12" />
        </div>
        <div className="absolute top-40 right-16 text-cyan-400 opacity-30 animate-float" style={{ animationDelay: '2s' }}>
          <Shield className="h-16 w-16" />
        </div>
        <div className="absolute bottom-40 left-20 text-purple-400 opacity-30 animate-float" style={{ animationDelay: '3s' }}>
          <Trophy className="h-14 w-14" />
        </div>
        <div className="absolute bottom-60 right-10 text-cyan-400 opacity-30 animate-float" style={{ animationDelay: '1.5s' }}>
          <Zap className="h-10 w-10" />
        </div>
      </section>

{/* Features Section */}
<section className="relative py-32">
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent"></div>
  
  <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="text-center mb-20">
      <h2 className="text-4xl md:text-6xl font-black mb-6 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
        LEVEL UP YOUR GAME
      </h2>
      <p className="text-xl text-gray-300 font-semibold tracking-wide">
        🎮 BUILT BY LEGENDS, FOR LEGENDS 🎮
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
      {[
        {
          icon: Users,
          title: "SQUAD FINDER",
          description: "AI-powered matching system finds your perfect teammates based on skill, rank, and gaming DNA.",
          color: "from-purple-600 to-purple-400"
        },
        {
          icon: Calendar,
          title: "SYNC MODE",
          description: "Real-time availability tracking. Get instantly pinged when your squad is ready to dominate.",
          color: "from-cyan-600 to-cyan-400"
        },
        {
          icon: Trophy,
          title: "PRO PROFILES",
          description: "Showcase your ranks, achievements, and playstyle. Let your skills do the talking.",
          color: "from-purple-600 to-cyan-400"
        }
      ].map((feature, index) => (
        <div key={index} className="group">
          <div className="relative bg-gradient-to-br from-gray-800/80 to-gray-900/80 p-8 rounded-2xl border border-gray-700/50 hover:border-purple-500/50 transition-all duration-500 transform hover:scale-105 hover:shadow-2xl backdrop-blur-sm h-80 flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/10 to-cyan-900/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center h-full">
              <div className={`bg-gradient-to-r ${feature.color} p-4 rounded-2xl w-20 h-20 mb-6 flex items-center justify-center group-hover:animate-pulse`}>
                <feature.icon className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-wide">{feature.title}</h3>
              <div className="flex-1 flex items-center">
                <p className="text-gray-300 leading-relaxed text-center">
                  {feature.description}
                </p>
              </div>
            </div>

            <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-500 -z-10`}></div>
          </div>
        </div>
      ))}
    </div>
  </div>
</section>

{/* CTA Section */}
<section className="relative py-32">
  <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 via-blue-900/80 to-cyan-900/80"></div>
  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.3)_0%,transparent_70%)]"></div>
  
  <div className="relative z-10 max-w-5xl mx-auto text-center px-4 sm:px-6 lg:px-8">
    <h2 className="text-4xl md:text-6xl font-black mb-8 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent">
      READY TO DOMINATE?
    </h2>
    <p className="text-xl md:text-2xl text-gray-200 mb-12 font-semibold">
      🔥 JOIN <span className="text-cyan-400 font-black">50K+</span> ELITE GAMERS ALREADY CRUSHING IT 🔥
    </p>
    
    <div className="flex justify-center">
      <button
        onClick={handleGoogleLogin}
        disabled={authLoading}
        className="group relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600 hover:from-purple-500 hover:via-pink-500 hover:to-cyan-500 text-white px-12 md:px-16 py-6 md:py-8 rounded-2xl font-black text-lg md:text-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        <div className="relative flex items-center gap-4 justify-center">
          🚀 ENTER THE ARENA <ArrowRight className="h-6 w-6 md:h-8 md:w-8" />
        </div>
      </button>
    </div>
  </div>
</section>

      {/* Footer */}
      <footer className="relative bg-black border-t border-purple-500/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-cyan-400 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Gamepad2 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                PINGED.GG
              </h3>
            </div>
            <p className="text-gray-400 text-lg font-semibold">
              © 2024 Pinged.gg • 🎮 FORGED BY GAMERS, FOR GAMERS 🎮
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}