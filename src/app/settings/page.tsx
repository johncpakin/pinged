'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Palette } from 'lucide-react'
import { ThemeSelector } from '@/components/theme/ThemeProvider'

export default function SettingsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-ui-background text-text-primary">
      {/* Header */}
      <header className="bg-ui-surface/80 backdrop-blur-xl border-b border-ui-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-ui-surface-hover/50 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-text-secondary" />
              </button>
              <h1 className="text-xl font-bold text-text-primary">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-ui-surface/50 backdrop-blur-xl rounded-2xl p-8 border border-ui-border/50">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Appearance</h2>
              <p className="text-text-secondary">
                Customize how PINGED.GG looks and feels for you.
              </p>
            </div>

            {/* Theme Selector */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="h-5 w-5 text-brand-primary" />
                <h3 className="text-lg font-semibold text-text-primary">Theme</h3>
              </div>
              
              <ThemeSelector />
              
              {/* Preview Section */}
              <div className="space-y-4 mt-8">
                <h4 className="text-sm font-medium text-text-primary">Preview</h4>
                <div className="p-6 bg-ui-surface rounded-xl border border-ui-border/50">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-brand-gradient rounded-full flex items-center justify-center">
                      <span className="font-bold text-text-primary">P</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-text-primary">Sample Post</h3>
                      <p className="text-text-secondary text-sm">@username</p>
                    </div>
                  </div>
                  <p className="text-text-secondary mb-4">
                    This is how your posts will look with the selected theme!
                  </p>
                  <div className="flex gap-3">
                    <button className="bg-brand-primary hover:bg-brand-primary-hover text-text-primary px-4 py-2 rounded-lg font-medium transition-colors">
                      Primary Button
                    </button>
                    <button className="bg-brand-secondary hover:bg-brand-secondary-hover text-text-primary px-4 py-2 rounded-lg font-medium transition-colors">
                      Secondary Button
                    </button>
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