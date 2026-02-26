import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Mail, Phone, Trash2, CheckCircle, XCircle, Clock, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { adminApi } from '../../lib/api';
import { formatDate, statusLabels, statusColors, services } from '../../lib/utils';

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  const fetchInquiries = () => {
    setLoading(true);
    const params = statusFilter !== 'all' ? { status: statusFilter } : {};
    adminApi.getInquiries(params)
      .then(res => setInquiries(res.data))
      .catch(() => toast.error('Failed to load inquiries'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await adminApi.updateInquiry(id, newStatus);
      toast.success('Inquiry status updated');
      fetchInquiries();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (!selectedInquiry) return;
    try {
      await adminApi.deleteInquiry(selectedInquiry.id);
      toast.success('Inquiry deleted');
      setDeleteDialog(false);
      setSelectedInquiry(null);
      fetchInquiries();
    } catch {
      toast.error('Failed to delete inquiry');
    }
  };

  const filteredInquiries = inquiries.filter(inquiry =>
    inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inquiry.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getServiceLabel = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    return service?.title || serviceId;
  };

  return (
    <div data-testid="admin-inquiries">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Inquiries</h1>
        <p className="text-slate-500 mt-1">Manage contact form submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-sm border-slate-300"
            data-testid="search-input"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-11 rounded-sm border-slate-300" data-testid="status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-sm"></div>
          ))}
        </div>
      ) : filteredInquiries.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200">
          <Mail className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No inquiries found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((inquiry, index) => (
            <motion.div
              key={inquiry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 p-6"
              data-testid={`inquiry-card-${inquiry.id}`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-900">{inquiry.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-sm ${statusColors[inquiry.status]}`}>
                      {statusLabels[inquiry.status]}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-4">
                    <a href={`mailto:${inquiry.email}`} className="flex items-center gap-1 hover:text-slate-900">
                      <Mail className="h-4 w-4" />
                      {inquiry.email}
                    </a>
                    <a href={`tel:${inquiry.phone}`} className="flex items-center gap-1 hover:text-slate-900">
                      <Phone className="h-4 w-4" />
                      {inquiry.phone}
                    </a>
                    {inquiry.company && (
                      <span className="flex items-center gap-1">
                        <Building2 className="h-4 w-4" />
                        {inquiry.company}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(inquiry.created_at)}
                    </span>
                  </div>

                  <div className="mb-4">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Service: </span>
                    <span className="text-sm text-slate-900">{getServiceLabel(inquiry.service)}</span>
                  </div>

                  <p className="text-slate-600 text-sm bg-slate-50 p-4 border-l-4 border-slate-300">
                    {inquiry.message}
                  </p>
                </div>

                <div className="flex md:flex-col gap-2">
                  <Select 
                    value={inquiry.status} 
                    onValueChange={(value) => handleStatusChange(inquiry.id, value)}
                  >
                    <SelectTrigger className="w-[140px] h-9 rounded-sm text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">
                        <span className="flex items-center gap-2">
                          <Clock className="h-3 w-3" /> New
                        </span>
                      </SelectItem>
                      <SelectItem value="contacted">
                        <span className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" /> Contacted
                        </span>
                      </SelectItem>
                      <SelectItem value="closed">
                        <span className="flex items-center gap-2">
                          <XCircle className="h-3 w-3" /> Closed
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedInquiry(inquiry);
                      setDeleteDialog(true);
                    }}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Inquiry</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600">
            Are you sure you want to delete the inquiry from <strong>{selectedInquiry?.name}</strong>? 
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
