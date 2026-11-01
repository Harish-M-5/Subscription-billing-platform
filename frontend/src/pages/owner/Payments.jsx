import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Badge, statusTone, EmptyState, Spinner } from '../../components/ui/UI';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { paymentApi, invoiceApi } from '../../api/endpoints';
import { openOrDownloadBlob } from '../../utils/download';
import { useToast } from '../../context/ToastContext';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [method, setMethod] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    paymentApi
      .list({ method: method || undefined, status: status || undefined, limit: 50 })
      .then((res) => setPayments(res.data.payments))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load payments.'))
      .finally(() => setLoading(false));
  }, [method, status]);

  const downloadInvoice = async (invoice) => {
    setDownloadingId(invoice._id);
    try {
      const res = await invoiceApi.downloadPdf(invoice._id);
      openOrDownloadBlob(res.data, `${invoice.invoiceNumber}.pdf`);
    } catch (err) {
      toast.error('Failed to generate the invoice PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Payments</h1>
          <p className="text-slate-500 dark:text-slate-400">Track every payment recorded across your business.</p>
        </div>
        <div className="flex gap-2">
          <select className="input w-auto" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">All methods</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
          </select>
          <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} columns={7} />
        ) : payments.length === 0 ? (
          <EmptyState title="No payments found" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Invoice Status</th>
                  <th className="py-3 px-4 font-medium">Recorded By</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium text-right">Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{p.customer?.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{p.customer?.customerId}</p>
                    </td>
                    <td className="py-3 px-4">₹{p.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 capitalize">{p.method.replace('_', ' ')}</td>
                    <td className="py-3 px-4"><Badge tone={statusTone(p.status)}>{p.status}</Badge></td>
                    <td className="py-3 px-4">
                      {p.invoice ? (
                        <Badge tone={statusTone(p.invoice.status)}>
                          {p.invoice.status === 'partial' ? `Partial · ₹${p.invoice.balanceDue.toLocaleString()} due` : p.invoice.status === 'paid' ? 'Fully Paid' : 'Pending'}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{p.recordedBy?.fullName} <span className="text-xs capitalize">({p.recordedBy?.role})</span></td>
                    <td className="py-3 px-4 text-slate-500">{new Date(p.paidAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      {p.invoice ? (
                        <button
                          className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 disabled:opacity-50"
                          disabled={downloadingId === p.invoice._id}
                          onClick={() => downloadInvoice(p.invoice)}
                        >
                          {downloadingId === p.invoice._id ? <Spinner className="h-4 w-4" /> : <Download size={15} />}
                          PDF
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
