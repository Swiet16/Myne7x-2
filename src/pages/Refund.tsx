import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  DollarSign, 
  FileText,
  Mail,
  Phone,
  MessageSquare
} from 'lucide-react';

interface RefundRequest {
  id: string;
  product_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  products: {
    title: string;
    price: number;
    price_pkr?: number;
  };
}

const Refund = () => {
  const { user } = useAuth();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    reason: '',
    email: user?.email || '',
    phone: '',
    additionalInfo: ''
  });

  const fetchRefundRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          *,
          products (
            title,
            price,
            price_pkr
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRefundRequests(data || []);
    } catch (error) {
      console.error('Error fetching refund requests:', error);
      toast({
        title: "Error",
        description: "Failed to load refund requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit a refund request",
        variant: "destructive"
      });
      return;
    }

    if (!formData.productId || !formData.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('refund_requests')
        .insert({
          user_id: user.id,
          product_id: formData.productId,
          reason: formData.reason,
          contact_email: formData.email,
          contact_phone: formData.phone || null,
          additional_info: formData.additionalInfo || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Refund Request Submitted",
        description: "Your refund request has been submitted successfully. We'll review it within 24-48 hours.",
      });

      // Reset form
      setFormData({
        productId: '',
        reason: '',
        email: user?.email || '',
        phone: '',
        additionalInfo: ''
      });

      // Refresh requests
      fetchRefundRequests();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit refund request",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
            Refund Center
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Request refunds for digital products and track your refund status
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Refund Request Form */}
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-white">
                <RefreshCw className="h-5 w-5" />
                Submit Refund Request
              </CardTitle>
              <CardDescription className="text-blue-100">
                Fill out the form below to request a refund for your purchase
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmitRefund} className="space-y-6">
                <div>
                  <Label htmlFor="productId" className="text-gray-900 font-semibold text-sm">Product ID *</Label>
                  <Input
                    id="productId"
                    value={formData.productId}
                    onChange={(e) => setFormData(prev => ({ ...prev, productId: e.target.value }))}
                    placeholder="Enter the product ID you want to refund"
                    required
                    className="mt-2 border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 font-medium bg-blue-50/50 transition-all duration-200"
                  />
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    Visit Profile → Payment Requests to find your 32-digit Product ID, or paste it here directly
                  </p>
                </div>

                <div>
                  <Label htmlFor="email" className="text-gray-900 font-semibold text-sm">Contact Email *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="your.email@example.com"
                      required
                      className="pl-10 mt-2 border-2 border-green-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-900 font-medium bg-green-50/50 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-gray-900 font-semibold text-sm">Phone Number (Optional)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500" />
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+92 300 1234567"
                      className="pl-10 mt-2 border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 text-gray-900 font-medium bg-purple-50/50 transition-all duration-200"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reason" className="text-gray-900 font-semibold text-sm">Reason for Refund *</Label>
                  <Textarea
                    id="reason"
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Please explain why you're requesting a refund..."
                    required
                    rows={4}
                    className="mt-2 border-2 border-orange-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 text-gray-900 font-medium bg-orange-50/50 transition-all duration-200"
                  />
                </div>

                <div>
                  <Label htmlFor="additionalInfo" className="text-gray-900 font-semibold text-sm">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    value={formData.additionalInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInfo: e.target.value }))}
                    placeholder="Any additional details that might help us process your request..."
                    rows={3}
                    className="mt-2 border-2 border-teal-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 text-gray-900 font-medium bg-teal-50/50 transition-all duration-200"
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting || !user}
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold h-12 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Submit Refund Request
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Refund Policy & Status */}
          <div className="space-y-6">
            {/* Refund Policy */}
            <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2 text-white">
                  <FileText className="h-5 w-5" />
                  Refund Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Eligibility</h4>
                    <p className="text-sm">
                      Refunds are available within 30 days of purchase for digital products that don't meet the described specifications.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Processing Time</h4>
                    <p className="text-sm">
                      Refund requests are typically processed within 24-48 hours. Approved refunds are processed within 3-5 business days.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Contact Support</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-500" />
                        <span>myne7x@gmail.com</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-green-500" />
                        <span>+92 309 6626615</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Refund Requests */}
            {user && (
              <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <MessageSquare className="h-5 w-5" />
                      Your Refund Requests
                    </CardTitle>
                    <Button 
                      onClick={fetchRefundRequests}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading refund requests...</p>
                    </div>
                  ) : refundRequests.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No refund requests found</p>
                      <p className="text-sm text-gray-500 mt-2">Submit your first refund request using the form</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {refundRequests.map((request) => (
                        <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(request.status)}
                              <h4 className="font-semibold text-gray-900">{request.products.title}</h4>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Amount:</span> ${request.products.price}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {new Date(request.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Reason:</span>
                            <p className="text-gray-600 mt-1">{request.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Refund;
