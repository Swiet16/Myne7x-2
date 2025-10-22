import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { User, Package, Clock, CheckCircle, XCircle, MessageSquare, Save, AlertCircle, Loader2, Lock, Calendar, Camera, Upload as UploadIcon, Download, CreditCard } from 'lucide-react';
import { MatrixBackground } from '@/components/MatrixBackground';
import { ProfileCard } from '@/components/ProfileCard';
import html2canvas from 'html2canvas';

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  whatsapp_number: string;
  telegram_id: string;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
  last_profile_edit_at: string | null;
}

interface PaymentRequest {
  id: string;
  payment_method: string;
  transaction_id: string;
  contact_method: string;
  contact_value: string;
  status: string;
  admin_notes: string;
  created_at: string;
  products: {
    title: string;
    price: number;
  };
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp_number: '',
    telegram_id: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [daysUntilEdit, setDaysUntilEdit] = useState<number>(0);
  const [downloadingCard, setDownloadingCard] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPaymentRequests();
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        whatsapp_number: profile.whatsapp_number || '',
        telegram_id: profile.telegram_id || ''
      });
    }
  }, [profile]);

  // Add effect for profile picture preview
  useEffect(() => {
    if (profilePictureFile) {
      const url = URL.createObjectURL(profilePictureFile);
      setProfilePicturePreview(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setProfilePicturePreview('');
    }
  }, [profilePictureFile]);

  // Check if user can edit profile (60-day restriction)
  useEffect(() => {
    if (profile?.last_profile_edit_at) {
      const lastEditDate = new Date(profile.last_profile_edit_at);
      const now = new Date();
      const daysSinceEdit = Math.floor((now.getTime() - lastEditDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSinceEdit >= 60) {
        setCanEdit(true);
        setDaysUntilEdit(0);
      } else {
        setCanEdit(false);
        setDaysUntilEdit(60 - daysSinceEdit);
      }
    } else {
      // First time editing, allow it
      setCanEdit(true);
      setDaysUntilEdit(0);
    }
  }, [profile]);

  const downloadProfileCard = async () => {
    if (!profile) return;

    // Check if profile is complete
    if (!profile.full_name || !profile.profile_picture_url) {
      toast({
        title: "Incomplete Profile",
        description: "Please add your name and profile picture before downloading your card.",
        variant: "destructive"
      });
      return;
    }

    setDownloadingCard(true);
    try {
      const cardElement = document.getElementById('profile-card-download');
      if (!cardElement) return;

      // Store original styles
      const originalWidth = cardElement.style.width;
      const originalMaxWidth = cardElement.style.maxWidth;
      const originalTransform = cardElement.style.transform;
      const originalPosition = cardElement.style.position;

      // Force desktop size for consistent capture on all devices
      cardElement.style.width = '896px';
      cardElement.style.maxWidth = '896px';
      cardElement.style.position = 'absolute';
      cardElement.style.left = '-9999px';
      cardElement.style.top = '0';

      // Wait for all images to load
      const images = cardElement.getElementsByTagName('img');
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // Add a delay to ensure everything is rendered at new size
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(cardElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        foreignObjectRendering: false,
        width: 896,
        height: cardElement.scrollHeight
      });

      // Restore original styles
      cardElement.style.width = originalWidth;
      cardElement.style.maxWidth = originalMaxWidth;
      cardElement.style.transform = originalTransform;
      cardElement.style.position = originalPosition;
      cardElement.style.left = '';
      cardElement.style.top = '';

      const link = document.createElement('a');
      link.download = `${profile.full_name.replace(/\s+/g, '_')}_Myne7x_Profile.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: "Success!",
        description: "Your profile card has been downloaded.",
      });
    } catch (error) {
      console.error('Error downloading profile card:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download profile card. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloadingCard(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching profile for user:', user.id);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Profile fetch error:', error);
        
        if (error.code === 'PGRST116') {
          // No profile found, create one
          console.log('No profile found, creating new profile');
          await createProfile();
          return;
        }
        throw error;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async () => {
    if (!user) return;

    try {
      const newProfile = {
        user_id: user.id,
        email: user.email || '',
        full_name: '',
        whatsapp_number: '',
        telegram_id: '',
        profile_picture_url: null
      };

      console.log('Creating new profile:', newProfile);

      const { data, error } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }

      console.log('Profile created successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to create profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchPaymentRequests = async () => {
    if (!user) return;

    try {
      console.log('Fetching payment requests for user:', user.id);
      
      const { data, error } = await supabase
        .from('payment_requests')
        .select(`
          *,
          products (
            id,
            title,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Payment requests fetch error:', error);
        throw error;
      }

      console.log('Payment requests fetched:', data);
      setPaymentRequests(data || []);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
      toast({
        title: "Error",
        description: "Failed to load payment requests",
        variant: "destructive"
      });
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) return null;

    try {
      setUploadingPicture(true);

      // FIXED: Use user.id consistently (matches storage policy requirement)
      const userId = user.id;
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/profile_picture.${fileExt}`;

      // Delete old profile picture if exists
      if (profile?.profile_picture_url) {
        const oldPath = profile.profile_picture_url.split('/').slice(-2).join('/');
        if (oldPath) {
          await supabase.storage
            .from('profile-pictures')
            .remove([oldPath]);
        }
      }

      // Upload new picture
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache-busting timestamp for instant update
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Add timestamp to force browser to reload image
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload profile picture. Please try again.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image under 5MB.",
        variant: "destructive"
      });
      return;
    }

    setProfilePictureFile(file);

    // Auto-upload
    const pictureUrl = await uploadProfilePicture(file);
    if (pictureUrl && user && profile) {
      // Update profile with new picture URL
      const { error } = await supabase
        .from('profiles')
        .update({ 
          profile_picture_url: pictureUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating profile picture:', error);
        toast({
          title: "Update Failed",
          description: "Failed to save profile picture. Please try again.",
          variant: "destructive"
        });
      } else {
        setProfile({ ...profile, profile_picture_url: pictureUrl });
        toast({
          title: "Success!",
          description: "Profile picture updated successfully.",
        });
      }
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (!canEdit) {
      toast({
        title: "Edit Restricted",
        description: `You can edit your profile again in ${daysUntilEdit} days.`,
        variant: "destructive"
      });
      return;
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    if (!canEdit) {
      toast({
        title: "Edit Restricted",
        description: `You can only edit your profile once every 60 days. Please wait ${daysUntilEdit} more days.`,
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      console.log('Updating profile with data:', formData);

      const updateData = {
        full_name: formData.full_name.trim(),
        whatsapp_number: formData.whatsapp_number.trim(),
        telegram_id: formData.telegram_id.trim(),
        updated_at: new Date().toISOString(),
        last_profile_edit_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
      setHasChanges(false);
      
      toast({
        title: "Success!",
        description: "Your profile has been updated. You can edit it again after 60 days.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <MatrixBackground />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-cyan-400" />
            <p className="text-cyan-100">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MatrixBackground />
      <div className="relative z-10 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-cyan-100 mb-2">My Profile</h1>
            <p className="text-cyan-200/80">Manage your account information and view your activity</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-lg">
              <TabsTrigger 
                value="profile" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile Information</span>
                <span className="sm:hidden">Profile</span>
              </TabsTrigger>
              <TabsTrigger 
                value="card" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
              >
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Profile Card</span>
                <span className="sm:hidden">Card</span>
              </TabsTrigger>
              <TabsTrigger 
                value="requests" 
                className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-teal-600 data-[state=active]:text-white"
              >
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Payment Requests</span>
                <span className="sm:hidden">Payments</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Update your personal information and contact details
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!profile ? (
                    <Alert className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Setting up your profile for the first time...
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {/* Profile Picture Section */}
                  <div className="mb-8 flex flex-col items-center">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gradient-to-r from-blue-500 to-purple-600 shadow-xl bg-gradient-to-br from-gray-100 to-gray-200">
                        {profilePicturePreview || profile?.profile_picture_url ? (
                          <img
                            src={profilePicturePreview || profile?.profile_picture_url || ''}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                            <User className="h-16 w-16 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <label
                        htmlFor="profile-picture-upload"
                        className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-2 rounded-full cursor-pointer shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-110"
                      >
                        {uploadingPicture ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Camera className="h-5 w-5" />
                        )}
                      </label>
                      <input
                        id="profile-picture-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                        disabled={uploadingPicture}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-3 text-center">
                      Click the camera icon to upload a profile picture
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Max size: 5MB • Formats: JPG, PNG, GIF
                    </p>
                  </div>

                  {/* 60-Day Edit Restriction Alert */}
                  {!canEdit && profile?.last_profile_edit_at && (
                    <Alert className="mb-6 border-orange-200 bg-orange-50">
                      <Lock className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Profile Editing Restricted:</strong> You can only edit your profile details once every 60 days. 
                        You last edited your profile on {new Date(profile.last_profile_edit_at).toLocaleDateString()}.
                        <br />
                        <span className="font-semibold">You can edit again in {daysUntilEdit} days.</span>
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Info Alert about 60-day restriction */}
                  {canEdit && profile?.last_profile_edit_at && (
                    <Alert className="mb-6 border-blue-200 bg-blue-50">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Important:</strong> Profile details can only be edited once every 60 days. Make sure your information is correct before saving.
                      </AlertDescription>
                    </Alert>
                  )}

                  {canEdit && !profile?.last_profile_edit_at && (
                    <Alert className="mb-6 border-blue-200 bg-blue-50">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Important:</strong> After saving your profile details, you won't be able to edit them again for 60 days. Please ensure all information is accurate.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="mt-2 bg-gray-50 text-gray-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                      </div>

                      <div>
                        <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          Full Name
                          {!canEdit && <Lock className="h-3 w-3 text-orange-500" />}
                        </Label>
                        <Input
                          id="full_name"
                          type="text"
                          value={formData.full_name}
                          onChange={(e) => handleInputChange('full_name', e.target.value)}
                          placeholder="Enter your full name"
                          className="mt-2"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="whatsapp_number" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          WhatsApp Number
                          {!canEdit && <Lock className="h-3 w-3 text-orange-500" />}
                        </Label>
                        <Input
                          id="whatsapp_number"
                          type="tel"
                          value={formData.whatsapp_number}
                          onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                          placeholder="+1234567890"
                          className="mt-2"
                          disabled={!canEdit}
                        />
                        <p className="text-xs text-gray-500 mt-1">Include country code</p>
                      </div>

                      <div>
                        <Label htmlFor="telegram_id" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          Telegram ID
                          {!canEdit && <Lock className="h-3 w-3 text-orange-500" />}
                        </Label>
                        <Input
                          id="telegram_id"
                          type="text"
                          value={formData.telegram_id}
                          onChange={(e) => handleInputChange('telegram_id', e.target.value)}
                          placeholder="@username"
                          className="mt-2"
                          disabled={!canEdit}
                        />
                        <p className="text-xs text-gray-500 mt-1">Your Telegram username</p>
                      </div>
                    </div>

                    {hasChanges && canEdit && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <AlertCircle className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                          You have unsaved changes. Click "Save Changes" to update your profile. Remember, you won't be able to edit again for 60 days.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end">
                      <Button
                        onClick={updateProfile}
                        disabled={saving || !hasChanges || !canEdit}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-2 shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : !canEdit ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Locked ({daysUntilEdit} days)
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="card">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Amazing Profile Card
                  </CardTitle>
                  <CardDescription className="text-cyan-100">
                    Download your personalized digital profile card with Matrix design
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {!profile?.full_name || !profile?.profile_picture_url ? (
                    <Alert className="mb-6 border-orange-200 bg-orange-50">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800">
                        <strong>Complete Your Profile:</strong> Please add your name and profile picture in the "Profile Information" tab before downloading your card.
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {/* Profile Card Preview */}
                  <div className="mb-6">
                    <div id="profile-card-download" className="max-w-2xl mx-auto">
                      <ProfileCard
                        fullName={profile?.full_name || ''}
                        email={user?.email || ''}
                        whatsappNumber={profile?.whatsapp_number || ''}
                        telegramId={profile?.telegram_id || ''}
                        profilePictureUrl={profile?.profile_picture_url || null}
                        memberSince={profile?.created_at || new Date().toISOString()}
                      />
                    </div>
                  </div>

                  {/* Download Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={downloadProfileCard}
                      disabled={downloadingCard || !profile?.full_name || !profile?.profile_picture_url}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-6 text-lg shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      size="lg"
                    >
                      {downloadingCard ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          Generating Card...
                        </>
                      ) : (
                        <>
                          <Download className="h-5 w-5 mr-2" />
                          Download Profile Card
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Info Alert */}
                  <Alert className="mt-6 border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Amazing Features:</strong> Your profile card includes an animated Matrix dot background with the Myne7x logo and all your contact details. Perfect for sharing your digital identity!
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="requests">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Payment Requests
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Track the status of your product access requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {paymentRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No payment requests found</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Visit our products page to request access to premium content
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {paymentRequests.map((request) => (
                        <div
                          key={request.id}
                          className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">
                                {request.products?.title || 'Product'}
                              </h3>
                              <p className="text-sm text-gray-600">
  Request ID: {request.id.slice(0, 8)}...
  {request.status === "approved" && request.products?.id && (
    <>
      <br />
      Product ID: {request.products.id}
    </>
  )}
</p> 
     </div>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                              <Badge className={`${getStatusColor(request.status)} border`}>
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Payment Method:</span>
                              <span className="ml-2 text-gray-600">{request.payment_method}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Transaction ID:</span>
                              <span className="ml-2 text-gray-600">{request.transaction_id}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Contact Method:</span>
                              <span className="ml-2 text-gray-600">{request.contact_method}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Price:</span>
                              <span className="ml-2 text-gray-600">${request.products?.price || 0}</span>
                            </div>
                          </div>

                          {request.admin_notes && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-sm font-medium text-blue-800">Admin Notes:</p>
                                  <p className="text-sm text-blue-700 mt-1">{request.admin_notes}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-3 text-xs text-gray-500">
                            Submitted on {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;