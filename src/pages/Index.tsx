import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Star, 
  Shield, 
  Zap, 
  Package, 
  Download,
  Users,
  TrendingUp,
  Sparkles,
  Play,
  Pause
} from 'lucide-react';
import ceoImage from '@/assets/ceo-myne-winner.jpg';
import DualCurrencyBadge from '@/components/ui/dual-currency-badge';
import { ProductAnimations } from '@/components/ProductAnimations';
import { MatrixBackground } from '@/components/MatrixBackground';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  price_pkr?: number;
  image_url: string;
  category: string;
  product_animation?: string | null;
}

interface WebsiteImage {
  id: string;
  image_url: string;
  is_hero_image: boolean;
  is_slider_image: boolean;
  display_order: number;
  alt_text: string;
}

const Index = () => {
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [heroImages, setHeroImages] = useState<WebsiteImage[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalDownloads: 0
  });

  useEffect(() => {
    fetchFeaturedProducts();
    fetchStats();
    fetchHeroImages();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (heroImages.length > 1 && isAutoPlaying) {
      interval = setInterval(() => {
        setCurrentImageIndex((prevIndex) => 
          prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000); // Change image every 5 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [heroImages.length, isAutoPlaying]);

  const fetchHeroImages = async () => {
    try {
      const { data } = await supabase
        .from('website_images')
        .select('*')
        .eq('is_slider_image', true)
        .order('display_order', { ascending: true });
      
      setHeroImages(data || []);
    } catch (error) {
      console.error('Error fetching hero images:', error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(12);
      
      // If no featured products, fall back to latest active products
      if (!data || data.length === 0) {
        const { data: fallbackData } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(12);
        
        setFeaturedProducts(fallbackData || []);
      } else {
        setFeaturedProducts(data);
      }
    } catch (error) {
      console.error('Error fetching featured products:', error);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch total users count (all registered users)
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch total downloads from approved payments only
      const { count: approvedPayments } = await supabase
        .from('payment_requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      setStats({
        totalProducts: productsCount || 0,
        totalUsers: Math.max(usersCount || 0, 4000), // Keep 4000+ minimum for happy customers
        totalDownloads: Math.max(approvedPayments || 0, 3000) // Keep 3000+ minimum for downloads as requested
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({
        totalProducts: 0,
        totalUsers: 3000,
        totalDownloads: 3000
      });
    }
  };

  const nextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? heroImages.length - 1 : prevIndex - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  return (
    <div className="min-h-screen">
      {/* Enhanced Hero Section with Better Image Layout */}
      <section className="relative overflow-hidden min-h-screen flex items-center justify-center">
        {/* Matrix Background */}
        <MatrixBackground />
        
        {/* Background Image Slider with Improved Layout */}
        {heroImages.length > 0 && (
          <div className="absolute inset-0 z-10">
            {heroImages.map((image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentImageIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
              >
                {/* Image Container with Proper Framing */}
                <div className="relative w-full h-full overflow-hidden">
                  {/* Main Image with Better Aspect Ratio Handling */}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <img
                      src={image.image_url}
                      alt={image.alt_text || 'Hero image'}
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      style={{ 
                        objectFit: 'cover',
                        objectPosition: 'center',
                        filter: 'brightness(0.7) contrast(1.1)'
                      }}
                      loading={index === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                  
                  {/* Enhanced Gradient Overlays for Better Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30"></div>
                  
                  {/* Decorative Frame Elements */}
                  <div className="absolute inset-4 border border-white/10 rounded-lg backdrop-blur-sm"></div>
                  <div className="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-white/30 rounded-tl-lg"></div>
                  <div className="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-white/30 rounded-tr-lg"></div>
                  <div className="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-white/30 rounded-bl-lg"></div>
                  <div className="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-white/30 rounded-br-lg"></div>
                </div>
              </div>
            ))}

            {/* Enhanced Dots Indicator */}
            {heroImages.length > 1 && (
              <div className="absolute bottom-6 sm:bottom-12 left-1/2 transform -translate-x-1/2 z-30 flex space-x-3 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                {heroImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full transition-all duration-300 border border-white/30 hover:scale-125 ${
                      index === currentImageIndex 
                        ? 'bg-white scale-125 shadow-lg shadow-white/50' 
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Fallback Background */}
        {heroImages.length === 0 && (
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900"></div>
            <div className="absolute inset-0 opacity-20" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30"></div>
          </div>
        )}

        {/* Enhanced Hero Content - SIMPLIFIED, NO FRAMER MOTION */}
        <div className="container mx-auto px-4 relative z-20">
          <div className="text-center max-w-6xl mx-auto">
            <div className="animate-fade-in">
              {/* Simple Badge - No framer motion */}
              <div className="mb-6 sm:mb-8 inline-block">
                <div className="relative bg-gradient-to-r from-blue-500/20 via-purple-500/30 to-pink-500/20 rounded-full px-3 py-1.5 sm:px-6 sm:py-2 border border-white/30 backdrop-blur-md shadow-lg">
                  <div className="flex items-center justify-center gap-1 sm:gap-2">
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-300" />
                    <span className="text-[10px] sm:text-xs md:text-sm lg:text-base text-white font-medium">
                      Welcome to the Future of Digital Products
                    </span>
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-pink-300" />
                  </div>
                </div>
              </div>
              
              {/* Enhanced Main Title */}
              <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent drop-shadow-2xl">
                <span className="block font-black tracking-tight">Myne7x</span>
              </h1>
              
              {/* Enhanced Subtitle */}
              <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
                Discover premium digital products, tools, and resources designed to accelerate your success in the digital world.
              </p>
              
              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                {!user && (
                  <Link to="/auth">
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="px-10 py-4 text-lg border-2 border-white/50 text-white hover:bg-white/10 hover:border-white/70 backdrop-blur-sm shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      Get Started
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Simple Floating Elements - No animation */}
        <div className="absolute top-20 left-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"></div>
        </div>
        <div className="absolute bottom-32 right-16">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-xl"></div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 border-t border-white/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Package className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.totalProducts}+</h3>
              <p className="text-gray-600 font-medium">Premium Products</p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.totalUsers}+</h3>
              <p className="text-gray-600 font-medium">Happy Customers</p>
            </div>
            <div className="text-center group hover:scale-105 transition-transform duration-300">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Download className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.totalDownloads}+</h3>
              <p className="text-gray-600 font-medium">Downloads</p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Featured Products */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Discover our most popular digital products crafted for excellence and designed to accelerate your success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {featuredProducts.map((product, index) => (
              <Card 
                key={product.id} 
                className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 hover:scale-105 overflow-hidden relative"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {/* Product Animation Layer - Shows for all featured products */}
                {product.product_animation && product.product_animation !== 'none' && (
                  <ProductAnimations 
                    animationType={product.product_animation}
                    isDarkBackground={false}
                  />
                )}
                
                {product.image_url && (
                  <div className="h-48 overflow-hidden relative z-10">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  </div>
                )}
                <CardHeader className="pb-4 relative z-10">
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                    {product.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-gray-600">
                    {product.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex justify-between items-center">
                    <DualCurrencyBadge 
                      usdPrice={product.price}
                      pkrPrice={product.price_pkr}
                      size="medium"
                    />
                    <Link to={`/product/${product.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-blue-200 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/products">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                View All Products
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Why Choose Myne7x?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the difference with our premium platform designed for success
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Lightning Fast</h3>
              <p className="text-gray-600 leading-relaxed">
                Instant access to your purchased products with our optimized download system and global CDN
              </p>
            </div>
            
            <div className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Shield className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Secure & Reliable</h3>
              <p className="text-gray-600 leading-relaxed">
                Bank-level security ensures your purchases and data are always protected with enterprise-grade encryption
              </p>
            </div>
            
            <div className="text-center group hover:scale-105 transition-all duration-300">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                <Star className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Premium Quality</h3>
              <p className="text-gray-600 leading-relaxed">
                Carefully curated products that meet our high standards of excellence and deliver real value
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of satisfied customers and discover premium digital products today
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  Browse Products
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {!user && (
                <Link to="/auth">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Create Account
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
        <div className="absolute -top-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-yellow-300/20 rounded-full blur-lg"></div>
      </section>
    </div>
  );
};

export default Index;