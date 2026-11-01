import { useEffect, useState } from 'react';
import { Eye, Download } from 'lucide-react';
import DashboardShell from '../../components/layout/DashboardShell';
import { Badge, statusTone, EmptyState, Modal, Spinner } from '../../components/ui/UI';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { invoiceApi } from '../../api/endpoints';
import { openOrDownloadBlob } from '../../utils/download';
import { useToast } from '../../context/ToastContext';

const STATUS_LABEL = { paid: 'Paid', partial: 'Partially Paid', pending: 'Pending' };

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    invoiceApi
      .list({ status: status || undefined, limit: 50 })
      .then((res) => setInvoices(res.data.invoices))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load invoices.'))
      .finally(() => setLoading(false));
  }, [status]);

  const view = async (id) => {
    try {
      const res = await invoiceApi.get(id);
      setSelected(res.data.invoice);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load invoice.');
    }
  };

  const download = async (id, invoiceNumber) => {
    setDownloadingId(id);
    try {
      const res = await invoiceApi.downloadPdf(id);
      openOrDownloadBlob(res.data, `${invoiceNumber}.pdf`);
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
          <h1 className="font-display text-2xl font-bold">Billing</h1>
          <p className="text-slate-500 dark:text-slate-400">Invoices auto-generated for every subscription, renewal and upgrade — full or partial payments, downloadable as professional PDFs.</p>
        </div>
        <select className="input w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="partial">Partially Paid</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <SkeletonTable rows={6} columns={7} />
        ) : invoices.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Invoice #</th>
                  <th className="py-3 px-4 font-medium">Customer</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Paid</th>
                  <th className="py-3 px-4 font-medium">Balance</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium">Issued</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv._id} className="border-b border-slate-50 dark:border-slate-800/50">
                    <td className="py-3 px-4 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4">{inv.customer?.name}</td>
                    <td className="py-3 px-4">{inv.planName}</td>
                    <td className="py-3 px-4">₹{inv.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-accent-600 dark:text-accent-400">₹{inv.amountPaid.toLocaleString()}</td>
                    <td className={`py-3 px-4 ${inv.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>₹{inv.balanceDue.toLocaleString()}</td>
                    <td className="py-3 px-4"><Badge tone={statusTone(inv.status)}>{STATUS_LABEL[inv.status]}</Badge></td>
                    <td className="py-3 px-4 text-slate-500">{new Date(inv.issuedAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-3">
                        <button className="text-slate-500 hover:text-brand-600" title="View" onClick={() => view(inv._id)}>
                          <Eye size={16} />
                        </button>
                        <button
                          className="text-slate-500 hover:text-brand-600 disabled:opacity-50"
                          title="Download PDF"
                          disabled={downloadingId === inv._id}
                          onClick={() => download(inv._id, inv.invoiceNumber)}
                        >
                          {downloadingId === inv._id ? <Spinner className="h-4 w-4" /> : <Download size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InvoiceModal invoice={selected} onClose={() => setSelected(null)} onDownload={download} downloading={!!downloadingId} />
    </DashboardShell>
  );
}

export function InvoiceModal({ invoice, onClose, onDownload, downloading }) {
  if (!invoice) return null;
  return (
    <Modal open={!!invoice} onClose={onClose} title={`Invoice ${invoice.invoiceNumber}`}>
      <div className="space-y-4 text-sm">
        <div className="flex justify-between">
          <div>
            <p className="text-slate-500">Billed To</p>
            <p className="font-semibold">{invoice.customer?.name}</p>
            <p className="text-xs text-slate-400">{invoice.customer?.email}</p>
          </div>
          <div className="text-right">
            <p className="text-slate-500">Issued</p>
            <p className="font-semibold">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex justify-between py-1">
            <span>{invoice.planName} ({invoice.billingCycle.replace('_', ' ')})</span>
            <span className="font-semibold">₹{invoice.amount.toLocaleString()}</span>
          </div>
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Amount Paid</span>
            <span className="font-semibold text-accent-600 dark:text-accent-400">₹{invoice.amountPaid.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-bold text-base">
            <span>Balance Due</span>
            <span className={invoice.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : ''}>₹{invoice.balanceDue.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <Badge tone={statusTone(invoice.status)}>{STATUS_LABEL[invoice.status]}</Badge>
          {onDownload && (
            <button
              className="btn-primary"
              disabled={downloading}
              onClick={() => onDownload(invoice._id, invoice.invoiceNumber)}
            >
              {downloading ? <Spinner /> : <><Download size={15} /> Download PDF</>}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
