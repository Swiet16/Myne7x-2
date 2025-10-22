import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Users, Search, UserPlus, Shield, UserCog, TrendingUp, Activity, Crown, Mail, MessageSquare } from 'lucide-react';

// Owner email that cannot be modified
const OWNER_EMAIL = 'myne7x@gmail.com';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string; 
  whatsapp_number: string;
  telegram_id: string;
  profile_picture_url: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchUserRoles();
    fetchCurrentUserRole();
  }, []);

  const fetchCurrentUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserEmail(user.email || null);
        
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;
        setCurrentUserRole(data?.role || 'user');
      } else {
        setCurrentUserRole('guest');
        setCurrentUserEmail(null);
      }
    } catch (error: any) {
      console.error('Error fetching current user role:', error);
      toast({
        title: "Error",
        description: "Failed to load current user's role",
        variant: "destructive"
      });
      setCurrentUserRole('guest');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (error) throw error;
      setUserRoles(data || []);
    } catch (error: any) {
      console.error('Error fetching user roles:', error);
    }
  };

  const getUserRole = (userId: string) => {
    const userRole = userRoles.find(role => role.user_id === userId);
    return userRole?.role || 'user';
  };

  const isOwner = (email: string) => {
    return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  };

  const canModifyUser = (targetEmail: string, targetUserId: string) => {
    // Owner cannot be modified by anyone, including themselves
    if (isOwner(targetEmail)) {
      return false;
    }

    // Users cannot modify themselves
    if (currentUserEmail?.toLowerCase() === targetEmail.toLowerCase()) {
      return false;
    }

    // Only super_admin can modify other users
    return currentUserRole === 'super_admin';
  };

  const updateUserRole = async (userId: string, targetEmail: string, newRole: string) => {
    if (!canModifyUser(targetEmail, userId)) {
      if (isOwner(targetEmail)) {
        toast({
          title: "Permission Denied",
          description: "The owner's role cannot be changed.",
          variant: "destructive"
        });
      } else if (currentUserEmail?.toLowerCase() === targetEmail.toLowerCase()) {
        toast({
          title: "Permission Denied",
          description: "You cannot change your own role.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Permission Denied",
          description: "Only super_admin can change user roles.",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole as 'user' | 'admin' | 'super_admin' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      fetchUserRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate stats
  const totalUsers = users.length;
  const totalAdmins = userRoles.filter(role => role.role === 'admin' || role.role === 'super_admin').length;
  const totalRegularUsers = totalUsers - totalAdmins;
  const newUsersThisWeek = users.filter(user => {
    const userDate = new Date(user.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return userDate >= weekAgo;
  }).length;

  // Separate users by role
  const adminUsers = filteredUsers.filter(user => {
    const role = getUserRole(user.user_id);
    return role === 'admin' || role === 'super_admin' || isOwner(user.email);
  });

  const regularUsers = filteredUsers.filter(user => {
    const role = getUserRole(user.user_id);
    return role !== 'admin' && role !== 'super_admin' && !isOwner(user.email);
  });

  if (loading || currentUserRole === null) {
    return (
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <Users className="w-6 h-6 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Responsive Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="p-3 sm:p-6 relative z-10">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Users className="h-4 w-4 sm:h-8 sm:w-8" />
              </div>
              <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 opacity-70" />
            </div>
            <div className="text-2xl sm:text-4xl font-bold mb-1">{totalUsers}</div>
            <div className="text-blue-100 text-xs sm:text-sm font-medium">Total Users</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="p-3 sm:p-6 relative z-10">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Shield className="h-4 w-4 sm:h-8 sm:w-8" />
              </div>
              <Activity className="h-3 w-3 sm:h-5 sm:w-5 opacity-70" />
            </div>
            <div className="text-2xl sm:text-4xl font-bold mb-1">{totalAdmins}</div>
            <div className="text-purple-100 text-xs sm:text-sm font-medium">Admins</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="p-3 sm:p-6 relative z-10">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <UserCog className="h-4 w-4 sm:h-8 sm:w-8" />
              </div>
              <TrendingUp className="h-3 w-3 sm:h-5 sm:w-5 opacity-70" />
            </div>
            <div className="text-2xl sm:text-4xl font-bold mb-1">{totalRegularUsers}</div>
            <div className="text-green-100 text-xs sm:text-sm font-medium">Regular</div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden relative group hover:shadow-2xl transition-all duration-300 hover:scale-105">
          <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-white/10 rounded-full -mr-10 sm:-mr-16 -mt-10 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
          <CardContent className="p-3 sm:p-6 relative z-10">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <UserPlus className="h-4 w-4 sm:h-8 sm:w-8" />
              </div>
              <Activity className="h-3 w-3 sm:h-5 sm:w-5 opacity-70" />
            </div>
            <div className="text-2xl sm:text-4xl font-bold mb-1">+{newUsersThisWeek}</div>
            <div className="text-orange-100 text-xs sm:text-sm font-medium">New Week</div>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-2 focus:border-purple-400 transition-colors bg-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout - Admins & Regular Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* ADMINS & OWNERS COLUMN */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
          <CardHeader className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white relative z-10">
            <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <Shield className="h-4 w-4 sm:h-5 sm:w-5" />
              Admins & Owners
            </CardTitle>
            <CardDescription className="text-purple-100 text-xs sm:text-sm">
              {adminUsers.length} privileged user{adminUsers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 max-h-[600px] overflow-y-auto relative z-10">
            <div className="space-y-3 sm:space-y-4">
              {adminUsers.map((user, index) => (
                <Card 
                  key={user.id} 
                  className="border-2 border-purple-200 hover:border-purple-400 transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in overflow-hidden relative group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="p-3 sm:p-4 relative z-10">
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-gradient-to-r from-purple-500 to-blue-500 shadow-lg">
                          <AvatarImage 
                            src={user.profile_picture_url ? `${user.profile_picture_url}?t=${Date.now()}` : undefined}
                            alt={user.full_name || user.email}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold text-lg">
                            {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        {isOwner(user.email) && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 shadow-lg">
                            <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {user.full_name || 'No name'}
                          </h3>
                          {isOwner(user.email) ? (
                            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-xs">
                              <Crown className="w-3 h-3 mr-1" />
                              Owner
                            </Badge>
                          ) : (
                            <Badge 
                              className={
                                getUserRole(user.user_id) === 'super_admin' 
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-0 text-xs' 
                                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-0 text-xs'
                              }
                            >
                              {getUserRole(user.user_id) === 'super_admin' && <Shield className="w-3 h-3 mr-1" />}
                              {getUserRole(user.user_id)}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-2">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {(user.whatsapp_number || user.telegram_id) && (
                          <div className="flex flex-wrap gap-2 mb-2 text-xs">
                            {user.whatsapp_number && (
                              <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                                <MessageSquare className="w-3 h-3" />
                                {user.whatsapp_number}
                              </span>
                            )}
                            {user.telegram_id && (
                              <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <MessageSquare className="w-3 h-3" />
                                {user.telegram_id}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        {!isOwner(user.email) && currentUserEmail?.toLowerCase() !== user.email.toLowerCase() && currentUserRole === 'super_admin' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {getUserRole(user.user_id) === 'admin' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserRole(user.user_id, user.email, 'user')}
                                  className="text-xs hover:bg-red-50 hover:border-red-400 transition-all"
                                >
                                  Remove Admin
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateUserRole(user.user_id, user.email, 'super_admin')}
                                  className="text-xs hover:bg-purple-50 hover:border-purple-400 transition-all"
                                >
                                  Make Super Admin
                                </Button>
                              </>
                            )}
                            {getUserRole(user.user_id) === 'super_admin' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateUserRole(user.user_id, user.email, 'user')}
                                className="text-xs hover:bg-red-50 hover:border-red-400 transition-all"
                              >
                                Remove Super Admin
                              </Button>
                            )}
                          </div>
                        )}
                        {isOwner(user.email) && (
                          <Badge variant="outline" className="mt-2 text-yellow-600 border-yellow-400 text-xs">
                            <Crown className="w-3 h-3 mr-1" />
                            Protected Account
                          </Badge>
                        )}
                        {currentUserEmail?.toLowerCase() === user.email.toLowerCase() && !isOwner(user.email) && (
                          <Badge variant="outline" className="mt-2 text-gray-500 text-xs">
                            Your Account
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {adminUsers.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No admins found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* REGULAR USERS COLUMN */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 overflow-hidden relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-green-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
          <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white relative z-10">
            <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg">
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
              Regular Users
            </CardTitle>
            <CardDescription className="text-green-100 text-xs sm:text-sm">
              {regularUsers.length} standard user{regularUsers.length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 max-h-[600px] overflow-y-auto relative z-10">
            <div className="space-y-3 sm:space-y-4">
              {regularUsers.map((user, index) => (
                <Card 
                  key={user.id} 
                  className="border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-lg bg-white/80 backdrop-blur-sm animate-fade-in overflow-hidden relative group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <CardContent className="p-3 sm:p-4 relative z-10">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-3 border-gradient-to-r from-green-500 to-teal-500 shadow-lg">
                        <AvatarImage 
                          src={user.profile_picture_url ? `${user.profile_picture_url}?t=${Date.now()}` : undefined}
                          alt={user.full_name || user.email}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold text-lg">
                          {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {user.full_name || 'No name'}
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {getUserRole(user.user_id)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-2">
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        {(user.whatsapp_number || user.telegram_id) && (
                          <div className="flex flex-wrap gap-2 mb-2 text-xs">
                            {user.whatsapp_number && (
                              <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded">
                                <MessageSquare className="w-3 h-3" />
                                {user.whatsapp_number}
                              </span>
                            )}
                            {user.telegram_id && (
                              <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                <MessageSquare className="w-3 h-3" />
                                {user.telegram_id}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </div>
                        {currentUserEmail?.toLowerCase() !== user.email.toLowerCase() && currentUserRole === 'super_admin' && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateUserRole(user.user_id, user.email, 'admin')}
                              className="text-xs hover:bg-blue-50 hover:border-blue-400 transition-all"
                            >
                              Promote to Admin
                            </Button>
                          </div>
                        )}
                        {currentUserEmail?.toLowerCase() === user.email.toLowerCase() && (
                          <Badge variant="outline" className="mt-2 text-gray-500 text-xs">
                            Your Account
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {regularUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No regular users found</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredUsers.length === 0 && (
        <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardContent className="p-12">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">No users found</p>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;