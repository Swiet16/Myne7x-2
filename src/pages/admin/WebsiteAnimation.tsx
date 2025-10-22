import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { WebsiteAnimations } from '@/components/WebsiteAnimations';
import { Loader2, Save, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AnimationSettings {
  id: string;
  animation_type: string;
  is_active: boolean;
  apply_to: 'home' | 'all';
}

const animationOptions = [
  { value: 'none', label: 'None', description: 'No animation' },
  { value: 'data-flow', label: 'Data Flow', description: 'Flowing data streams with connected particles' },
  { value: 'matrix-rain', label: 'Matrix Rain', description: 'Falling code characters' },
  { value: 'neural-network', label: 'Neural Network', description: 'Connected nodes like a brain network' },
  { value: 'particle-field', label: 'Particle Field', description: 'Floating particles' },
  { value: 'cosmic-dust', label: 'Cosmic Dust', description: 'Slow moving twinkling stars' },
  { value: 'binary-stream', label: 'Binary Stream', description: 'Flowing binary code (0s and 1s)' },
];

export const WebsiteAnimation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AnimationSettings | null>(null);
  const [previewAnimation, setPreviewAnimation] = useState('data-flow');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if user is super_admin
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
    loadSettings();
    // Detect dark mode
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const checkSuperAdmin = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!error && data?.role === 'super_admin') {
      setIsSuperAdmin(true);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('website_animation')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data);
        setPreviewAnimation(data.animation_type);
      }
    } catch (error) {
      console.error('Error loading animation settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load animation settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('website_animation')
        .update({
          animation_type: settings.animation_type,
          apply_to: settings.apply_to,
          is_active: settings.is_active,
          updated_by: user?.id,
        })
        .eq('id', settings.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Animation settings saved successfully',
      });
    } catch (error) {
      console.error('Error saving animation settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save animation settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
            <CardDescription>
              Only super administrators can access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-blue-500" />
            Website Animation
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure global background animations for your website
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Animation Settings</CardTitle>
            <CardDescription>
              Choose an animation to make your website more attractive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Animation Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Animation Type</Label>
              <RadioGroup
                value={settings?.animation_type || 'none'}
                onValueChange={(value) => {
                  setSettings(prev => prev ? { 
                    ...prev, 
                    animation_type: value,
                    is_active: value !== 'none' // Automatically enable/disable based on selection
                  } : null);
                  setPreviewAnimation(value);
                }}
                className="space-y-3"
              >
                {animationOptions.map((option) => (
                  <div key={option.value} className="flex items-start space-x-3 space-y-0">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label 
                      htmlFor={option.value} 
                      className="font-normal cursor-pointer flex-1"
                    >
                      <div className="font-semibold">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Apply To */}
            <div className="space-y-3">
              <Label htmlFor="apply-to" className="text-base font-semibold">
                Apply To
              </Label>
              <Select
                value={settings?.apply_to || 'all'}
                onValueChange={(value: 'home' | 'all') => 
                  setSettings(prev => prev ? { ...prev, apply_to: value } : null)
                }
              >
                <SelectTrigger id="apply-to">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  <SelectItem value="home">Homepage Only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose where the animation should be displayed
              </p>
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full"
              size="lg"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Animation Settings
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Live Preview</CardTitle>
            <CardDescription>
              See how the animation looks on your website
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Light Mode Preview */}
              <div className="relative h-64 rounded-lg border-2 border-gray-300 bg-white overflow-hidden">
                <WebsiteAnimations 
                  animationType={previewAnimation} 
                  isDarkMode={false}
                />
                <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                  Light Mode
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Your Website Content
                    </h3>
                    <p className="text-gray-600">
                      Animation plays behind your content
                    </p>
                  </div>
                </div>
              </div>

              {/* Dark Mode Preview */}
              <div className="relative h-64 rounded-lg border-2 border-gray-700 bg-gray-900 overflow-hidden">
                <WebsiteAnimations 
                  animationType={previewAnimation} 
                  isDarkMode={true}
                />
                <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-gray-100">
                  Dark Mode
                </div>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-gray-900/70 backdrop-blur-sm rounded-lg p-6 text-center">
                    <h3 className="text-2xl font-bold text-gray-100 mb-2">
                      Your Website Content
                    </h3>
                    <p className="text-gray-300">
                      Animation plays behind your content
                    </p>
                  </div>
                </div>
              </div>

              {previewAnimation === 'none' && (
                <p className="text-center text-sm text-muted-foreground">
                  No animation selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/50 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-blue-500">Animation Features</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Animations are non-interactive and won't disturb user experience</li>
                <li>• Animations play infinitely in the background</li>
                <li>• All content remains fully clickable and selectable</li>
                <li>• Optimized for performance with smooth 60 FPS rendering</li>
                <li>• Automatically adapts to light and dark modes</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};