import { useEffect, useState } from 'react';
import DashboardShell from '../../components/layout/DashboardShell';
import { PageLoader, EmptyState, Badge, statusTone, Spinner } from '../../components/ui/UI';
import { InvoiceModal } from '../owner/Invoices';
import { portalApi } from '../../api/endpoints';
import { openOrDownloadBlob } from '../../utils/download';
import { useToast } from '../../context/ToastContext';
import { Eye, Download } from 'lucide-react';

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const toast = useToast();

  useEffect(() => {
    portalApi
      .invoices()
      .then((res) => setInvoices(res.data.invoices))
      .catch((err) => toast.error(err.response?.data?.message || 'Failed to load invoices.'))
      .finally(() => setLoading(false));
  }, []);

  const view = (id) => {
    setSelected(invoices.find((i) => i._id === id));
  };

  const download = async (id, invoiceNumber) => {
    setDownloadingId(id);
    try {
      const res = await portalApi.downloadInvoicePdf(id);
      openOrDownloadBlob(res.data, `${invoiceNumber}.pdf`);
    } catch (err) {
      toast.error('Failed to generate the invoice PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardShell>
      <h1 className="font-display text-2xl font-bold mb-1">Invoices</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6">Every invoice issued to you — downloadable as a professional PDF.</p>

      <div className="card overflow-hidden">
        {loading ? (
          <PageLoader />
        ) : invoices.length === 0 ? (
          <EmptyState title="No invoices yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4 font-medium">Invoice #</th>
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
                    <td className="py-3 px-4">{inv.planName}</td>
                    <td className="py-3 px-4">₹{inv.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-accent-600 dark:text-accent-400">₹{inv.amountPaid.toLocaleString()}</td>
                    <td className={`py-3 px-4 ${inv.balanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>₹{inv.balanceDue.toLocaleString()}</td>
                    <td className="py-3 px-4"><Badge tone={statusTone(inv.status)}>{inv.status === 'partial' ? 'Partially Paid' : inv.status}</Badge></td>
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
