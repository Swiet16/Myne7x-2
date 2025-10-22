import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedAvatarFrame } from '@/components/AnimatedAvatarFrame';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { User, LogOut, Settings, Bell, Menu, Shield, Sparkles } from 'lucide-react';

const Navbar = () => {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState<string>('');

  // Fetch profile picture
  useEffect(() => {
    if (user) {
      fetchProfilePicture();
    }
  }, [user]);

  const fetchProfilePicture = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('profile_picture_url')
        .eq('user_id', user.id)
        .single();
      
      if (data?.profile_picture_url) {
        // Add cache-busting timestamp for instant updates
        const baseUrl = data.profile_picture_url.split('?')[0];
        setProfilePictureUrl(`${baseUrl}?t=${Date.now()}`);
      }
    } catch (error) {
      console.error('Error fetching profile picture:', error);
    }
  };

  // Fetch unread notifications count
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      
      // Set up real-time subscription for notifications
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => fetchUnreadCount()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  // Set up real-time subscription for profile picture updates
  useEffect(() => {
    if (user) {
      const channel = supabase
        .channel('profile-picture-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (payload.new.profile_picture_url) {
              // Add cache-busting timestamp for instant updates
              const baseUrl = payload.new.profile_picture_url.split('?')[0];
              setProfilePictureUrl(`${baseUrl}?t=${Date.now()}`);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 sm:space-x-3 group">
          <img src="https://uqkirciomqdagbnrwcfq.supabase.co/storage/v1/object/public/images/myne7x_logo.png" alt="Myne7x Logo" className="h-8 sm:h-10 w-auto" />
          <span className="text-lg sm:text-xl lg:text-2xl font-orbitron font-black bg-gradient-to-r from-primary via-purple-500 to-secondary bg-clip-text text-transparent">
            Myne7x
          </span>
        </Link>

        {/* Desktop Navigation - Changed from md:flex to lg:flex for better visibility */}
        <div className="hidden md:flex items-center space-x-1 xl:space-x-2">
          <Link to="/products">
            <Button variant="ghost" size="sm" className="relative group hover:bg-transparent transition-all duration-300 text-xs xl:text-sm px-3 xl:px-4 overflow-hidden">
              <span className="relative z-10 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent group-hover:from-purple-500 group-hover:to-pink-500 font-semibold transition-all duration-300">
                Products
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-600 to-pink-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost" size="sm" className="relative group hover:bg-transparent transition-all duration-300 text-xs xl:text-sm px-3 xl:px-4 overflow-hidden">
              <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent group-hover:from-blue-500 group-hover:to-cyan-500 font-semibold transition-all duration-300">
                About
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </Button>
          </Link>
          <Link to="/team">
            <Button variant="ghost" size="sm" className="relative group hover:bg-transparent transition-all duration-300 text-xs xl:text-sm px-3 xl:px-4 overflow-hidden">
              <span className="relative z-10 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent group-hover:from-green-500 group-hover:to-emerald-500 font-semibold transition-all duration-300">
                Team
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-600 to-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost" size="sm" className="relative group hover:bg-transparent transition-all duration-300 text-xs xl:text-sm px-3 xl:px-4 overflow-hidden">
              <span className="relative z-10 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:to-red-500 font-semibold transition-all duration-300">
                Contact
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-600 to-red-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </Button>
          </Link>
          <Link to="/faq">
            <Button variant="ghost" size="sm" className="relative group hover:bg-transparent transition-all duration-300 text-xs xl:text-sm px-3 xl:px-4 overflow-hidden">
              <span className="relative z-10 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-500 group-hover:to-purple-500 font-semibold transition-all duration-300">
                FAQ
              </span>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
            </Button>
          </Link>
          
          {user ? (
            <>
              {/* Notification Bell - Prominent in Navigation */}
              <Link to="/notifications">
                <Button variant="ghost" size="sm" className="relative hover:bg-primary/10 hover:text-primary transition-colors px-2">
                  <Bell className="h-4 w-4 xl:h-5 xl:w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-4 w-4 xl:h-5 xl:w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-red-500 text-white border-2 border-white"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {isAdmin && (
                <Link to="/admin">
                  <Button 
                    size="sm" 
                    className="relative overflow-hidden group bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105 text-xs xl:text-sm px-4 xl:px-5 font-bold rounded-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <Shield className="mr-2 h-4 w-4 xl:h-4.5 xl:w-4.5 animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <span className="relative drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] tracking-wide">Admin Panel</span>
                    <Sparkles className="ml-2 h-3.5 w-3.5 xl:h-4 xl:w-4 animate-pulse drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition-opacity duration-300 -z-10"></div>
                  </Button>
                </Link>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-auto w-auto rounded-full hover:bg-transparent p-0">
                    <AnimatedAvatarFrame userId={user.id} size="md">
                      <Avatar className="h-10 w-10 border-0">
                        <AvatarImage src={profilePictureUrl} alt="Profile" className="object-cover" />
                        <AvatarFallback className="bg-gradient-neon text-white font-bold">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </AnimatedAvatarFrame>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm truncate">{user.email}</p>
                      {isAdmin && (
                        <Badge variant="secondary" className="text-xs bg-gradient-neon text-white border-0">Administrator</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="btn-neon text-xs xl:text-sm px-3 xl:px-4">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile/Tablet Navigation - Only shows below md breakpoint */}
        <div className="flex md:hidden items-center space-x-4">
          {user ? (
            <>
              {/* Mobile Notification Bell */}
              <Link to="/notifications">
                <Button variant="ghost" size="sm" className="relative hover:bg-primary/10 hover:text-primary transition-colors p-2.5">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-bold bg-red-500 text-white border-2 border-white"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Mobile Admin Button - Visible like desktop */}
              {isAdmin && (
                <Link to="/admin">
                  <Button 
                    size="sm" 
                    className="relative overflow-hidden group bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white border-0 shadow-xl hover:shadow-2xl hover:shadow-purple-500/60 transition-all duration-300 transform hover:scale-110 text-xs px-4 py-2.5 font-bold rounded-xl animate-pulse"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 animate-shimmer"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400/0 via-pink-400/40 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                    <Shield className="h-5 w-5 animate-pulse drop-shadow-[0_0_12px_rgba(255,255,255,1)]" />
                    <div className="absolute -inset-1.5 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-300 -z-10 animate-pulse"></div>
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-ping" />
                  </Button>
                </Link>
              )}

              {/* Mobile User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-auto w-auto rounded-full hover:bg-transparent p-0">
                    <AnimatedAvatarFrame userId={user.id} size="md">
                      <Avatar className="h-10 w-10 border-0">
                        <AvatarImage src={profilePictureUrl} alt="Profile" className="object-cover" />
                        <AvatarFallback className="bg-gradient-neon text-white font-bold">
                          {user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </AnimatedAvatarFrame>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-sm truncate">{user.email}</p>
                      {isAdmin && (
                        <Badge variant="secondary" className="text-xs bg-gradient-neon text-white border-0">Administrator</Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Hamburger Menu - Compact Dropdown Style */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="top" 
                  className="h-auto max-h-[70vh] w-full rounded-b-3xl border-x-0 border-t-0 p-6 bg-gradient-to-b from-background via-background/95 to-background/90 shadow-2xl"
                >
                  <div className="flex flex-col space-y-2 mt-4">
                    <Link to="/products" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:text-purple-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Products</span>
                      </Button>
                    </Link>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 hover:text-blue-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">About</span>
                      </Button>
                    </Link>
                    <Link to="/team" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 hover:text-green-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Team</span>
                      </Button>
                    </Link>
                    <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/10 hover:text-orange-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Contact</span>
                      </Button>
                    </Link>
                    <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 hover:text-indigo-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FAQ</span>
                      </Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          ) : (
            <>
              {/* Hamburger Menu for Non-authenticated Users - Compact Dropdown Style */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="top" 
                  className="h-auto max-h-[70vh] w-full rounded-b-3xl border-x-0 border-t-0 p-6 bg-gradient-to-b from-background via-background/95 to-background/90 shadow-2xl"
                >
                  <div className="flex flex-col space-y-2 mt-4">
                    <Link to="/products" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-purple-500/10 hover:to-pink-500/10 hover:text-purple-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Products</span>
                      </Button>
                    </Link>
                    <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 hover:text-blue-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">About</span>
                      </Button>
                    </Link>
                    <Link to="/team" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-green-500/10 hover:to-emerald-500/10 hover:text-green-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Team</span>
                      </Button>
                    </Link>
                    <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/10 hover:text-orange-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Contact</span>
                      </Button>
                    </Link>
                    <Link to="/faq" onClick={() => setMobileMenuOpen(false)}>
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-base font-semibold hover:bg-gradient-to-r hover:from-indigo-500/10 hover:to-purple-500/10 hover:text-indigo-600 transition-all duration-300 rounded-xl py-6"
                      >
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">FAQ</span>
                      </Button>
                    </Link>
                    <Link to="/auth" className="mt-4" onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full btn-neon text-base py-6">Sign In</Button>
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;