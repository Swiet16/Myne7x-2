import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  Reply,
  Eye,
  Trash2,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ContactRequest {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'resolved';
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  replied_at?: string;
  replied_by?: string;
}

interface ContactRequestManagementProps {
  onUpdate?: () => void;
}

const ContactRequestManagement = ({ onUpdate }: ContactRequestManagementProps) => {
  const { toast } = useToast();
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ContactRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchContactRequests();
  }, []);

  const fetchContactRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching contact requests:', error);
        // Don't throw error, just show empty state with error message
        setContactRequests([]);
        toast({
          title: "Database Connection Issue",
          description: "Contact requests table may not exist yet. Please run the SQL migrations first.",
          variant: "destructive"
        });
        return;
      }
      
      setContactRequests(data || []);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      setContactRequests([]);
      toast({
        title: "Error",
        description: "Failed to load contact requests. Please check your database connection.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: ContactRequest['status'], notes?: string) => {
    setIsUpdating(true);
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.admin_notes = notes;
      }

      if (status === 'replied') {
        updateData.replied_at = new Date().toISOString();
        updateData.replied_by = (await supabase.auth.getUser()).data.user?.id;
      }

      const { error } = await supabase
        .from('contact_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Contact request marked as ${status}`,
      });

      fetchContactRequests();
      onUpdate?.();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error updating contact request:', error);
      toast({
        title: "Error",
        description: "Failed to update contact request",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this contact request?')) return;

    try {
      const { error } = await supabase
        .from('contact_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contact request deleted successfully",
      });

      fetchContactRequests();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting contact request:', error);
      toast({
        title: "Error",
        description: "Failed to delete contact request",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: ContactRequest['status']) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      read: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: Eye },
      replied: { color: 'bg-green-100 text-green-800 border-green-300', icon: Reply },
      resolved: { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: CheckCircle }
    };

    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-300', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} border font-semibold text-xs flex-shrink-0`}>
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

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white backdrop-blur-sm">
        <CardContent className="p-4 sm:p-6 lg:p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-900 text-xs sm:text-sm font-semibold">Loading contact requests...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 w-full">
      {/* Header */}
      <Card className="border-0 shadow-xl bg-white backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-white text-base sm:text-lg lg:text-xl">
            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            Contact Request Management
          </CardTitle>
          <CardDescription className="text-blue-100 text-xs sm:text-sm">
            Manage and respond to customer contact requests
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 bg-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
            <div className="text-center p-2 sm:p-3 lg:p-4 bg-yellow-50 rounded-lg border border-yellow-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-800">
                {contactRequests.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-yellow-700">Pending</div>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-4 bg-blue-50 rounded-lg border border-blue-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-800">
                {contactRequests.filter(r => r.status === 'read').length}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-blue-700">Read</div>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-4 bg-green-50 rounded-lg border border-green-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-800">
                {contactRequests.filter(r => r.status === 'replied').length}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-green-700">Replied</div>
            </div>
            <div className="text-center p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg border border-gray-300">
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                {contactRequests.filter(r => r.status === 'resolved').length}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-gray-700">Resolved</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Requests List */}
      <div className="space-y-3 sm:space-y-4">
        {contactRequests.length === 0 ? (
          <Card className="border-0 shadow-xl bg-white backdrop-blur-sm">
            <CardContent className="p-4 sm:p-6 lg:p-8 text-center bg-white">
              <MessageCircle className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Contact Requests</h3>
              <p className="text-gray-700 text-xs sm:text-sm">No contact requests have been submitted yet.</p>
            </CardContent>
          </Card>
        ) : (
          contactRequests.map((request) => (
            <Card key={request.id} className="border border-gray-300 shadow-lg bg-white backdrop-blur-sm hover:shadow-xl transition-shadow">
              <CardContent className="p-3 sm:p-4 lg:p-6 bg-white">
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    {/* User Info - Mobile Optimized */}
                    <div className="flex flex-col gap-2 mb-2 sm:mb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                        <span className="font-bold text-gray-900 text-xs sm:text-sm break-words">{request.name}</span>
                        {getStatusBadge(request.status)}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
                        <span className="text-gray-800 text-xs sm:text-sm break-all min-w-0">{request.email}</span>
                      </div>
                    </div>
                    
                    {/* Subject and Message */}
                    <h3 className="font-bold text-sm sm:text-base lg:text-lg text-gray-900 mb-2 break-words">{request.subject}</h3>
                    <p className="text-gray-800 text-xs sm:text-sm line-clamp-2 mb-2 break-words">{request.message}</p>
                    
                    {/* Date */}
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="break-words font-semibold">Submitted: {formatDate(request.created_at)}</span>
                    </div>
                  </div>
                  
                  {/* Action Buttons - Mobile Optimized */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setAdminNotes(request.admin_notes || '');
                          }}
                          className="flex-1 text-xs sm:text-sm h-9 border-gray-300 bg-white text-gray-900 hover:bg-gray-50"
                        >
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-auto bg-white border-gray-300">
                        <DialogHeader className="bg-white">
                          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 font-bold">
                            <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                            Contact Request Details
                          </DialogTitle>
                        </DialogHeader>
                        {selectedRequest && (
                          <div className="space-y-3 sm:space-y-4 bg-white">
                            <div className="grid grid-cols-1 gap-3 sm:gap-4 p-4 bg-gray-50 rounded-lg border border-gray-300">
                              <div className="min-w-0">
                                <Label className="font-bold text-xs sm:text-sm text-gray-900">Name</Label>
                                <p className="text-gray-800 text-xs sm:text-sm break-words mt-1">{selectedRequest.name}</p>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-bold text-xs sm:text-sm text-gray-900">Email</Label>
                                <p className="text-gray-800 text-xs sm:text-sm break-all mt-1">{selectedRequest.email}</p>
                              </div>
                              <div>
                                <Label className="font-bold text-xs sm:text-sm text-gray-900">Status</Label>
                                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                              </div>
                              <div className="min-w-0">
                                <Label className="font-bold text-xs sm:text-sm text-gray-900">Submitted</Label>
                                <p className="text-gray-800 text-xs sm:text-sm mt-1">{formatDate(selectedRequest.created_at)}</p>
                              </div>
                            </div>
                            <div className="min-w-0 p-4 bg-gray-50 rounded-lg border border-gray-300">
                              <Label className="font-bold text-xs sm:text-sm text-gray-900">Subject</Label>
                              <p className="text-gray-800 text-xs sm:text-sm mt-1 break-words">{selectedRequest.subject}</p>
                            </div>
                            <div className="min-w-0 p-4 bg-gray-50 rounded-lg border border-gray-300">
                              <Label className="font-bold text-xs sm:text-sm text-gray-900">Message</Label>
                              <p className="text-gray-800 text-xs sm:text-sm mt-1 whitespace-pre-wrap break-words">{selectedRequest.message}</p>
                            </div>
                            <div>
                              <Label htmlFor="admin-notes" className="font-bold text-xs sm:text-sm text-gray-900">Admin Notes</Label>
                              <Textarea
                                id="admin-notes"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add internal notes about this request..."
                                className="mt-2 text-xs sm:text-sm bg-white border-gray-300 text-gray-900"
                                rows={3}
                              />
                            </div>
                            <div className="flex flex-col gap-2 pt-4 border-t border-gray-300">
                              <Button
                                onClick={() => updateRequestStatus(selectedRequest.id, 'read', adminNotes)}
                                disabled={isUpdating}
                                variant="outline"
                                size="sm"
                                className="w-full text-xs sm:text-sm bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                Mark as Read
                              </Button>
                              <Button
                                onClick={() => updateRequestStatus(selectedRequest.id, 'replied', adminNotes)}
                                disabled={isUpdating}
                                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs sm:text-sm"
                                size="sm"
                              >
                                <Reply className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                Mark as Replied
                              </Button>
                              <Button
                                onClick={() => updateRequestStatus(selectedRequest.id, 'resolved', adminNotes)}
                                disabled={isUpdating}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm"
                                size="sm"
                              >
                                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                Mark as Resolved
                              </Button>
                              <Button
                                onClick={() => deleteRequest(selectedRequest.id)}
                                variant="destructive"
                                size="sm"
                                className="w-full text-xs sm:text-sm"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                                Delete Request
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button
                      onClick={() => deleteRequest(request.id)}
                      variant="destructive"
                      size="sm"
                      className="sm:w-auto text-xs sm:text-sm h-9"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0 mr-2" />
                      <span className="sm:hidden">Delete</span>
                    </Button>
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

export default ContactRequestManagement;