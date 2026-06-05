import React, { useEffect, useState, useCallback, useMemo } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  X, 
  Mail, 
  Phone, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { customerService } from "../services/customerService";
import { Customer } from "../types";
import { Loader } from "../components/shared/Loader";
import { EmptyState } from "../components/shared/EmptyState";
import { useToast } from "../components/shared/ToastContext";

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const toast = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Failed to load customers roster.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
    const handleModeChange = () => fetchCustomers();
    window.addEventListener("api-mode-change", handleModeChange);
    return () => window.removeEventListener("api-mode-change", handleModeChange);
  }, [fetchCustomers]);

  const handleOpenAdd = () => {
    setFullName("");
    setEmail("");
    setPhoneNumber("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to remove this client? Historical orders associated with this ID may remain tracked.")) {
      try {
        await customerService.deleteCustomer(id);
        toast.success("Client profile removed successfully");
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (err: any) {
        toast.error(err?.message || "Could not delete client profile.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Full Name is required");
      return;
    }
    if (!email.trim()) {
      setErrorMsg("Email address is required");
      return;
    }
    // Validation matches prompt: valid Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMsg("Please provide a valid email format e.g. user@domain.com");
      return;
    }
    if (!phoneNumber.trim()) {
      setErrorMsg("Phone Number is required");
      return;
    }

    setSubmitting(true);
    try {
      const added = await customerService.addCustomer({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone_number: phoneNumber.trim()
      });
      toast.success(`Registered client "${added.full_name}"`);
      setModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || "An API integration error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const query = searchQuery.toLowerCase();
      return (
        c.full_name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query) ||
        c.phone.includes(query) ||
        String(c.id).includes(query)
      );
    });
  }, [customers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900" id="customers-heading">
            Customers Ledger
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Administer customer profiles, contact info, and track order eligibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchCustomers}
            className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-550 hover:text-gray-700 transition"
            title="Refresh custom records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleOpenAdd}
            id="add-customer-btn"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition transform active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Query panel */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search custom client registers by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:outline-none rounded-lg text-xs transition-all text-gray-800"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center">
          <Loader message="Loading client registry..." />
        </div>
      ) : filteredCustomers.length === 0 ? (
        <EmptyState
          title={searchQuery ? "No matching clients found" : "No registered clients inside system"}
          description={searchQuery ? "Clear search keywords or query using distinct keywords." : "Create client profiles so sales agents can instantly link items and catalog shipments."}
          actionText={searchQuery ? undefined : "Register First Client"}
          onAction={searchQuery ? undefined : handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" id="customers-table">
              <thead className="bg-[#F8FAFC] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Customer Name</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Phone Number</th>
                  <th className="px-6 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">
                      #{customer.id}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {customer.full_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <a 
                        href={`mailto:${customer.email}`}
                        className="inline-flex items-center gap-1.5 hover:text-blue-600 text-gray-600 font-medium transition"
                      >
                        <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                        {customer.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-gray-605">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        {customer.phone}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right pr-6">
                      <button
                        onClick={() => handleDelete(customer.id)}
                        id={`delete-customer-${customer.id}`}
                        className="p-1.5 rounded-md border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                        title="Remove Customer Profile"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50/50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-550">
            <span>Showing {filteredCustomers.length} client files</span>
          </div>
        </div>
      )}

      {/* Add customer Modal overlay */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => !submitting && setModalOpen(false)} />

          <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-155">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#F8FAFC]">
              <h3 className="font-semibold text-gray-900 text-sm" id="modal-title">
                Register Customer Portfolio
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                disabled={submitting}
                className="p-1.5 hover:bg-gray-100 rounded-md text-gray-450 disabled:opacity-30 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {errorMsg && (
                <div className="bg-rose-50 border border-rose-200 rounded-md p-3 text-xs font-semibold text-rose-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Liam Henderson"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={submitting}
                  id="customer-input-name"
                  className="w-full bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. liam@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  id="customer-input-email"
                  className="w-full bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={submitting}
                  id="customer-input-phone"
                  className="w-full bg-gray-50 px-3 py-2 border border-gray-200 rounded-md text-xs focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 px-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  disabled={submitting}
                  className="px-3.5 py-2 text-xs font-semibold border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  id="customer-form-submit-btn"
                  className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition duration-150 disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Register Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
