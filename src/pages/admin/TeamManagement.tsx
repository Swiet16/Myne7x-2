import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, Edit2, Trash2, Save, X, Upload, Link2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface TeamMember {
  id: string;
  name: string;
  bio: string | null;
  picture: string | null;
  years_of_working: number;
  verification_badge: 'gold' | 'blue' | 'instagram' | null;
  is_founder: boolean;
  display_order: number;
  social_links: {
    github?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
    x?: string;
  };
}

const emptyMember: Omit<TeamMember, 'id'> = {
  name: '',
  bio: null,
  picture: null,
  years_of_working: 0,
  verification_badge: null,
  is_founder: false,
  display_order: 0,
  social_links: {}
};

export const TeamManagement = () => {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<TeamMember, 'id'>>(emptyMember);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Check if user is super_admin
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    checkSuperAdmin();
    fetchMembers();
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
    } else {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('is_founder', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `team-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(data.path);

      setFormData({ ...formData, picture: publicUrl });
      setImagePreview(publicUrl);
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, picture: url });
    setImagePreview(url);
  };

  const handleSave = async () => {
    try {
      if (!formData.name) {
        toast.error('Name is required');
        return;
      }

      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update(formData)
          .eq('id', editingMember.id);

        if (error) throw error;
        toast.success('Team member updated successfully');
      } else {
        const { error } = await supabase
          .from('team_members')
          .insert([formData]);

        if (error) throw error;
        toast.success('Team member added successfully');
      }

      setIsDialogOpen(false);
      setEditingMember(null);
      setFormData(emptyMember);
      fetchMembers();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('Failed to save team member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Team member deleted successfully');
      fetchMembers();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
    }
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      bio: member.bio,
      picture: member.picture,
      years_of_working: member.years_of_working,
      verification_badge: member.verification_badge,
      is_founder: member.is_founder,
      display_order: member.display_order,
      social_links: member.social_links
    });
    setImagePreview(member.picture);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingMember(null);
    setFormData(emptyMember);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const updateSocialLink = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_links: {
        ...prev.social_links,
        [platform]: value
      }
    }));
  };

  const getBadgeDisplay = (badge: string | null) => {
    if (!badge) return null;
    const badges: Record<string, string> = {
      gold: '🏆 Golden Pro',
      blue: '💎 Pro',
      instagram: '📸 Instagram Verified'
    };
    return badges[badge] || badge;
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
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 p-6 rounded-xl border border-primary/20">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Team Management</h2>
          <p className="text-sm md:text-base text-foreground/80 mt-1">Manage your team members and their profiles</p>
        </div>
        <Button onClick={handleAdd} size="lg" className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary hover:opacity-90">
          <Plus className="w-5 h-5 mr-2" />
          Add Team Member
        </Button>
      </div>

      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.id} className="p-4 md:p-6 bg-gradient-to-br from-card via-card to-primary/5 border-primary/20 hover:border-primary/40 transition-all">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="relative flex-shrink-0 mx-auto md:mx-0">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-secondary to-primary rounded-full blur-md opacity-50" />
                <img
                  src={member.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=80`}
                  alt={member.name}
                  className="relative w-20 h-20 rounded-full object-cover border-4 border-white shadow-xl"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                  <h3 className="font-bold text-lg md:text-xl text-foreground">{member.name}</h3>
                  {member.is_founder && (
                    <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold rounded-full shadow-md">
                      👑 FOUNDER
                    </span>
                  )}
                  {member.verification_badge && (
                    <span className={`px-3 py-1 text-white text-xs font-bold rounded-full shadow-md ${
                      member.verification_badge === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                      member.verification_badge === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-700' :
                      'bg-gradient-to-r from-pink-500 to-purple-600'
                    }`}>
                      {getBadgeDisplay(member.verification_badge)}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-gradient-to-r from-accent/40 to-accent/60 text-accent-foreground text-xs font-bold rounded-full shadow-md border border-accent">
                    {member.years_of_working} years exp
                  </span>
                </div>
                {member.bio && <p className="text-sm md:text-base text-muted-foreground mb-3 leading-relaxed">{member.bio}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  {Object.entries(member.social_links || {}).map(([key, value]) => 
                    value && (
                      <span key={key} className="px-3 py-1.5 bg-primary/20 text-primary font-semibold rounded-lg border border-primary/30">
                        {key}: {value}
                      </span>
                    )
                  )}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto justify-center md:justify-end mt-4 md:mt-0">
                <Button size="lg" variant="outline" onClick={() => handleEdit(member)} className="flex-1 md:flex-none border-primary/30 hover:border-primary hover:bg-primary/10">
                  <Edit2 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Edit</span>
                </Button>
                <Button size="lg" variant="destructive" onClick={() => handleDelete(member.id)} className="flex-1 md:flex-none">
                  <Trash2 className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Delete</span>
                </Button>
              </div>
            </div>
          </Card>
        ))}
        
        {members.length === 0 && (
          <Card className="p-12 text-center bg-gradient-to-br from-muted/50 to-primary/5 border-dashed border-2 border-primary/30">
            <div className="inline-block p-6 rounded-full bg-primary/10 mb-4">
              <Plus className="w-12 h-12 text-primary" />
            </div>
            <p className="text-muted-foreground text-lg mb-6">No team members yet</p>
            <Button onClick={handleAdd} size="lg" className="bg-gradient-to-r from-primary to-secondary">
              <Plus className="w-5 h-5 mr-2" />
              Add Your First Team Member
            </Button>
          </Card>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-background via-background to-primary/5">
          <DialogHeader className="border-b border-primary/20 pb-3 sm:pb-4">
            <DialogTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {editingMember ? 'Edit' : 'Add'} Team Member
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 sm:space-y-6 pt-3 sm:pt-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base font-semibold text-foreground">Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Team member name"
                className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
              />
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base font-semibold text-foreground">Bio</Label>
              <Textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Short bio or role description"
                rows={3}
                className="text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
              />
            </div>

            <div className="space-y-2 sm:space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg border border-primary/20">
              <Label className="text-sm sm:text-base font-semibold text-foreground">Profile Picture</Label>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-primary/30 rounded-xl bg-background shadow-lg">
                  <div className="relative flex-shrink-0">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-secondary rounded-full blur-md opacity-50" />
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white shadow-xl"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">Current Image</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{formData.picture}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setFormData({ ...formData, picture: null });
                      setImagePreview(null);
                    }}
                    className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Upload/URL Tabs */}
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-10 sm:h-12 bg-muted">
                  <TabsTrigger value="upload" className="text-xs sm:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs sm:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Link2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    URL
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
                  <div className="border-2 sm:border-3 border-dashed border-primary/40 rounded-xl p-4 sm:p-8 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                      disabled={uploadingImage}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {uploadingImage ? (
                        <div className="flex flex-col items-center gap-2 sm:gap-3">
                          <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 animate-spin text-primary" />
                          <p className="text-sm sm:text-base font-semibold text-foreground">Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 sm:gap-3">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="text-sm sm:text-base font-semibold text-foreground mb-1">Click to upload image</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        </div>
                      )}
                    </label>
                  </div>
                </TabsContent>
                
                <TabsContent value="url" className="mt-3 sm:mt-4">
                  <Input
                    value={formData.picture || ''}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
                  />
                  <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                    Paste a direct image URL
                  </p>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base font-semibold text-foreground">Years of Working Experience</Label>
              <Input
                type="number"
                value={formData.years_of_working}
                onChange={(e) => setFormData({ ...formData, years_of_working: parseInt(e.target.value) || 0 })}
                min="0"
                className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
              />
            </div>

            <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-lg border border-primary/20">
              <Switch
                checked={formData.is_founder}
                onCheckedChange={(checked) => setFormData({ ...formData, is_founder: checked })}
                className="data-[state=checked]:bg-primary"
              />
              <Label className="text-sm sm:text-base font-semibold text-foreground cursor-pointer">👑 Mark as Founder</Label>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base font-semibold text-foreground">Verification Badge</Label>
              <Select
                value={formData.verification_badge || 'none'}
                onValueChange={(value) => setFormData({ ...formData, verification_badge: value === 'none' ? null : value as any })}
              >
                <SelectTrigger className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-primary/30">
                  <SelectItem value="none" className="text-sm sm:text-base">No Badge</SelectItem>
                  <SelectItem value="gold" className="text-sm sm:text-base">🏆 Golden Pro</SelectItem>
                  <SelectItem value="blue" className="text-sm sm:text-base">💎 Pro</SelectItem>
                  <SelectItem value="instagram" className="text-sm sm:text-base">📸 Instagram Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm sm:text-base font-semibold text-foreground">Display Order</Label>
              <Input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
              />
            </div>

            <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t-2 border-primary/20">
              <h4 className="font-bold text-base sm:text-lg text-foreground bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Social Links</h4>
              
              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-foreground">GitHub</Label>
                <Input
                  value={formData.social_links.github || ''}
                  onChange={(e) => updateSocialLink('github', e.target.value)}
                  placeholder="username or full URL"
                  className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-foreground">YouTube</Label>
                <Input
                  value={formData.social_links.youtube || ''}
                  onChange={(e) => updateSocialLink('youtube', e.target.value)}
                  placeholder="channel URL"
                  className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-foreground">Facebook</Label>
                <Input
                  value={formData.social_links.facebook || ''}
                  onChange={(e) => updateSocialLink('facebook', e.target.value)}
                  placeholder="username or profile URL"
                  className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-foreground">Instagram</Label>
                <Input
                  value={formData.social_links.instagram || ''}
                  onChange={(e) => updateSocialLink('instagram', e.target.value)}
                  placeholder="username"
                  className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-sm sm:text-base font-semibold text-foreground">X (Twitter)</Label>
                <Input
                  value={formData.social_links.x || ''}
                  onChange={(e) => updateSocialLink('x', e.target.value)}
                  placeholder="username"
                  className="h-10 sm:h-12 text-sm sm:text-base border-primary/30 focus:border-primary bg-background"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 sm:pt-6 border-t-2 border-primary/20">
              <Button onClick={handleSave} className="flex-1 h-10 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-primary to-secondary hover:opacity-90" disabled={uploadingImage}>
                <Save className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Save Team Member
              </Button>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1 sm:flex-none h-10 sm:h-12 text-sm sm:text-base font-semibold border-primary/30 hover:bg-muted">
                <X className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;