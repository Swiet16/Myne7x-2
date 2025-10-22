import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import ProductUploadForm from '@/components/admin/ProductUploadForm';
import UserManagement from '@/components/admin/UserManagement';
import PaymentRequestManagement from '@/components/admin/PaymentRequestManagement';
import ProductManagement from '@/components/admin/ProductManagement';
import ContactRequestManagement from '@/components/admin/ContactRequestManagement';
import RefundRequestManagement from '@/components/admin/RefundRequestManagement';
import { VisitorAnalytics } from '@/components/admin/VisitorAnalytics';
import { WebsiteAnimation } from '@/pages/admin/WebsiteAnimation';
import TeamManagement from '@/pages/admin/TeamManagement';
import { 
  Users, 
  Package, 
  CreditCard, 
  Bell, 
  Settings, 
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Edit,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  Crown,
  Zap,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  RefreshCw,
  Activity,
  TrendingDown
} from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useToast } from '@/hooks/use-toast';

// ... keep existing interfaces ...

interface WebsiteImage {
  id: string;
  image_url: string;
  is_hero_image: boolean;
  is_slider_image: boolean;
  display_order: number;
  alt_text: string;
  uploaded_by: string;
}

interface ContactDetails {
  id: string;
  phone_number: string;
  email: string;
  address: string;
}

const Admin = () => {
  const { formatDualPrice, isLoading, convertUSDtoPKR } = useCurrency();
  const { toast } = useToast();
  
  // ... keep existing format functions ...
  
  const formatPrice = (price: number) => {
    if (isNaN(price) || price === 0) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatPriceCompact = (price: number) => {
    if (isNaN(price) || price === 0) return '$0';
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(2)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(2)}K`;
    }
    return `$${price.toFixed(2)}`;
  };

  const formatRsPrice = (price: number) => {
    if (isNaN(price) || price === 0) return '0 Rs';
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(1)}M Rs`;
    } else if (price >= 10000) {
      return `${(price / 1000).toFixed(1)}K Rs`;
    }
    return `${Math.round(price).toLocaleString('en-US')} Rs`;
  };

  // ... keep existing state ...
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    totalRevenue: 0
  });

  const [dashboardStats, setDashboardStats] = useState({
    contacts: {
      pending: 0,
      read: 0,
      replied: 0,
      resolved: 0,
      total: 0
    },
    refunds: {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    },
    products: {
      active: 0,
      inactive: 0,
      featured: 0,
      total: 0
    }
  });

  const [websiteImages, setWebsiteImages] = useState<WebsiteImage[]>([]);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState({
    phone_number: '',
    email: '',
    address: ''
  });

  const [imageUpload, setImageUpload] = useState({
    file: null as File | null,
    alt_text: '',
    is_hero_image: false,
    is_slider_image: false,
    display_order: 1
  });

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUpdatingImages, setIsUpdatingImages] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchWebsiteImages();
    fetchContactDetails();
    fetchDashboardStats();
  }, []);

  // ... keep all existing fetch functions ...

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: pendingCount } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: approvedCount } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: revenueData } = await supabase
        .from('payment_requests')
        .select(`
          products(price, price_pkr)
        `)
        .eq('status', 'approved');

      const totalRevenue = revenueData?.reduce((sum, request) => {
        return sum + (request.products?.price || 0);
      }, 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalProducts: productsCount || 0,
        pendingRequests: pendingCount || 0,
        approvedRequests: approvedCount || 0,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        totalRevenue: 0
      });
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const { data: contactData } = await supabase
        .from('contact_requests')
        .select('status');

      const contactStats = {
        pending: contactData?.filter(c => c.status === 'pending').length || 0,
        read: contactData?.filter(c => c.status === 'read').length || 0,
        replied: contactData?.filter(c => c.status === 'replied').length || 0,
        resolved: contactData?.filter(c => c.status === 'resolved').length || 0,
        total: contactData?.length || 0
      };

      const { data: refundData } = await supabase
        .from('refund_requests')
        .select('status');

      const refundStats = {
        pending: refundData?.filter(r => r.status === 'pending').length || 0,
        approved: refundData?.filter(r => r.status === 'approved').length || 0,
        rejected: refundData?.filter(r => r.status === 'rejected').length || 0,
        total: refundData?.length || 0
      };

      const { data: productData } = await supabase
        .from('products')
        .select('is_active, is_featured');

      const productStats = {
        active: productData?.filter(p => p.is_active).length || 0,
        inactive: productData?.filter(p => !p.is_active).length || 0,
        featured: productData?.filter(p => p.is_featured).length || 0,
        total: productData?.length || 0
      };

      setDashboardStats({
        contacts: contactStats,
        refunds: refundStats,
        products: productStats
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchWebsiteImages = async () => {
    try {
      const { data, error } = await supabase
        .from('website_images')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Error fetching images:', error);
        toast({
          title: "Database Error",
          description: "Could not fetch images. Please check your Supabase configuration.",
          variant: "destructive"
        });
        return;
      }
      
      setWebsiteImages(data || []);
    } catch (error) {
      console.error('Error fetching website images:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to database. Please check your internet connection.",
        variant: "destructive"
      });
    }
  };

  const fetchContactDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_details')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching contact details:', error);
        return;
      }
      
      if (data) {
        setContactDetails(data);
        setContactForm({
          phone_number: data.phone_number || '',
          email: data.email || '',
          address: data.address || ''
        });
      }
    } catch (error) {
      console.error('Error fetching contact details:', error);
    }
  };

  // ... keep all existing handler functions ...

  const handleImageUpload = async () => {
    if (!imageUpload.file) {
      toast({
        title: "No File Selected",
        description: "Please select an image file to upload",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      const fileExt = imageUpload.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `website-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, imageUpload.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Upload Failed",
          description: "Failed to upload image to storage. Please check your Supabase storage configuration.",
          variant: "destructive"
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (imageUpload.is_hero_image) {
        const { error: clearError } = await supabase
          .from('website_images')
          .update({ is_hero_image: false, is_slider_image: false })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (clearError) {
          console.error('Error clearing existing hero images:', clearError);
        }
      }

      const { error: dbError } = await supabase
        .from('website_images')
        .insert({
          image_url: publicUrl,
          alt_text: imageUpload.alt_text || 'Website image',
          is_hero_image: imageUpload.is_hero_image,
          is_slider_image: imageUpload.is_hero_image,
          display_order: imageUpload.display_order
        });

      if (dbError) {
        console.error('Database error:', dbError);
        toast({
          title: "Database Error",
          description: "Image uploaded but failed to save to database. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const successMessage = imageUpload.is_hero_image 
        ? "🎯 Image uploaded and automatically set as HERO image!" 
        : "Image uploaded successfully and is now available for selection.";

      toast({
        title: "Success!",
        description: successMessage,
      });

      setImageUpload({
        file: null,
        alt_text: '',
        is_hero_image: false,
        is_slider_image: false,
        display_order: 1
      });

      const fileInput = document.getElementById('image-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchWebsiteImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Error",
        description: "An unexpected error occurred. Please check your connection and try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      const { error } = await supabase
        .from('website_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;

      toast({
        title: "Image Deleted",
        description: "Image has been successfully removed"
      });

      fetchWebsiteImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete Failed",
        description: "Could not delete image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateContact = async () => {
    try {
      if (contactDetails) {
        const { error } = await supabase
          .from('contact_details')
          .update(contactForm)
          .eq('id', contactDetails.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('contact_details')
          .insert(contactForm);

        if (error) throw error;
      }

      toast({
        title: "Contact Updated",
        description: "Contact details have been successfully updated"
      });

      setEditingContact(false);
      fetchContactDetails();
    } catch (error) {
      console.error('Error updating contact details:', error);
      toast({
        title: "Update Failed",
        description: "Could not update contact details. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImageSelection = (imageId: string, checked: boolean) => {
    if (checked) {
      setSelectedImages(prev => [...prev, imageId]);
    } else {
      setSelectedImages(prev => prev.filter(id => id !== imageId));
    }
  };

  const handleApplySelectedAsHero = async () => {
    if (selectedImages.length === 0) {
      toast({
        title: "No Images Selected",
        description: "Please select at least one image to set as hero images",
        variant: "destructive"
      });
      return;
    }

    setIsUpdatingImages(true);
    try {
      const { error: clearError } = await supabase
        .from('website_images')
        .update({ is_hero_image: false, is_slider_image: false })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (clearError) {
        console.error('Error clearing hero status:', clearError);
        toast({
          title: "Update Failed",
          description: "Could not clear existing hero images. Please try again.",
          variant: "destructive"
        });
        return;
      }

      const { error: updateError } = await supabase
        .from('website_images')
        .update({ is_hero_image: true, is_slider_image: true })
        .in('id', selectedImages);

      if (updateError) {
        console.error('Error setting hero images:', updateError);
        toast({
          title: "Update Failed",
          description: "Could not set selected images as hero images. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Hero Images Updated!",
        description: `${selectedImages.length} image(s) are now set as hero images and will appear on the home page.`
      });

      setSelectedImages([]);
      fetchWebsiteImages();
    } catch (error) {
      console.error('Error updating images:', error);
      toast({
        title: "Update Error",
        description: "An unexpected error occurred while updating images.",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingImages(false);
    }
  };

  const refreshStats = () => {
    fetchStats();
    fetchDashboardStats();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0yaDB2MmgtMnYtMmgydjJ6TTAgMzBoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yem0wLTJoMnYyaC0ydi0yeiIvPjwvZz48L2c+PC9zdmc+')] animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* Modern Header */}
        <div className="mb-4 sm:mb-6 relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-4 sm:p-6 shadow-2xl">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 sm:p-3 bg-white/20 rounded-xl backdrop-blur-md">
                <Crown className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-yellow-300" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                  Admin Command Center
                </h1>
                <p className="text-xs sm:text-sm text-white/80">Manage your digital empire</p>
              </div>
            </div>
            <Badge className="bg-white/20 border-white/40 text-white backdrop-blur-md px-3 py-1 text-xs sm:text-sm">
              <Activity className="w-3 h-3 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>
        </div>

        {/* Modern Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          {/* Users Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white/80 mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-xs text-white/80 font-medium">Total Users</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/90">
              <TrendingUp className="w-3 h-3" />
              <span>+12%</span>
            </div>
          </div>

          {/* Products Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <Package className="w-6 h-6 sm:w-7 sm:h-7 text-white/80 mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.totalProducts}</div>
            <div className="text-xs text-white/80 font-medium">Active Products</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/90">
              <Activity className="w-3 h-3" />
              <span>Live</span>
            </div>
          </div>

          {/* Pending Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-red-600 p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-white/80 mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.pendingRequests}</div>
            <div className="text-xs text-white/80 font-medium">Pending</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/90">
              <AlertCircle className="w-3 h-3" />
              <span>Review</span>
            </div>
          </div>

          {/* Approved Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 to-cyan-700 p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-white/80 mb-2" />
            <div className="text-2xl sm:text-3xl font-bold text-white">{stats.approvedRequests}</div>
            <div className="text-xs text-white/80 font-medium">Approved</div>
            <div className="mt-2 flex items-center gap-1 text-xs text-white/90">
              <CheckCircle2 className="w-3 h-3" />
              <span>Done</span>
            </div>
          </div>

          {/* Revenue Card */}
          <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-pink-700 p-4 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 col-span-2 md:col-span-3 lg:col-span-1">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
            <CreditCard className="w-6 h-6 sm:w-7 sm:h-7 text-white/80 mb-2" />
            <div className="text-xl sm:text-2xl font-bold text-white">{formatPriceCompact(stats.totalRevenue)}</div>
            <div className="text-xs text-white/80 font-medium">Total Revenue</div>
            <div className="mt-1 text-[10px] text-white/70">{formatRsPrice(convertUSDtoPKR(stats.totalRevenue))}</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dashboard" className="space-y-4">
          <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-max min-w-full bg-slate-800/50 backdrop-blur-md border border-white/10 rounded-xl p-1 gap-1">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <BarChart3 className="w-3 h-3 mr-1" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="images" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <ImageIcon className="w-3 h-3 mr-1" />
                Images
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <Package className="w-3 h-3 mr-1" />
                Products
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <Users className="w-3 h-3 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="contacts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <MessageCircle className="w-3 h-3 mr-1" />
                Contacts
              </TabsTrigger>
              <TabsTrigger value="payments" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <CreditCard className="w-3 h-3 mr-1" />
                Payments
              </TabsTrigger>
              <TabsTrigger value="refunds" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-yellow-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <RefreshCw className="w-3 h-3 mr-1" />
                Refunds
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <Users className="w-3 h-3 mr-1" />
                Team
              </TabsTrigger>
              <TabsTrigger value="animation" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <Sparkles className="w-3 h-3 mr-1" />
                Animation
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-white/70 rounded-lg px-3 py-2 text-xs font-medium transition-all">
                <Settings className="w-3 h-3 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab - Redesigned */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {/* Contact Requests */}
              <Card className="bg-slate-800/50 backdrop-blur-md border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-cyan-500/20 rounded-lg">
                        <MessageCircle className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-white">Contact Requests</CardTitle>
                        <p className="text-xs text-white/60">Customer inquiries</p>
                      </div>
                    </div>
                    <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30">{dashboardStats.contacts.total}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                      <Clock className="w-3 h-3 text-yellow-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.contacts.pending}</div>
                      <div className="text-[10px] text-white/60">Pending</div>
                    </div>
                    <div className="bg-blue-500/10 rounded-lg p-2 border border-blue-500/20">
                      <Eye className="w-3 h-3 text-blue-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.contacts.read}</div>
                      <div className="text-[10px] text-white/60">Read</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                      <CheckCircle className="w-3 h-3 text-green-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.contacts.replied}</div>
                      <div className="text-[10px] text-white/60">Replied</div>
                    </div>
                    <div className="bg-gray-500/10 rounded-lg p-2 border border-gray-500/20">
                      <CheckCircle2 className="w-3 h-3 text-gray-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.contacts.resolved}</div>
                      <div className="text-[10px] text-white/60">Resolved</div>
                    </div>
                  </div>
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    {[
                      { label: 'Pending', value: dashboardStats.contacts.pending, total: dashboardStats.contacts.total, color: 'bg-yellow-500' },
                      { label: 'Replied', value: dashboardStats.contacts.replied, total: dashboardStats.contacts.total, color: 'bg-green-500' }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/70">{item.label}</span>
                          <span className="text-white/90 font-semibold">{item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Refund Requests */}
              <Card className="bg-slate-800/50 backdrop-blur-md border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <RefreshCw className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-white">Refund Requests</CardTitle>
                        <p className="text-xs text-white/60">Return processing</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30">{dashboardStats.refunds.total}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                      <Clock className="w-3 h-3 text-yellow-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.refunds.pending}</div>
                      <div className="text-[10px] text-white/60">Pending</div>
                    </div>
                    <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                      <CheckCircle className="w-3 h-3 text-green-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.refunds.approved}</div>
                      <div className="text-[10px] text-white/60">Approved</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                      <X className="w-3 h-3 text-red-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.refunds.rejected}</div>
                      <div className="text-[10px] text-white/60">Rejected</div>
                    </div>
                  </div>
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    {[
                      { label: 'Pending', value: dashboardStats.refunds.pending, total: dashboardStats.refunds.total, color: 'bg-yellow-500' },
                      { label: 'Approved', value: dashboardStats.refunds.approved, total: dashboardStats.refunds.total, color: 'bg-green-500' },
                      { label: 'Rejected', value: dashboardStats.refunds.rejected, total: dashboardStats.refunds.total, color: 'bg-red-500' }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/70">{item.label}</span>
                          <span className="text-white/90 font-semibold">{item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Products Overview */}
              <Card className="bg-slate-800/50 backdrop-blur-md border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Package className="w-4 h-4 text-purple-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold text-white">Products Overview</CardTitle>
                        <p className="text-xs text-white/60">Catalog stats</p>
                      </div>
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">{dashboardStats.products.total}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                      <CheckCircle className="w-3 h-3 text-green-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.products.active}</div>
                      <div className="text-[10px] text-white/60">Active</div>
                    </div>
                    <div className="bg-gray-500/10 rounded-lg p-2 border border-gray-500/20">
                      <EyeOff className="w-3 h-3 text-gray-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.products.inactive}</div>
                      <div className="text-[10px] text-white/60">Inactive</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                      <Star className="w-3 h-3 text-yellow-400 mb-1" />
                      <div className="text-lg font-bold text-white">{dashboardStats.products.featured}</div>
                      <div className="text-[10px] text-white/60">Featured</div>
                    </div>
                  </div>
                  {/* Progress Bars */}
                  <div className="space-y-2">
                    {[
                      { label: 'Active', value: dashboardStats.products.active, total: dashboardStats.products.total, color: 'bg-green-500' },
                      { label: 'Featured', value: dashboardStats.products.featured, total: dashboardStats.products.total, color: 'bg-yellow-500' }
                    ].map((item, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/70">{item.label}</span>
                          <span className="text-white/90 font-semibold">{item.total > 0 ? Math.round((item.value / item.total) * 100) : 0}%</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.total > 0 ? (item.value / item.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visitor Analytics */}
            <VisitorAnalytics />

            {/* Quick Actions */}
            <Card className="bg-slate-800/50 backdrop-blur-md border-white/10 shadow-xl">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Images
                  </Button>
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payments
                  </Button>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white">
                    <Users className="w-4 h-4 mr-2" />
                    Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            {/* Upload Section */}
            <Card className="bg-slate-800/50 backdrop-blur-md border-white/10 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-t-xl">
                <CardTitle className="text-white flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Images
                </CardTitle>
                <CardDescription className="text-white/80">Upload images for hero slider</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white text-sm">Choose File</Label>
                    <Input
                      id="image-file"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageUpload(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                      className="mt-1 bg-slate-900/50 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white text-sm">Description</Label>
                    <Input
                      placeholder="Image description"
                      value={imageUpload.alt_text}
                      onChange={(e) => setImageUpload(prev => ({ ...prev, alt_text: e.target.value }))}
                      className="mt-1 bg-slate-900/50 border-white/20 text-white"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <Label className="text-white text-sm">Auto-set as Hero Image</Label>
                  </div>
                  <Switch
                    checked={imageUpload.is_hero_image}
                    onCheckedChange={(checked) => setImageUpload(prev => ({ ...prev, is_hero_image: checked }))}
                  />
                </div>

                <Button 
                  onClick={handleImageUpload}
                  disabled={isUploadingImage || !imageUpload.file}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                </Button>
              </CardContent>
            </Card>

            {/* Select Hero Slider Images */}
            <Card className="bg-slate-800/50 backdrop-blur-md border-white/10 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-700 rounded-t-xl">
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Select Hero Slider Images
                </CardTitle>
                <CardDescription className="text-white/80">Choose images for the hero slider ({selectedImages.length} selected)</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <Button 
                  onClick={handleApplySelectedAsHero}
                  disabled={isUpdatingImages || selectedImages.length === 0}
                  className="w-full mb-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isUpdatingImages ? 'Updating...' : `Activate ${selectedImages.length} Hero Image(s)`}
                </Button>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {websiteImages.map((image) => (
                    <div key={image.id} className="relative group rounded-lg overflow-hidden border border-white/10 bg-slate-900/50">
                      <img 
                        src={image.image_url} 
                        alt={image.alt_text}
                        className="w-full h-32 object-cover"
                      />
                      {image.is_hero_image && (
                        <Badge className="absolute top-2 right-2 bg-green-500 text-white">Hero</Badge>
                      )}
                      <Checkbox
                        checked={selectedImages.includes(image.id)}
                        onCheckedChange={(checked) => handleImageSelection(image.id, checked as boolean)}
                        className="absolute top-2 left-2 bg-white"
                      />
                      <div className="p-2">
                        <Button
                          onClick={() => handleDeleteImage(image.id)}
                          variant="destructive"
                          size="sm"
                          className="w-full text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card className="bg-slate-800/50 backdrop-blur-md border-white/10 shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-t-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Contact Details
                    </CardTitle>
                    <CardDescription className="text-white/80">Manage contact information</CardDescription>
                  </div>
                  <Button 
                    onClick={() => setEditingContact(!editingContact)}
                    className="bg-white/20 hover:bg-white/30 text-white"
                  >
                    {editingContact ? <X className="w-4 h-4 mr-1" /> : <Edit className="w-4 h-4 mr-1" />}
                    {editingContact ? 'Cancel' : 'Edit'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {editingContact ? (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-white">Phone</Label>
                      <Input
                        value={contactForm.phone_number}
                        onChange={(e) => setContactForm(prev => ({ ...prev, phone_number: e.target.value }))}
                        className="mt-1 bg-slate-900/50 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Email</Label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 bg-slate-900/50 border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Address</Label>
                      <Input
                        value={contactForm.address}
                        onChange={(e) => setContactForm(prev => ({ ...prev, address: e.target.value }))}
                        className="mt-1 bg-slate-900/50 border-white/20 text-white"
                      />
                    </div>
                    <Button 
                      onClick={handleUpdateContact}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-400" />
                      <div>
                        <Label className="text-white/60 text-xs">Phone</Label>
                        <p className="text-white font-semibold">{contactDetails?.phone_number || '+92 309 6626615'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <Mail className="w-5 h-5 text-green-400" />
                      <div>
                        <Label className="text-white/60 text-xs">Email</Label>
                        <p className="text-white font-semibold">{contactDetails?.email || 'myne7x@gmail.com'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                      <MapPin className="w-5 h-5 text-purple-400" />
                      <div>
                        <Label className="text-white/60 text-xs">Address</Label>
                        <p className="text-white font-semibold">{contactDetails?.address || 'Pakistan'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other Tabs */}
          <TabsContent value="upload">
            <ProductUploadForm onProductUploaded={refreshStats} />
          </TabsContent>

          <TabsContent value="products">
            <ProductManagement onUpdate={refreshStats} />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="contacts">
            <ContactRequestManagement onUpdate={refreshStats} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentRequestManagement onUpdate={refreshStats} />
          </TabsContent>

          <TabsContent value="refunds">
            <RefundRequestManagement onUpdate={refreshStats} />
          </TabsContent>

          <TabsContent value="team">
            <TeamManagement />
          </TabsContent>

          <TabsContent value="animation">
            <WebsiteAnimation />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;