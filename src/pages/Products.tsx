import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Search, Package, DollarSign, Download } from 'lucide-react';
import DownloadComponent from '@/components/DownloadComponent';
import DualCurrencyBadge from '@/components/ui/dual-currency-badge';
import { ProductAnimations } from '@/components/ProductAnimations';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  price_pkr?: number;
  image_url: string;
  category: string;
  tags: string[];
  feature_images: string[];
  is_active: boolean;
  is_featured?: boolean;
  file_url?: string;
  product_animation?: string | null;
}

interface UserAccess {
  product_id: string;
}

interface PaymentRequest {
  id: string;
  product_id: string;
  status: string;
}

const Products = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [userAccess, setUserAccess] = useState<UserAccess[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingProduct, setDownloadingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
    if (user) {
      fetchUserAccess();
      fetchPaymentRequests();
    }
  }, [user]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive"
      });
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
    // For free products or users with access, show countdown
    if (product.price === 0 || hasAccess(product.id) || isAdmin) {
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

  const filteredProducts = products.filter(product =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse bg-slate-800/50 border-slate-700">
                <div className="h-48 bg-slate-700/50 rounded-t-lg"></div>
                <CardHeader>
                  <div className="h-4 bg-slate-700/50 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-4 md:py-8">
      <div className="container mx-auto px-3 md:px-4">
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-3xl md:text-5xl font-orbitron font-black mb-4 text-cyan-300">
            Digital Products
          </h1>
          <p className="text-sm md:text-lg text-slate-300 max-w-2xl mx-auto mb-6 px-2 md:px-4">
            Discover our collection of premium digital products and free resources
          </p>
          <div className="relative max-w-md mx-auto px-2 md:px-4">
            <Search className="absolute left-5 md:left-7 top-1/2 transform -translate-y-1/2 text-cyan-400 h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 md:pl-10 h-12 bg-slate-800/80 border-slate-700 focus:border-cyan-500 text-white placeholder:text-slate-400"
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <Card className="text-center py-12 bg-slate-800/80 border-slate-700 max-w-md mx-auto">
            <CardContent>
              <Package className="mx-auto h-12 w-12 text-cyan-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No products found</h3>
              <p className="text-slate-400">
                {searchTerm ? 'Try adjusting your search terms' : 'No products are currently available'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
            {filteredProducts.map((product, index) => (
              <Card key={product.id} className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 relative bg-slate-800/90 border-slate-700 hover:border-cyan-500/50">
                {/* Product Animation Layer - Keep these as requested */}
                {product.product_animation && product.product_animation !== 'none' && (
                  <div className="absolute inset-0 z-0 pointer-events-none">
                    <ProductAnimations 
                      animationType={product.product_animation}
                      isDarkBackground={true}
                      className="opacity-50"
                    />
                  </div>
                )}
                
                {product.image_url && (
                  <div 
                    className="h-40 md:h-48 overflow-hidden cursor-pointer relative z-10 bg-slate-900"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <CardHeader className="pb-3 p-3 md:p-6 relative z-10">
                  <CardTitle 
                    className="text-sm md:text-lg cursor-pointer hover:text-cyan-400 transition-colors line-clamp-1 font-orbitron text-cyan-100"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    {product.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs md:text-sm text-slate-400">
                    {product.description}
                  </CardDescription>
                  <div className="mt-2">
                    <DualCurrencyBadge 
                      usdPrice={product.price} 
                      pkrPrice={product.price_pkr}
                      size="small"
                    />
                  </div>
                </CardHeader>
                <CardContent className="pt-0 p-3 md:p-6 md:pt-0 relative z-10">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {product.category && (
                      <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">{product.category}</Badge>
                    )}
                    {product.tags?.slice(0, 1).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-cyan-500/50 text-cyan-400">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  {(() => {
                    const buttonState = getButtonState(product);
                    const Icon = buttonState.icon;
                    
                    return (
                      <Button 
                        onClick={buttonState.action}
                        className={`w-full text-xs md:text-sm h-9 md:h-10 font-semibold transition-all duration-300 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg ${buttonState.className || ''}`}
                        variant={buttonState.variant}
                        disabled={buttonState.disabled}
                      >
                        {Icon && <Icon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />}
                        {buttonState.text}
                      </Button>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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

export default Products;