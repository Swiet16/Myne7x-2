import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CreditCard, Search, CheckCircle, XCircle, Clock, Eye, AlertTriangle, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/useAuth';

interface PaymentRequest {
  id: string;
  user_id: string;
  product_id: string;
  status: string;
  payment_method: string;
  contact_method: string;
  contact_value: string;
  transaction_id: string;
  payment_screenshot_url: string;
  admin_notes: string;
  alternative_payment_details?: string;
  created_at: string;
  product_title?: string;
  user_email?: string;
}

interface PaymentRequestManagementProps {
  onUpdate?: () => void;
}

const PaymentRequestManagement = ({ onUpdate }: PaymentRequestManagementProps) => {
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPaymentRequests();
    
    // Check if user is super_admin
    if (user) {
      checkSuperAdminStatus();
    }
    
    // Set up real-time subscription
    const channel = supabase
      .channel('payment_requests_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_requests' },
        () => {
          fetchPaymentRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkSuperAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data?.role === 'super_admin') {
        setIsSuperAdmin(true);
      }
    } catch (error) {
      setIsSuperAdmin(false);
    }
  };

  const fetchPaymentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch related data separately
      const formattedData = await Promise.all(
        (data || []).map(async (request) => {
          const [productData, profileData] = await Promise.all([
            supabase.from('products').select('title').eq('id', request.product_id).single(),
            supabase.from('profiles').select('email').eq('user_id', request.user_id).single()
          ]);
          
          return {
            ...request,
            product_title: productData.data?.title,
            user_email: profileData.data?.email
          };
        })
      );
      
      setRequests(formattedData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load payment requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (notes) updates.admin_notes = notes;

      const { error } = await supabase
        .from('payment_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // If approved, grant user access to the product
      if (status === 'approved') {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from('user_product_access')
            .insert({
              user_id: request.user_id,
              product_id: request.product_id
            });

          // Create notification for user
          await supabase
            .from('notifications')
            .insert({
              user_id: request.user_id,
              title: 'Payment Approved!',
              message: `Your payment for "${request.product_title}" has been approved. Product ID: ${request.product_id}. You can now download the product.`,
              type: 'success',
              related_request_id: requestId
            });
        }
      }

      toast({
        title: "Success",
        description: `Payment request ${status} successfully`,
      });

      fetchPaymentRequests();
      onUpdate?.(); // Call the onUpdate callback to refresh stats
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment request",
        variant: "destructive"
      });
    }
  };

  const revokeAccess = async (requestId: string, shouldNotify: boolean = true) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        // Remove user access
        await supabase
          .from('user_product_access')
          .delete()
          .eq('user_id', request.user_id)
          .eq('product_id', request.product_id);

        // Update request status to pending
        await supabase
          .from('payment_requests')
          .update({ status: 'pending' })
          .eq('id', requestId);

        // Create notification for user only if shouldNotify is true
        if (shouldNotify) {
          await supabase
            .from('notifications')
            .insert({
              user_id: request.user_id,
              title: 'Access Revoked',
              message: `Your access to "${request.product_title}" has been revoked. Please contact support if you have questions.`,
              type: 'error',
              related_request_id: requestId
            });
        }

        toast({
          title: "Success",
          description: `Access revoked and request reset to pending${shouldNotify ? ' (user notified)' : ' (no notification sent)'}`,
        });

        fetchPaymentRequests();
        onUpdate?.();
        setSelectedRequest(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke access",
        variant: "destructive"
      });
    }
  };

  const resetPaymentRequest = async (requestId: string, shouldNotify: boolean = true) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (request) {
        // Remove user access if exists
        await supabase
          .from('user_product_access')
          .delete()
          .eq('user_id', request.user_id)
          .eq('product_id', request.product_id);

        // Delete the payment request
        const { error } = await supabase
          .from('payment_requests')
          .delete()
          .eq('id', requestId);

        if (error) throw error;

        // Create notification for user only if shouldNotify is true
        if (shouldNotify) {
          await supabase
            .from('notifications')
            .insert({
              user_id: request.user_id,
              title: 'Payment Request Reset',
              message: `Your payment request for "${request.product_title}" has been reset. You can submit a new purchase request if needed.`,
              type: 'info',
              related_request_id: requestId
            });
        }

        toast({
          title: "Success",
          description: `Payment request has been reset. User can now purchase again${shouldNotify ? ' (user notified)' : ' (no notification sent)'}`,
        });

        fetchPaymentRequests();
        onUpdate?.();
        setSelectedRequest(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset payment request",
        variant: "destructive"
      });
    }
  };

  const reApproveRequest = async (requestId: string, shouldNotify: boolean = true, notes?: string) => {
    try {
      const updates: any = { status: 'approved' };
      if (notes) updates.admin_notes = notes;

      const { error } = await supabase
        .from('payment_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // Grant user access to the product
      const request = requests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('user_product_access')
          .insert({
            user_id: request.user_id,
            product_id: request.product_id
          });

        // Create notification for user only if shouldNotify is true
        if (shouldNotify) {
          await supabase
            .from('notifications')
            .insert({
              user_id: request.user_id,
              title: 'Payment Approved!',
              message: `Your payment for "${request.product_title}" has been approved. Product ID: ${request.product_id}. You can now download the product.`,
              type: 'success',
              related_request_id: requestId
            });
        }
      }

      toast({
        title: "Success",
        description: `Payment request approved successfully${shouldNotify ? ' (user notified)' : ' (no notification sent)'}`,
      });

      fetchPaymentRequests();
      onUpdate?.();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve payment request",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const filteredRequests = requests.filter(request =>
    request.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg lg:text-xl">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Payment Request Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-sm sm:text-base">Loading payment requests...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg lg:text-xl">
          <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
          Payment Request Management
        </CardTitle>
        <CardDescription className="text-blue-100 text-xs sm:text-sm">
          Review and approve payment requests from users
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 lg:p-6 bg-white">
        <div className="mb-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 flex-shrink-0" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden lg:block rounded-md border overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">User</TableHead>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs">Payment Method</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="bg-white hover:bg-gray-50">
                  <TableCell>
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{request.user_email}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {request.contact_method}: {request.contact_value}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{request.product_title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {request.payment_method === 'nayapay' ? 'Nayapay' : 'Custom'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(request.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {request.status === 'pending' && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                className="h-8 px-2"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-2">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                  Approve Payment Request?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-700">
                                  Are you sure you want to approve this payment request? This will grant the user access to the product and cannot be easily undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => updateRequestStatus(request.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white">
                                  Yes, Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 px-2"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-white border-2">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                  Reject Payment Request?
                                </AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-700">
                                  Are you sure you want to reject this payment request? The user will not get access to the product.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => updateRequestStatus(request.id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white">
                                  Yes, Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      
                      {request.status === 'approved' && isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 px-2 text-xs"
                              onClick={() => setSendNotification(true)}
                            >
                              Revoke Access
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-2">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Revoke Access?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-700">
                                This will remove the user's access to the product and reset the request to pending.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex items-center space-x-2 px-6 py-2">
                              <Checkbox
                                id={`notify-revoke-${request.id}`}
                                checked={sendNotification}
                                onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                              />
                              <label
                                htmlFor={`notify-revoke-${request.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                              >
                                Send notification to user
                              </label>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => revokeAccess(request.id, sendNotification)} className="bg-red-500 hover:bg-red-600 text-white">
                                Yes, Revoke
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {request.status === 'rejected' && isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => setSendNotification(true)}
                            >
                              Re-Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-2">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Re-Approve Payment Request?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-700">
                                This will grant the user access to the product. Are you sure you want to approve this previously rejected request?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex items-center space-x-2 px-6 py-2">
                              <Checkbox
                                id={`notify-reapprove-${request.id}`}
                                checked={sendNotification}
                                onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                              />
                              <label
                                htmlFor={`notify-reapprove-${request.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                              >
                                Send notification to user
                              </label>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => reApproveRequest(request.id, sendNotification)} className="bg-green-500 hover:bg-green-600 text-white">
                                Yes, Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      {/* Super Admin Reset Button */}
                      {isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2 text-xs border-orange-500 text-orange-600 hover:bg-orange-50"
                              onClick={() => setSendNotification(true)}
                            >
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white border-2">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                <RotateCcw className="h-5 w-5 text-orange-500" />
                                Reset Payment Request?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-700">
                                This will completely delete the payment request and remove all access. The user will be able to purchase again. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="flex items-center space-x-2 px-6 py-2">
                              <Checkbox
                                id={`notify-reset-${request.id}`}
                                checked={sendNotification}
                                onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                              />
                              <label
                                htmlFor={`notify-reset-${request.id}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                              >
                                Send notification to user
                              </label>
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => resetPaymentRequest(request.id, sendNotification)} className="bg-orange-500 hover:bg-orange-600 text-white">
                                Yes, Reset
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setAdminNotes(request.admin_notes || '');
                            }}
                            className="h-8 px-2"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
                          <DialogHeader className="bg-white">
                            <DialogTitle className="text-base sm:text-lg text-gray-900 font-bold">Payment Request Details</DialogTitle>
                            <DialogDescription className="text-xs sm:text-sm text-gray-700">
                              Review the payment request information
                            </DialogDescription>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4 bg-white p-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm text-gray-900 font-bold block mb-1">User:</strong> 
                                  <p className="text-xs sm:text-sm break-all text-gray-800">{selectedRequest.user_email}</p>
                                </div>
                                <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm text-gray-900 font-bold block mb-1">Product:</strong> 
                                  <p className="text-xs sm:text-sm break-words text-gray-800">{selectedRequest.product_title}</p>
                                </div>
                                <div className="col-span-1 sm:col-span-2 min-w-0 bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Product ID:</strong>
                                  <code className="block px-3 py-2 bg-white rounded text-xs font-mono break-all text-gray-900 border border-gray-300">
                                    {selectedRequest.product_id}
                                  </code>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Payment Method:</strong>
                                  <Badge variant="outline" className="text-xs bg-white border-gray-300 text-gray-900">
                                    {selectedRequest.payment_method === 'nayapay' ? 'Nayapay' : 'Custom'}
                                  </Badge>
                                </div>
                                <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm text-gray-900 font-bold block mb-1">Transaction ID:</strong> 
                                  <p className="text-xs sm:text-sm break-all text-gray-800">{selectedRequest.transaction_id || 'N/A'}</p>
                                </div>
                                <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm text-gray-900 font-bold block mb-1">Contact:</strong> 
                                  <p className="text-xs sm:text-sm break-all text-gray-800">{selectedRequest.contact_method} - {selectedRequest.contact_value}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Status:</strong> 
                                  {getStatusBadge(selectedRequest.status)}
                                </div>
                                <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">Submitted:</strong> 
                                  <p className="text-xs sm:text-sm text-gray-800">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                                {selectedRequest.alternative_payment_details && (
                                  <div className="col-span-1 sm:col-span-2 min-w-0 bg-gray-50 p-3 rounded-lg">
                                    <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">Payment Details / Description:</strong>
                                    <p className="text-xs sm:text-sm break-words text-gray-800">{selectedRequest.alternative_payment_details}</p>
                                  </div>
                                )}
                              </div>

                              {selectedRequest.payment_screenshot_url && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Payment Screenshot:</strong>
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="outline" size="sm" className="text-xs bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                                        <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                        View Screenshot
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto bg-white">
                                      <DialogHeader className="bg-white">
                                        <DialogTitle className="text-base sm:text-lg text-gray-900 font-bold">Payment Screenshot</DialogTitle>
                                      </DialogHeader>
                                      <div className="flex justify-center p-2 bg-white">
                                        <img 
                                          src={selectedRequest.payment_screenshot_url} 
                                          alt="Payment Screenshot" 
                                          className="w-full h-auto max-h-[70vh] object-contain border rounded"
                                        />
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}

                              <div className="bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Admin Notes:</strong>
                                <Textarea
                                  value={adminNotes || selectedRequest.admin_notes || ''}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add admin notes..."
                                  className="mt-2 text-xs sm:text-sm bg-white text-gray-900 border-gray-300"
                                  rows={3}
                                />
                              </div>

                              {selectedRequest.status === 'pending' && (
                                <div className="flex flex-col sm:flex-row gap-2 pt-4 bg-white">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button className="flex-1 text-xs sm:text-sm">
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Approve
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                          <CheckCircle className="h-5 w-5 text-green-500" />
                                          Approve Payment Request?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-700">
                                          Are you sure you want to approve this payment request for <strong>{selectedRequest.user_email}</strong>? This will grant access to <strong>{selectedRequest.product_title}</strong> and cannot be easily undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => updateRequestStatus(selectedRequest.id, 'approved', adminNotes)} className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
                                          Yes, Approve
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="destructive" className="flex-1 text-xs sm:text-sm">
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                          <AlertTriangle className="h-5 w-5 text-red-500" />
                                          Reject Payment Request?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-700">
                                          Are you sure you want to reject this payment request from <strong>{selectedRequest.user_email}</strong>? They will not get access to the product.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => updateRequestStatus(selectedRequest.id, 'rejected', adminNotes)} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
                                          Yes, Reject
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}

                              {selectedRequest.status === 'approved' && isSuperAdmin && (
                                <div className="pt-4 bg-white">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="destructive" 
                                        className="w-full text-xs sm:text-sm"
                                        onClick={() => setSendNotification(true)}
                                      >
                                        <AlertTriangle className="h-4 w-4 mr-2" />
                                        Revoke Access
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                          <AlertTriangle className="h-5 w-5 text-red-500" />
                                          Revoke Access?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-700">
                                          This will remove <strong>{selectedRequest.user_email}</strong>'s access to <strong>{selectedRequest.product_title}</strong> and reset the request to pending.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="flex items-center space-x-2 px-6 py-2">
                                        <Checkbox
                                          id={`notify-revoke-detail-${selectedRequest.id}`}
                                          checked={sendNotification}
                                          onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                                        />
                                        <label
                                          htmlFor={`notify-revoke-detail-${selectedRequest.id}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                                        >
                                          Send notification to user
                                        </label>
                                      </div>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => revokeAccess(selectedRequest.id, sendNotification)} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
                                          Yes, Revoke
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}

                              {selectedRequest.status === 'rejected' && isSuperAdmin && (
                                <div className="pt-4 bg-white">
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        className="w-full text-xs sm:text-sm"
                                        onClick={() => setSendNotification(true)}
                                      >
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Re-Approve Request
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                          <CheckCircle className="h-5 w-5 text-green-500" />
                                          Re-Approve Payment Request?
                                        </AlertDialogTitle>
                                        <AlertDialogDescription className="text-gray-700">
                                          This will grant <strong>{selectedRequest.user_email}</strong> access to <strong>{selectedRequest.product_title}</strong>. Are you sure you want to approve this previously rejected request?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <div className="flex items-center space-x-2 px-6 py-2">
                                        <Checkbox
                                          id={`notify-reapprove-detail-${selectedRequest.id}`}
                                          checked={sendNotification}
                                          onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                                        />
                                        <label
                                          htmlFor={`notify-reapprove-detail-${selectedRequest.id}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                                        >
                                          Send notification to user
                                        </label>
                                      </div>
                                      <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                        <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => reApproveRequest(selectedRequest.id, sendNotification, adminNotes)} className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
                                          Yes, Approve
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View - Shown on Mobile/Tablet */}
        <div className="lg:hidden space-y-3 sm:space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-2 border-gray-300 shadow-lg overflow-hidden bg-white">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  {/* User Info */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-xs sm:text-sm break-all">{request.user_email}</p>
                      <p className="text-xs text-gray-700 break-all">
                        {request.contact_method}: {request.contact_value}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  {/* Product Info */}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-xs sm:text-sm break-words">{request.product_title}</p>
                    <div className="mt-1">
                      <p className="text-xs text-gray-700 mb-1">Product ID:</p>
                      <code className="block px-2 py-1 bg-gray-100 text-gray-900 rounded text-xs font-mono break-all">
                        {request.product_id}
                      </code>
                    </div>
                  </div>

                  {/* Payment Method & Date */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="outline" className="text-xs border-gray-400 text-gray-900">
                      {request.payment_method === 'nayapay' ? 'Nayapay' : 'Custom'}
                    </Badge>
                    <span className="text-gray-700">
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Purchase Date if available */}
                  {request.alternative_payment_details && (
                    <div className="text-xs">
                      <span className="font-semibold text-gray-900">Payment Details: </span>
                      <span className="text-gray-700 break-words">{request.alternative_payment_details}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    {request.status === 'pending' && (
                      <>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              className="flex-1 text-sm sm:text-base h-12 sm:h-11 font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Approve
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Approve Payment Request?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-700">
                                Are you sure you want to approve this payment request? This will grant the user access to the product and cannot be easily undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => updateRequestStatus(request.id, 'approved')} className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
                                Yes, Approve
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1 text-sm sm:text-base h-12 sm:h-11 font-semibold shadow-md hover:shadow-lg transition-all"
                            >
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Reject Payment Request?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-700">
                                Are you sure you want to reject this payment request? The user will not get access to the product.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => updateRequestStatus(request.id, 'rejected')} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
                                Yes, Reject
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}

                    {request.status === 'approved' && isSuperAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 text-sm sm:text-base h-12 sm:h-11 font-semibold shadow-md hover:shadow-lg transition-all"
                            onClick={() => setSendNotification(true)}
                          >
                            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Revoke Access
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                              Revoke Access?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-700">
                              This will remove the user's access to the product and reset the request to pending.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex items-center space-x-2 px-6 py-2">
                            <Checkbox
                              id={`notify-revoke-mobile-${request.id}`}
                              checked={sendNotification}
                              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                            />
                            <label
                              htmlFor={`notify-revoke-mobile-${request.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                            >
                              Send notification to user
                            </label>
                          </div>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => revokeAccess(request.id, sendNotification)} className="bg-red-500 hover:bg-red-600 text-white w-full sm:w-auto">
                              Yes, Revoke
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {request.status === 'rejected' && isSuperAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            className="flex-1 text-sm sm:text-base h-12 sm:h-11 font-semibold shadow-md hover:shadow-lg transition-all"
                            onClick={() => setSendNotification(true)}
                          >
                            <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Re-Approve
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                              <CheckCircle className="h-5 w-5 text-green-500" />
                              Re-Approve Payment Request?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-700">
                              This will grant the user access to the product. Are you sure you want to approve this previously rejected request?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex items-center space-x-2 px-6 py-2">
                            <Checkbox
                              id={`notify-reapprove-mobile-${request.id}`}
                              checked={sendNotification}
                              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                            />
                            <label
                              htmlFor={`notify-reapprove-mobile-${request.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                            >
                              Send notification to user
                            </label>
                          </div>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => reApproveRequest(request.id, sendNotification)} className="bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
                              Yes, Approve
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {/* Super Admin Reset Button */}
                    {isSuperAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-sm sm:text-base h-12 sm:h-11 border-2 border-orange-500 text-orange-600 hover:bg-orange-50 font-semibold shadow-md hover:shadow-lg transition-all"
                            onClick={() => setSendNotification(true)}
                          >
                            <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            Reset
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                              <RotateCcw className="h-5 w-5 text-orange-500" />
                              Reset Payment Request?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-700">
                              This will completely delete the payment request and remove all access. The user will be able to purchase again. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex items-center space-x-2 px-6 py-2">
                            <Checkbox
                              id={`notify-reset-mobile-${request.id}`}
                              checked={sendNotification}
                              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                            />
                            <label
                              htmlFor={`notify-reset-mobile-${request.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                            >
                              Send notification to user
                            </label>
                          </div>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full sm:w-auto">Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => resetPaymentRequest(request.id, sendNotification)} className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto">
                              Yes, Reset
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.admin_notes || '');
                          }}
                          className={`text-sm sm:text-base h-12 sm:h-11 font-semibold shadow-md hover:shadow-lg transition-all border-2 ${request.status === 'pending' ? 'flex-1' : 'w-full'}`}
                        >
                          <Eye className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto bg-white">
                        <DialogHeader className="bg-white">
                          <DialogTitle className="text-base sm:text-lg text-gray-900 font-bold">Payment Request Details</DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm text-gray-700">
                            Review the payment request information
                          </DialogDescription>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-3 sm:space-y-4 bg-white p-2">
                            <div className="grid grid-cols-1 gap-3">
                              <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">User:</strong> 
                                <p className="text-xs sm:text-sm break-all text-gray-800">{selectedRequest.user_email}</p>
                              </div>
                              <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">Product:</strong> 
                                <p className="text-xs sm:text-sm break-words text-gray-800">{selectedRequest.product_title}</p>
                              </div>
                              <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Product ID:</strong>
                                <code className="block px-3 py-2 bg-white rounded text-xs font-mono break-all text-gray-900 border border-gray-300">
                                  {selectedRequest.product_id}
                                </code>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Payment Method:</strong>
                                <Badge variant="outline" className="text-xs bg-white border-gray-300 text-gray-900">
                                  {selectedRequest.payment_method === 'nayapay' ? 'Nayapay' : 'Custom'}
                                </Badge>
                              </div>
                              <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">Transaction ID:</strong> 
                                <p className="text-xs sm:text-sm break-all text-gray-800">{selectedRequest.transaction_id || 'N/A'}</p>
                              </div>
                              <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">Contact:</strong> 
                                <p className="text-xs sm:text-sm break-all text-gray-800">{selectedRequest.contact_method} - {selectedRequest.contact_value}</p>
                              </div>
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Status:</strong> 
                                {getStatusBadge(selectedRequest.status)}
                              </div>
                              <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">Submitted:</strong> 
                                <p className="text-xs sm:text-sm text-gray-800">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                              </div>
                              {selectedRequest.alternative_payment_details && (
                                <div className="min-w-0 bg-gray-50 p-3 rounded-lg">
                                  <strong className="text-xs sm:text-sm block mb-1 text-gray-900 font-bold">Payment Details / Description:</strong>
                                  <p className="text-xs sm:text-sm break-words text-gray-800">{selectedRequest.alternative_payment_details}</p>
                                </div>
                              )}
                            </div>

                            {selectedRequest.payment_screenshot_url && (
                              <div className="bg-gray-50 p-3 rounded-lg">
                                <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Payment Screenshot:</strong>
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="text-xs w-full sm:w-auto bg-white border-gray-300 text-gray-900 hover:bg-gray-100">
                                      <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                      View Screenshot
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-auto bg-white">
                                    <DialogHeader className="bg-white">
                                      <DialogTitle className="text-base sm:text-lg text-gray-900 font-bold">Payment Screenshot</DialogTitle>
                                    </DialogHeader>
                                    <div className="flex justify-center p-2 bg-white">
                                      <img 
                                        src={selectedRequest.payment_screenshot_url} 
                                        alt="Payment Screenshot" 
                                        className="w-full h-auto max-h-[70vh] object-contain border rounded"
                                      />
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}

                            <div className="bg-gray-50 p-3 rounded-lg">
                              <strong className="text-xs sm:text-sm block mb-2 text-gray-900 font-bold">Admin Notes:</strong>
                              <Textarea
                                value={adminNotes || selectedRequest.admin_notes || ''}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add admin notes..."
                                className="text-xs sm:text-sm bg-white text-gray-900 border-gray-300"
                                rows={3}
                              />
                            </div>

                            {selectedRequest.status === 'pending' && (
                              <div className="flex flex-col gap-2 pt-2 bg-white">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button className="w-full text-xs sm:text-sm">
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve Request
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        Approve Payment Request?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-700">
                                        Are you sure you want to approve this payment request for <strong>{selectedRequest.user_email}</strong>? This will grant access to <strong>{selectedRequest.product_title}</strong> and cannot be easily undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col gap-2">
                                      <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => updateRequestStatus(selectedRequest.id, 'approved', adminNotes)} className="bg-green-500 hover:bg-green-600 text-white w-full">
                                        Yes, Approve
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="w-full text-xs sm:text-sm">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject Request
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        Reject Payment Request?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-700">
                                        Are you sure you want to reject this payment request from <strong>{selectedRequest.user_email}</strong>? They will not get access to the product.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="flex-col gap-2">
                                      <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => updateRequestStatus(selectedRequest.id, 'rejected', adminNotes)} className="bg-red-500 hover:bg-red-600 text-white w-full">
                                        Yes, Reject
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}

                            {selectedRequest.status === 'approved' && isSuperAdmin && (
                              <div className="pt-2 bg-white">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="destructive" 
                                      className="w-full text-xs sm:text-sm"
                                      onClick={() => setSendNotification(true)}
                                    >
                                      <AlertTriangle className="h-4 w-4 mr-2" />
                                      Revoke Access
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                        <AlertTriangle className="h-5 w-5 text-red-500" />
                                        Revoke Access?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-700">
                                        This will remove <strong>{selectedRequest.user_email}</strong>'s access to <strong>{selectedRequest.product_title}</strong> and reset the request to pending.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="flex items-center space-x-2 px-6 py-2">
                                      <Checkbox
                                        id={`notify-revoke-mobile-detail-${selectedRequest.id}`}
                                        checked={sendNotification}
                                        onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                                      />
                                      <label
                                        htmlFor={`notify-revoke-mobile-detail-${selectedRequest.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                                      >
                                        Send notification to user
                                      </label>
                                    </div>
                                    <AlertDialogFooter className="flex-col gap-2">
                                      <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => revokeAccess(selectedRequest.id, sendNotification)} className="bg-red-500 hover:bg-red-600 text-white w-full">
                                        Yes, Revoke
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}

                            {selectedRequest.status === 'rejected' && isSuperAdmin && (
                              <div className="pt-2 bg-white">
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      className="w-full text-xs sm:text-sm"
                                      onClick={() => setSendNotification(true)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Re-Approve Request
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="bg-white max-w-[95vw] sm:max-w-lg border-2">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center gap-2 text-gray-900">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        Re-Approve Payment Request?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription className="text-gray-700">
                                        This will grant <strong>{selectedRequest.user_email}</strong> access to <strong>{selectedRequest.product_title}</strong>. Are you sure you want to approve this previously rejected request?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <div className="flex items-center space-x-2 px-6 py-2">
                                      <Checkbox
                                        id={`notify-reapprove-mobile-detail-${selectedRequest.id}`}
                                        checked={sendNotification}
                                        onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                                      />
                                      <label
                                        htmlFor={`notify-reapprove-mobile-detail-${selectedRequest.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-900 cursor-pointer"
                                      >
                                        Send notification to user
                                      </label>
                                    </div>
                                    <AlertDialogFooter className="flex-col gap-2">
                                      <AlertDialogCancel className="bg-gray-200 text-gray-900 hover:bg-gray-300 border border-gray-400 w-full">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => reApproveRequest(selectedRequest.id, sendNotification, adminNotes)} className="bg-green-500 hover:bg-green-600 text-white w-full">
                                        Yes, Approve
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm sm:text-base">
            No payment requests found
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentRequestManagement;