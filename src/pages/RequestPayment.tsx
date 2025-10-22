import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Upload, DollarSign, ArrowLeft, Package, Copy } from 'lucide-react';
import { ProductAnimations } from '@/components/ProductAnimations';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  product_animation?: string | null;
}

const RequestPayment = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [paymentType, setPaymentType] = useState<'nayapay' | 'custom' | ''>('');
  const [formData, setFormData] = useState({
    socialContact: '',
    socialType: 'whatsapp',
    transactionId: '',
    customMessage: ''
  });
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchProduct();
  }, [user, productId, navigate]);

  useEffect(() => {
    // Redirect free products to downloads
    if (product && product.price === 0) {
      navigate(`/product/${product.id}`);
    }
  }, [product, navigate]);

  const fetchProduct = async () => {
    if (!productId) return;
    
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/products');
        return;
      }
      setProduct(data);
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

  const uploadScreenshot = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `payment-screenshots/${user?.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('payment-screenshots')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('payment-screenshots')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started:', { user, product, paymentType, formData });
    
    if (!user || !product) {
      console.error('Missing user or product:', { user: !!user, product: !!product });
      toast({
        title: "Error",
        description: "Please log in and try again",
        variant: "destructive"
      });
      return;
    }

    if (!paymentType || !formData.socialContact.trim()) {
      console.error('Missing required fields:', { paymentType, socialContact: formData.socialContact });
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (paymentType === 'nayapay' && !formData.transactionId.trim() && !screenshotFile) {
      console.error('Nayapay missing transaction details');
      toast({
        title: "Error",
        description: "Please provide either transaction ID or payment screenshot",
        variant: "destructive"
      });
      return;
    }

    if (paymentType === 'custom' && !formData.customMessage.trim()) {
      console.error('Custom form missing message');
      toast({
        title: "Error",
        description: "Please explain your payment method",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      let screenshotUrl = '';
      
      if (screenshotFile) {
        console.log('Uploading screenshot...');
        screenshotUrl = await uploadScreenshot(screenshotFile);
        console.log('Screenshot uploaded:', screenshotUrl);
      }

      const insertData = {
        user_id: user.id,
        product_id: product.id,
        payment_method: paymentType,
        contact_method: formData.socialType,
        contact_value: formData.socialContact.trim(),
        transaction_id: formData.transactionId.trim() || null,
        payment_screenshot_url: screenshotUrl || null,
        alternative_payment_details: formData.customMessage.trim() || null,
        status: 'pending'
      };

      console.log('Inserting payment request:', insertData);

      const { data, error } = await supabase
        .from('payment_requests')
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      console.log('Payment request inserted successfully:', data);

      toast({
        title: "Payment Request Submitted",
        description: "Your payment request has been submitted. We'll review it within 24 hours.",
      });

      navigate('/products');
    } catch (error: any) {
      console.error('Submit error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit payment request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto text-center">
          <CardContent className="pt-6">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Product Not Found</h3>
            <Button onClick={() => navigate('/products')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background/50 via-background to-background/50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/products')}
            className="mb-6 hover-scale"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Product Info */}
            <Card className="card-neon relative overflow-hidden">
              {/* Product Animation Layer */}
              {product.product_animation && product.product_animation !== 'none' && (
                <div className="absolute inset-0 z-0 pointer-events-none">
                  <ProductAnimations 
                    animationType={product.product_animation}
                    isDarkBackground={false}
                  />
                </div>
              )}
              
              <CardHeader className="relative z-10">
                <CardTitle className="flex items-center gap-2 text-glow">
                  <Package className="h-5 w-5" />
                  Product Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                {product.image_url && (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img
                      src={product.image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-bold text-glow">{product.title}</h3>
                  <p className="text-muted-foreground mt-2">{product.description}</p>
                </div>
                <div className="flex items-center gap-2 text-2xl font-bold text-neon-cyan">
                  {product.price === 0 ? (
                    <span className="text-green-500">FREE</span>
                  ) : (
                    <>
                      <DollarSign className="h-6 w-6" />
                      {product.price}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card className="card-neon">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-glow">
                  <CreditCard className="h-5 w-5" />
                  Payment Request
                </CardTitle>
                <CardDescription>
                  Submit your payment details for manual verification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Payment Method *</Label>
                    <RadioGroup
                      value={paymentType}
                      onValueChange={(value) => setPaymentType(value as 'nayapay' | 'custom')}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nayapay" id="nayapay" />
                        <Label htmlFor="nayapay">Nayapay</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="custom" id="custom" />
                        <Label htmlFor="custom">Custom Form</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Nayapay Details */}
                  {paymentType === 'nayapay' && (
                    <Card className="bg-neon-cyan/5 border-neon-cyan/40 shadow-neon-cyan/20 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-sm text-neon-cyan font-semibold">Nayapay Payment Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-background/80 rounded-lg border border-neon-cyan/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Nayapay Number:</span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-lg font-bold text-neon-cyan">+923184712251</span>
                              <Button 
                                type="button"
                                size="sm"
                                variant="ghost"
                                className="hover:bg-neon-cyan/10"
                                onClick={() => {
                                  navigator.clipboard.writeText('+923184712251');
                                  toast({ title: "Copied!", description: "Phone number copied to clipboard" });
                                }}
                              >
                                <Copy className="h-4 w-4 text-neon-cyan" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="transaction-id" className="text-foreground">Transaction ID</Label>
                          <Input
                            id="transaction-id"
                            value={formData.transactionId}
                            onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                            placeholder="Enter transaction ID"
                            className="border-neon-cyan/30 focus:border-neon-cyan focus:ring-neon-cyan/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="screenshot" className="text-foreground">OR Upload Payment Screenshot</Label>
                          <Input
                            id="screenshot"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                            required={paymentType === 'nayapay' && !formData.transactionId}
                            className="border-neon-cyan/30 focus:border-neon-cyan focus:ring-neon-cyan/50"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Custom Form Details */}
                  {paymentType === 'custom' && (
                    <Card className="bg-orange-500/5 border-orange-500/40 shadow-orange-500/20 shadow-lg">
                      <CardHeader>
                        <CardTitle className="text-sm text-orange-500 font-semibold">Custom Payment Method</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="custom-message" className="text-foreground">Explain Your Payment Method *</Label>
                          <Textarea
                            id="custom-message"
                            value={formData.customMessage}
                            onChange={(e) => setFormData(prev => ({ ...prev, customMessage: e.target.value }))}
                            placeholder="Describe how you want to pay (e.g., Bank transfer, Cash, etc.)"
                            rows={3}
                            required
                            className="border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/50"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="custom-screenshot" className="text-foreground">Upload Supporting Screenshot/Document (Optional)</Label>
                          <Input
                            id="custom-screenshot"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                            className="border-orange-500/30 focus:border-orange-500 focus:ring-orange-500/50"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Social Contact (Required for both) */}
                  {paymentType && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Social Contact Method *</Label>
                        <RadioGroup
                          value={formData.socialType}
                          onValueChange={(value) => setFormData(prev => ({ ...prev, socialType: value }))}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="whatsapp" id="whatsapp" />
                            <Label htmlFor="whatsapp">WhatsApp Number</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="telegram" id="telegram" />
                            <Label htmlFor="telegram">Telegram ID</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="social-contact">
                          {formData.socialType === 'whatsapp' ? 'WhatsApp Number' : 'Telegram ID'} *
                        </Label>
                        <Input
                          id="social-contact"
                          value={formData.socialContact}
                          onChange={(e) => setFormData(prev => ({ ...prev, socialContact: e.target.value }))}
                          placeholder={
                            formData.socialType === 'whatsapp' ? '+1234567890' : '@username'
                          }
                          required
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={submitting || !paymentType} 
                    className="w-full btn-neon"
                  >
                    {submitting ? (
                      <>
                        <Upload className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Your request will be reviewed within 24 hours. 
                    You'll receive access once verified.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestPayment;