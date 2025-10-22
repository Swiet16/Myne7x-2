import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  User,
  Calendar,
  DollarSign,
  Package,
  Mail,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';

interface RefundRequest {
  id: string;
  user_id: string;
  product_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  contact_email: string;
  contact_phone?: string;
  additional_info?: string;
  admin_notes?: string;
  processed_by?: string;
  processed_at?: string;
  products: {
    title: string;
    price: number;
    price_pkr?: number;
  };
  profiles: {
    full_name?: string;
    email: string;
  };
  purchase_status?: {
    has_purchased: boolean;
    has_access: boolean;
    payment_approved: boolean;
    purchase_date?: string;
    purchase_method?: string;
  };
}

interface RefundRequestManagementProps {
  onUpdate?: () => void;
}

const RefundRequestManagement = ({ onUpdate }: RefundRequestManagementProps) => {
  const { toast } = useToast();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);

  const fetchRefundRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const enhancedData = await Promise.all(
        (data || []).map(async (request) => {
          try {
            // Fetch product details
            const { data: productData } = await supabase
              .from('products')
              .select('title, price, price_pkr')
              .eq('id', request.product_id)
              .single();

            // Fetch profile details
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('user_id', request.user_id)
              .single();

            // Fetch purchase status
            const [accessCheck, paymentCheck] = await Promise.all([
              supabase
                .from('user_product_access')
                .select('created_at')
                .eq('user_id', request.user_id)
                .eq('product_id', request.product_id)
                .single(),
              supabase
                .from('payment_requests')
                .select('created_at, payment_method, status')
                .eq('user_id', request.user_id)
                .eq('product_id', request.product_id)
                .eq('status', 'approved')
                .single()
            ]);

            const hasAccess = !accessCheck.error;
            const hasApprovedPayment = !paymentCheck.error;
            const purchaseDate = paymentCheck.data?.created_at || accessCheck.data?.created_at;
            const purchaseMethod = paymentCheck.data?.payment_method || (hasAccess ? 'direct_access' : 'unknown');

            return {
              ...request,
              products: productData || { title: 'Unknown Product', price: 0, price_pkr: null },
              profiles: profileData || { full_name: null, email: 'Unknown User' },
              purchase_status: {
                has_purchased: hasAccess || hasApprovedPayment,
                has_access: hasAccess,
                payment_approved: hasApprovedPayment,
                purchase_date: purchaseDate,
                purchase_method: purchaseMethod
              }
            };
          } catch (error) {
            console.error('Error enriching refund request:', error);
            return {
              ...request,
              products: { title: 'Unknown Product', price: 0, price_pkr: null },
              profiles: { full_name: null, email: 'Unknown User' },
              purchase_status: {
                has_purchased: false,
                has_access: false,
                payment_approved: false,
                purchase_date: null,
                purchase_method: 'unknown'
              }
            };
          }
        })
      );

      setRefundRequests(enhancedData);
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

  useEffect(() => {
    fetchRefundRequests();

    const subscription = supabase
      .channel('refund_requests_channel')
      .on('postgres_changes', {
        event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: 'refund_requests',
      }, (payload) => {
        console.log('Change received!', payload);
        // Re-fetch all requests to ensure data consistency and proper enhancement
        fetchRefundRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const updateRequestStatus = async (requestId: string, status: RefundRequest['status'], notes?: string) => {
    setIsUpdating(true);
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        processed_by: (await supabase.auth.getUser()).data.user?.id
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      const { error } = await supabase
        .from('refund_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      const request = refundRequests.find(r => r.id === requestId);
      if (request) {
        const notificationMessage = status === 'approved' 
          ? `Your refund request for "${request.products.title}" has been approved. Product ID: ${request.product_id}`
          : status === 'rejected'
          ? `Your refund request for "${request.products.title}" has been rejected.`
          : `Your refund request status has been updated to ${status}.`;

        await supabase
          .from('notifications')
          .insert({
            user_id: request.user_id,
            title: `Refund Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
            message: notificationMessage,
            type: 'refund_update',
            is_read: false
          });
      }

      toast({
        title: "Success",
        description: `Refund request ${status} successfully`,
      });

      // No need to call fetchRefundRequests here, as the real-time subscription will handle the update
      onUpdate?.();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating refund request:', error);
      toast({
        title: "Error",
        description: "Failed to update refund request",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('refund_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Refund request deleted successfully",
      });

      setDeleteDialogOpen(false);
      setRequestToDelete(null);
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting refund request:', error);
      toast({
        title: "Error",
        description: "Failed to delete refund request",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: RefundRequest['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: AlertTriangle };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border font-semibold`}>
        <Icon className="w-3 h-3 mr-1" />
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number, pricePkr?: number) => {
    if (pricePkr) {
      return `$${price} / PKR ${pricePkr}`;
    }
    return `$${price}`;
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xs sm:text-sm text-gray-600">Loading refund requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg lg:text-xl">
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Refund Request Management</span>
          </CardTitle>
          <CardDescription className="text-orange-100 text-xs sm:text-sm">
            Review and process customer refund requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-xl sm:text-2xl font-bold text-yellow-800">
                {refundRequests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-xs sm:text-sm text-yellow-600">Pending Review</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xl sm:text-2xl font-bold text-green-800">
                {refundRequests.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-xs sm:text-sm text-green-600">Approved</div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-xl sm:text-2xl font-bold text-red-800">
                {refundRequests.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-xs sm:text-sm text-red-600">Rejected</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="w-full space-y-3 sm:space-y-4">
        {refundRequests.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6 sm:p-8 text-center">
              <RefreshCw className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Refund Requests</h3>
              <p className="text-xs sm:text-sm text-gray-600">No refund requests have been submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          refundRequests.map((request) => (
            <Card key={request.id} className="border-0 shadow-lg bg-white/95 backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="w-full min-w-0 space-y-2 sm:space-y-3">
                    {/* User Info Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm break-words min-w-0">
                        {request.profiles?.full_name || request.profiles?.email || 'Unknown User'}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    {/* Email Row */}
                    <div className="flex items-start gap-2">
                      <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600 text-xs sm:text-sm break-all min-w-0">{request.contact_email}</span>
                    </div>

                    {/* Product Info Row */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Package className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 flex-shrink-0" />
                      <span className="font-semibold text-gray-900 text-xs sm:text-sm break-words min-w-0">{request.products.title}</span>
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-600 text-xs sm:text-sm">{formatPrice(request.products.price, request.products.price_pkr)}</span>
                    </div>

                    {/* Reason */}
                    <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 break-words">{request.reason}</p>

                    {/* Date & Product ID */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-start gap-1 min-w-0">
                        <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words min-w-0">Submitted: {formatDate(request.created_at)}</span>
                      </div>
                      <div className="flex items-start gap-1 min-w-0">
                        <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 mt-0.5" />
                        <span className="break-all min-w-0">Product ID: {request.product_id}</span>
                      </div>
                    </div>

                    {/* Purchase Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
                      {request.purchase_status?.has_purchased ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300 w-fit">
                          <CheckCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="break-words">✅ Valid Purchase ({request.purchase_status.purchase_method})</span>
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 border-red-300 w-fit">
                          <AlertTriangle className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="break-words">⚠️ No Purchase Found</span>
                        </Badge>
                      )}
                      {request.purchase_status?.purchase_date && (
                        <span className="text-gray-500 break-words">
                          Purchased: {formatDate(request.purchase_status.purchase_date)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.admin_notes || '');
                          }}
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
                            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                            <span className="break-words min-w-0">Refund Request Details</span>
                          </DialogTitle>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-4 sm:space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Customer</Label>
                                <p className="text-foreground text-xs sm:text-sm break-words">{selectedRequest.profiles?.full_name || selectedRequest.profiles?.email || 'Unknown User'}</p>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Contact Email</Label>
                                <p className="text-foreground text-xs sm:text-sm break-all">{selectedRequest.contact_email}</p>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Phone</Label>
                                <p className="text-foreground text-xs sm:text-sm break-all">{selectedRequest.contact_phone || 'Not provided'}</p>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Product</Label>
                                <p className="text-foreground text-xs sm:text-sm break-words">{selectedRequest.products.title}</p>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Price</Label>
                                <p className="text-foreground text-xs sm:text-sm">{formatPrice(selectedRequest.products.price, selectedRequest.products.price_pkr)}</p>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Submitted On</Label>
                                <p className="text-foreground text-xs sm:text-sm break-words">{formatDate(selectedRequest.created_at)}</p>
                              </div>
                              {selectedRequest.updated_at && (
                                <div className="min-w-0">
                                  <Label className="font-semibold text-foreground text-xs sm:text-sm">Last Updated</Label>
                                  <p className="text-foreground text-xs sm:text-sm break-words">{formatDate(selectedRequest.updated_at)}</p>
                                </div>
                              )}
                              {selectedRequest.processed_at && (
                                <div className="min-w-0">
                                  <Label className="font-semibold text-foreground text-xs sm:text-sm">Processed On</Label>
                                  <p className="text-foreground text-xs sm:text-sm break-words">{formatDate(selectedRequest.processed_at)}</p>
                                </div>
                              )}
                              {selectedRequest.processed_by && (
                                <div className="min-w-0">
                                  <Label className="font-semibold text-foreground text-xs sm:text-sm">Processed By</Label>
                                  <p className="text-foreground text-xs sm:text-sm break-all">{selectedRequest.processed_by}</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                              <div className="min-w-0">
                                <Label className="font-semibold text-foreground text-xs sm:text-sm">Reason for Refund</Label>
                                <p className="text-foreground text-xs sm:text-sm bg-muted/50 p-2 sm:p-3 rounded-md border border-border break-words">{selectedRequest.reason}</p>
                              </div>
                              {selectedRequest.additional_info && (
                                <div className="min-w-0">
                                  <Label className="font-semibold text-foreground text-xs sm:text-sm">Additional Information</Label>
                                  <p className="text-foreground text-xs sm:text-sm bg-muted/50 p-2 sm:p-3 rounded-md border border-border break-words">{selectedRequest.additional_info}</p>
                                </div>
                              )}
                            </div>

                            <div className="space-y-3 sm:space-y-4">
                              <h4 className="font-bold text-sm sm:text-base lg:text-lg text-foreground">Purchase Details</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="min-w-0">
                                  <Label className="font-semibold text-foreground text-xs sm:text-sm">Has Purchased</Label>
                                  <p className="text-foreground text-xs sm:text-sm">{selectedRequest.purchase_status?.has_purchased ? 'Yes' : 'No'}</p>
                                </div>
                                <div className="min-w-0">
                                  <Label className="font-semibold text-foreground text-xs sm:text-sm">Has Access</Label>
                                  <p className="text-foreground text-xs sm:text-sm">{selectedRequest.purchase_status?.has_access ? 'Yes' : 'No'}</p>
                                </div>
                                <div className="min-w-0">
                                  <Label className="font-semibold text-foreground text-xs sm:text-sm">Payment Approved</Label>
                                  <p className="text-foreground text-xs sm:text-sm">{selectedRequest.purchase_status?.payment_approved ? 'Yes' : 'No'}</p>
                                </div>
                                {selectedRequest.purchase_status?.purchase_date && (
                                  <div className="min-w-0">
                                    <Label className="font-semibold text-foreground text-xs sm:text-sm">Purchase Date</Label>
                                    <p className="text-foreground text-xs sm:text-sm break-words">{formatDate(selectedRequest.purchase_status.purchase_date)}</p>
                                  </div>
                                )}
                                {selectedRequest.purchase_status?.purchase_method && (
                                  <div className="min-w-0">
                                    <Label className="font-semibold text-foreground text-xs sm:text-sm">Purchase Method</Label>
                                    <p className="text-foreground text-xs sm:text-sm break-words">{selectedRequest.purchase_status.purchase_method}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2 min-w-0">
                              <Label htmlFor="adminNotes" className="font-semibold text-foreground text-xs sm:text-sm">Admin Notes</Label>
                              <Textarea
                                id="adminNotes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add internal notes about this request..."
                                rows={4}
                                className="bg-background/50 border-primary/30 text-foreground placeholder:text-muted-foreground/60 text-xs sm:text-sm w-full"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                              {selectedRequest.status === 'pending' && (
                                <Button
                                  onClick={() => updateRequestStatus(selectedRequest.id, 'rejected', adminNotes)}
                                  variant="destructive"
                                  disabled={isUpdating}
                                  className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                                >
                                  {isUpdating ? 'Rejecting...' : <><XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" /> Reject</>}
                                </Button>
                              )}
                              {selectedRequest.status === 'pending' && (
                                <Button
                                  onClick={() => updateRequestStatus(selectedRequest.id, 'approved', adminNotes)}
                                  disabled={isUpdating}
                                  className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                                >
                                  {isUpdating ? 'Approving...' : <><CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" /> Approve</>}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Dialog open={deleteDialogOpen && requestToDelete === request.id} onOpenChange={(open) => {
                      setDeleteDialogOpen(open);
                      if (!open) setRequestToDelete(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setRequestToDelete(request.id);
                            setDeleteDialogOpen(true);
                          }}
                          variant="destructive"
                          size="sm"
                          className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                        >
                          <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-sm sm:text-base">Delete Refund Request</DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm">
                            Are you sure you want to delete this refund request? This action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setDeleteDialogOpen(false);
                              setRequestToDelete(null);
                            }}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => deleteRequest(request.id)}
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            Delete
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default RefundRequestManagement;