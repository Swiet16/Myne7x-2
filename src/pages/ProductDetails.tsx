import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, Package, DollarSign, Download, Eye, Crown, Users, Palette, Code } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import DownloadComponent from '@/components/DownloadComponent';
import DualCurrencyBadge from '@/components/ui/dual-currency-badge';
import { ProductAnimations } from '@/components/ProductAnimations';
import { MatrixBackground } from '@/components/MatrixBackground';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  feature_images: string[];
  category: string;
  tags: string[];
  is_active: boolean;
  file_url?: string;
  product_animation?: string | null;
  creator?: string | null;
  developer?: string | null;
  graphics_designer?: string | null;
  team_type?: 'owner' | 'team' | 'custom' | null;
}

interface UserAccess {
  product_id: string;
}

interface PaymentRequest {
  id: string;
  product_id: string;
  status: string;
}

const ProductDetails = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingProduct, setDownloadingProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    if (productId) {
      fetchProduct();
      if (user) {
        fetchUserAccess();
        fetchPaymentRequests();
      }
    }
  }, [productId, user]);

  const fetchProduct = async () => {
    if (!productId) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setProduct(data);
      setSelectedImage(data.image_url || '');
    } catch (error) {
      toast({
        title: "Error",
        description: "Product not found",
        variant: "destructive"
      });
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccess = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_product_access')
        .select('product_id')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserAccess(data || []);
    } catch (error) {
      console.error('Error fetching user access:', error);
    }
  };

  const fetchPaymentRequests = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('id, product_id, status')
        .eq('user_id', user.id);

      if (error) throw error;
      setPaymentRequests(data || []);
    } catch (error) {
      console.error('Error fetching payment requests:', error);
    }
  };

  const hasAccess = (productId: string) => {
    return userAccess.some(access => access.product_id === productId);
  };

  const getPaymentStatus = (productId: string) => {
    const request = paymentRequests.find(req => req.product_id === productId);
    return request?.status || null;
  };

  const handleDownload = async (product: Product) => {
    if (isAdmin) {
      // Admin can download immediately without countdown
      try {
        if (product.file_url) {
          const { data } = await supabase.storage
            .from('product-files')
            .createSignedUrl(product.file_url.split('/').pop() || '', 3600);
          
          if (data?.signedUrl) {
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = product.title;
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            toast({
              title: "Download Started",
              description: `${product.title} download has begun`,
            });
          } else {
            throw new Error('Unable to create download link');
          }
        } else {
          throw new Error('No file URL found');
        }
      } catch (error) {
        toast({
          title: "Download Failed",
          description: "Unable to download the file",
          variant: "destructive"
        });
      }
      return;
    }

    // For free products or users with access, show countdown
    if (product.price === 0 || hasAccess(product.id)) {
      setDownloadingProduct(product);
    } else {
      toast({
        title: "Access Denied",
        description: "You need to purchase this product first",
        variant: "destructive"
      });
    }
  };

  const getButtonState = (product: Product) => {
    if (!user) {
      return { text: 'Sign in to Purchase', variant: 'outline' as const, action: () => navigate('/auth') };
    }

    // For free products, show Download button directly
    if (product.price === 0) {
      return { 
        text: 'Download', 
        variant: 'default' as const, 
        action: () => handleDownload(product),
        icon: Download,
        className: 'btn-neon'
      };
    }

    // For paid products, check access
    if (hasAccess(product.id)) {
      return { 
        text: 'Download', 
        variant: 'default' as const, 
        action: () => handleDownload(product),
        icon: Download,
        className: 'btn-neon'
      };
    }

    const paymentStatus = getPaymentStatus(product.id);
    
    if (paymentStatus === 'pending') {
      return { text: 'Request Pending', variant: 'secondary' as const, disabled: true };
    }
    
    if (paymentStatus === 'rejected') {
      return { text: 'Request Rejected - Try Again', variant: 'destructive' as const, action: () => navigate(`/request-payment/${product.id}`) };
    }

    return { 
      text: `Buy - $${product.price}`, 
      variant: 'default' as const,
      action: () => navigate(`/request-payment/${product.id}`),
      className: 'btn-neon'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen py-4 md:py-8 relative overflow-hidden">
        {/* Matrix Background */}
        <MatrixBackground />
        
        <div className="container mx-auto px-3 md:px-4 relative z-10">
          <div className="max-w-6xl mx-auto">
            <div className="animate-pulse space-y-4 md:space-y-6">
              <div className="h-6 md:h-8 bg-muted rounded w-24 md:w-32"></div>
              <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
                <div className="h-64 md:h-96 bg-muted rounded"></div>
                <div className="space-y-3 md:space-y-4">
                  <div className="h-6 md:h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-3 md:h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-24 md:h-32 bg-muted rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen py-4 md:py-8 relative overflow-hidden">
        {/* Matrix Background */}
        <MatrixBackground />
        
        <div className="container mx-auto px-3 md:px-4 relative z-10">
          <Card className="max-w-2xl mx-auto text-center">
            <CardContent className="pt-6">
              <Package className="mx-auto h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base md:text-lg font-semibold mb-2">Product Not Found</h3>
              <Button onClick={() => navigate('/products')} className="text-sm md:text-base">
                <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-2" />
                Back to Products
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const allImages = [product.image_url, ...(product.feature_images || [])].filter(Boolean);

  return (
    <div className="min-h-screen py-4 md:py-8 relative overflow-hidden">
      {/* Matrix Background */}
      <MatrixBackground />
      
      <div className="container mx-auto px-3 md:px-4 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/products')}
            className="mb-4 md:mb-6 hover-scale text-sm md:text-base h-8 md:h-10"
          >
            <ArrowLeft className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
            Back to Products
          </Button>

          <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
            {/* Product Images */}
            <div className="space-y-3 md:space-y-4">
              {/* Main Image */}
              <div className="aspect-square rounded-lg overflow-hidden bg-muted relative">
                {selectedImage ? (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="cursor-pointer group relative z-10">
                        <img
                          src={selectedImage}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-6 w-6 md:h-8 md:w-8 text-white" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] md:max-w-4xl max-h-[90vh] overflow-auto">
                      <DialogHeader>
                        <DialogTitle className="text-base md:text-lg">{product.title}</DialogTitle>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <img 
                          src={selectedImage} 
                          alt={product.title}
                          className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {allImages.map((image, index) => (
                    <div 
                      key={index}
                      className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedImage === image ? 'border-primary' : 'border-muted hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedImage(image)}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4 md:space-y-6">
              <Card className="card-neon relative overflow-hidden">
                {/* Product Animation Layer - Single instance only */}
                {product.product_animation && product.product_animation !== 'none' && (
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <ProductAnimations 
                      animationType={product.product_animation}
                      isDarkBackground={false}
                      className="opacity-50"
                    />
                  </div>
                )}
                
                <CardHeader className="relative z-10 p-4 md:p-6">
                  <div className="flex justify-between items-start gap-2 md:gap-4">
                    <CardTitle className="text-xl md:text-2xl text-glow line-clamp-2">{product.title}</CardTitle>
                    <DualCurrencyBadge 
                      usdPrice={product.price} 
                      size="large" 
                      className="items-end flex-shrink-0"
                    />
                  </div>
                  <CardDescription className="text-sm md:text-base mt-2">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 relative z-10 p-4 md:p-6 pt-0">
                  {/* Tags and Category */}
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {product.category && (
                      <Badge variant="outline" className="px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm">
                        {product.category}
                      </Badge>
                    )}
                    {product.tags?.map((tag, index) => (
                      <Badge key={index} variant="outline" className="px-2 py-0.5 text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Team/Owner Configuration Display */}
                  {product.team_type && (
                    <div className="rounded-lg border bg-muted/50 p-3 md:p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-muted-foreground">
                        <Users className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Team Configuration</span>
                      </div>
                      
                      {/* Owner Type */}
                      {product.team_type === 'owner' && product.creator && (
                        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-md p-2">
                          <Crown className="h-4 w-4 text-purple-400" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Owner</p>
                            <p className="text-sm font-medium">{product.creator}</p>
                          </div>
                        </div>
                      )}

                      {/* Team Myne7x Type */}
                      {product.team_type === 'team' && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-md p-2">
                          <Users className="h-4 w-4 text-green-400" />
                          <div className="flex-1">
                            <p className="text-xs text-muted-foreground">Developed by</p>
                            <p className="text-sm font-medium">Team Myne7x</p>
                          </div>
                        </div>
                      )}

                      {/* Custom Type */}
                      {product.team_type === 'custom' && (
                        <div className="space-y-2">
                          {product.creator && (
                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-md p-2">
                              <Crown className="h-3 w-3 md:h-4 md:w-4 text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Creator</p>
                                <p className="text-xs md:text-sm font-medium truncate">{product.creator}</p>
                              </div>
                            </div>
                          )}
                          {product.developer && (
                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-md p-2">
                              <Code className="h-3 w-3 md:h-4 md:w-4 text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Developer</p>
                                <p className="text-xs md:text-sm font-medium truncate">{product.developer}</p>
                              </div>
                            </div>
                          )}
                          {product.graphics_designer && (
                            <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-md p-2">
                              <Palette className="h-3 w-3 md:h-4 md:w-4 text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground">Graphics Designer</p>
                                <p className="text-xs md:text-sm font-medium truncate">{product.graphics_designer}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action Button */}
                  {(() => {
                    const buttonState = getButtonState(product);
                    const Icon = buttonState.icon;
                    
                    return (
                      <Button 
                        onClick={buttonState.action}
                        className={`w-full text-sm md:text-base lg:text-lg py-3 md:py-4 lg:py-6 h-auto ${buttonState.className || ''}`}
                        variant={buttonState.variant}
                        disabled={buttonState.disabled}
                      >
                        {Icon && <Icon className="h-4 w-4 md:h-5 md:w-5 mr-1.5 md:mr-2" />}
                        {buttonState.text}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Download Component */}
        {downloadingProduct && (
          <DownloadComponent 
            product={downloadingProduct}
            onClose={() => setDownloadingProduct(null)}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDetails;