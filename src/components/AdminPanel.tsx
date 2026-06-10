import React, { useState, useEffect } from "react";
import { Package, Order } from "../types";
import { 
  BarChart3, Plus, Trash2, Edit2, ShieldAlert, ShoppingBag, 
  Calendar, RotateCcw, AlertCircle, Save, Check, X, Eye, Gem, Loader2
} from "lucide-react";
import DiamondGraphic from "./DiamondGraphic";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  onBackToHome: () => void;
}

export default function AdminPanel({ onBackToHome }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'packages'>('orders');
  const [packages, setPackages] = useState<Package[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Package Form state
  const [isEditing, setIsEditing] = useState<Package | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    diamonds: 100,
    bonus: 10,
    price: 80,
    image: "ruby"
  });

  const fetchData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [pkgsRes, ordsRes] = await Promise.all([
        fetch("/api/packages"),
        fetch("/api/orders")
      ]);

      if (pkgsRes.ok && ordsRes.ok) {
        const pkgsData = await pkgsRes.json();
        const ordsData = await ordsRes.json();
        setPackages(pkgsData);
        setOrders(ordsData);
      } else {
        throw new Error("Unable to retrieve backend parameters.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sync admin details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateOrderStatus = async (id: string, newStatus: 'pending' | 'success' | 'failed') => {
    try {
      const response = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        showFeedback("Order status updated successfully!");
        fetchData();
      } else {
        throw new Error("Status commit failed.");
      }
    } catch (err: any) {
      setErrorMsg("Unable to update status.");
    }
  };

  const handleCreateOrUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const isEditMode = !!isEditing;
    const url = isEditMode ? `/api/packages/${isEditing.id}` : "/api/packages";
    const method = isEditMode ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showFeedback(isEditMode ? "Package updated successfully!" : "New package created successfully!");
        setFormData({ name: "", diamonds: 100, bonus: 10, price: 80, image: "ruby" });
        setIsEditing(null);
        setShowAddForm(false);
        fetchData();
      } else {
        const errData = await response.json();
        throw new Error(errData.error || "Package operation failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Something went wrong.");
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this package?")) return;

    try {
      const response = await fetch(`/api/packages/${id}`, { method: "DELETE" });

      if (response.ok) {
        showFeedback("Package removed.");
        fetchData();
      } else {
        throw new Error("Package deletion failed.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Access issue on deleting package.");
    }
  };

  const handleStartEdit = (pkg: Package) => {
    setIsEditing(pkg);
    setFormData({
      name: pkg.name,
      diamonds: pkg.diamonds,
      bonus: pkg.bonus,
      price: pkg.price,
      image: pkg.image
    });
    setShowAddForm(true);
  };

  const showFeedback = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Calculations for summary stats
  const totalVolume = orders.filter(o => o.status === 'success').reduce((acc, o) => acc + o.totalAmount, 0);
  const successfulCount = orders.filter(o => o.status === 'success').length;
  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Admin Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1.5 font-mono text-sm tracking-wider uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping inline-block" /> Security Terminal Console
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="text-purple-500 shrink-0" size={32} /> Cockpit Admin Command Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            id="btn-admin-refresh"
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-800 rounded-xl text-slate-400 font-bold text-xs hover:text-white hover:bg-slate-850/40 transition cursor-pointer"
          >
            <RotateCcw size={14} className={isLoading ? "animate-spin" : ""} /> Pull Refresh
          </button>
          
          <button
            onClick={onBackToHome}
            id="btn-admin-exit"
            className="px-5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs hover:text-white hover:border-slate-700 transition cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>
      </div>

      {/* Analytics Counter Boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-gradient-to-br from-[#121218] to-[#101014] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-emerald-500/20"><ShoppingBag size={48} /></div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono block">Accumulative Turnover</span>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-2 block">₹{totalVolume}</span>
          <span className="text-[11px] text-emerald-400 font-mono mt-1 block">Successfully verified & matched</span>
        </div>
        <div className="bg-gradient-to-br from-[#121218] to-[#101014] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-cyan-500/20"><Check size={48} /></div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono block">Successful TopUp Triggers</span>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-2 block">{successfulCount} Orders</span>
          <span className="text-[11px] text-cyan-400 font-mono mt-1 block">Credits processed to profile IDs</span>
        </div>
        <div className="bg-gradient-to-br from-[#121218] to-[#101014] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute right-4 top-4 text-amber-500/20"><AlertCircle size={48} /></div>
          <span className="text-xs text-slate-500 font-bold uppercase tracking-widest font-mono block">Pending Verification Queries</span>
          <span className="text-2xl sm:text-3xl font-black text-white font-mono mt-2 block">{pendingCount} Queue</span>
          <span className="text-[11px] text-amber-500 font-mono mt-1 block">Awaiting signature check checks</span>
        </div>
      </div>

      {/* Main Tabs controller */}
      <div className="flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => { setActiveTab('orders'); setErrorMsg(null); }}
          id="tab-admin-orders"
          className={`px-6 py-3.5 font-bold font-sans text-sm tracking-wide transition relative border-b-2 cursor-pointer ${
            activeTab === 'orders' 
            ? "border-cyan-500 text-white" 
            : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Customer Transactions ({orders.length})
        </button>
        <button
          onClick={() => { setActiveTab('packages'); setErrorMsg(null); }}
          id="tab-admin-packages"
          className={`px-6 py-3.5 font-bold font-sans text-sm tracking-wide transition relative border-b-2 cursor-pointer ${
            activeTab === 'packages' 
            ? "border-purple-500 text-white" 
            : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Manage Diamond Packages ({packages.length})
        </button>
      </div>

      {/* User Alerts notification */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs mb-6 font-semibold">
          <AlertCircle size={16} /> <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-xs mb-6 font-semibold animate-pulse">
          <Check size={16} /> <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Panels */}
      <div>
        {activeTab === 'orders' ? (
          /* ORDERS LIST PANEL */
          <div className="bg-[#111116] border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800/80 bg-slate-900/40 flex justify-between items-center">
              <h3 className="text-base font-bold text-white uppercase tracking-wider font-sans">Payment Invoices & Requests Log</h3>
              <span className="text-xs font-mono text-slate-500">Live Webhook Feed Buffer</span>
            </div>

            {isLoading ? (
              <div className="p-16 text-center text-slate-400 space-y-2">
                <Loader2 className="animate-spin text-cyan-400 inline-block" size={32} />
                <p className="font-mono text-xs font-semibold">Synchronizing server records...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-16 text-center text-slate-500 space-y-1">
                <p className="font-sans font-bold text-base text-slate-400">No Orders Loaded Yet</p>
                <p className="text-xs max-w-sm mx-auto leading-relaxed mt-1">
                  Once users fulfill checkout payments via GPay, PhonePe, UPI etc, invoice transactions will be logged here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase font-mono tracking-wider bg-slate-900/20">
                      <th className="py-4 px-5">Invoice Reference</th>
                      <th className="py-4 px-5">Gamer Profile ID</th>
                      <th className="py-4 px-5">Ordered Item Package</th>
                      <th className="py-4 px-5">Turnover Amount</th>
                      <th className="py-4 px-5">Routing Provider</th>
                      <th className="py-4 px-5">Live State Status</th>
                      <th className="py-4 px-5 text-right">Commit Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-805/40 font-mono">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-900/30 transition-all">
                        <td className="py-4 px-5 max-w-[150px] truncate">
                          <span className="text-white font-bold block">#{ord.id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{new Date(ord.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-slate-300 block font-semibold font-sans">{ord.nickname}</span>
                          <span className="text-[10px] text-cyan-500 block mt-0.5 font-bold">UID: {ord.uid}</span>
                        </td>
                        <td className="py-4 px-5 font-sans">
                          <span className="text-white font-bold block">{ord.packageName} ({ord.quantity}x)</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-semibold block mt-0.5">+{ord.bonus * ord.quantity} Diamonds Credits</span>
                        </td>
                        <td className="py-4 px-5 font-bold text-white text-sm">
                          ₹{ord.totalAmount}
                        </td>
                        <td className="py-4 px-5">
                          <span className="text-purple-400 font-bold block">{ord.paymentMethod}</span>
                          <span className="text-[10px] text-slate-500 block mt-0.5 max-w-[120px] truncate">PayID: {ord.razorpayPaymentId || "None"}</span>
                        </td>
                        <td className="py-4 px-5 font-sans">
                          {ord.status === 'success' ? (
                            <span className="bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase leading-none">Passed</span>
                          ) : ord.status === 'failed' ? (
                            <span className="bg-red-500/15 border border-red-500/25 text-red-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase leading-none">Declined</span>
                          ) : (
                            <span className="bg-amber-500/15 border border-amber-500/25 text-amber-400 text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase leading-none animate-pulse">Awaiting</span>
                          )}
                        </td>
                        <td className="py-4 px-5 text-right font-sans">
                          {ord.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'failed')}
                                id={`btn-order-fail-${ord.id}`}
                                className="p-1 px-2.5 rounded bg-red-950/20 text-red-400 border border-red-500/20 text-[10px] font-bold uppercase transition hover:bg-red-500 hover:text-white cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(ord.id, 'success')}
                                id={`btn-order-success-${ord.id}`}
                                className="p-1 px-2.5 rounded bg-emerald-950/20 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase transition hover:bg-emerald-500 hover:text-white cursor-pointer"
                              >
                                Confirm
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500 select-none">Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* DIAMOND PACKAGES PANEL */
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#111116] border border-slate-800 p-5 rounded-2xl">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-wider font-sans">Diamond TopUp Store Offerings</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Configure packages, adjust pricing, edit and seed bundle promotions dynamically.</p>
              </div>

              <button
                onClick={() => {
                  setIsEditing(null);
                  setFormData({ name: "", diamonds: 100, bonus: 10, price: 80, image: "ruby" });
                  setShowAddForm(true);
                }}
                id="btn-admin-add-pkg"
                className="gradient-btn px-4.5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-white flex items-center gap-1.5 cursor-pointer text-xs uppercase hover:shadow-[0_0_15px_rgba(147,51,234,0.3)]"
              >
                <Plus size={14} /> Add Diamond Package
              </button>
            </div>

            {/* Packages interactive GRID Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className="bg-[#111116] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between transition-all hover:border-slate-700 hover:shadow-lg"
                >
                  <div className="flex gap-4 items-start pb-4">
                    <div className="bg-slate-900 shadow-inner p-2.5 rounded-xl flex items-center justify-center border border-slate-800">
                      <DiamondGraphic type={pkg.image} size="sm" />
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-wider">ID: {pkg.id}</div>
                      <h4 className="text-base font-black text-white leading-tight mt-0.5">{pkg.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-bold font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20">{pkg.diamonds} 💎 Base</span>
                        <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">+{pkg.bonus} 💎 Bonus</span>
                      </div>
                    </div>
                  </div>

                  <hr className="border-slate-800/80 mb-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Retailed Pricing</span>
                      <span className="text-base font-extrabold text-white font-mono">₹{pkg.price}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleStartEdit(pkg)}
                        id={`btn-edit-pkg-${pkg.id}`}
                        className="p-2 bg-slate-900 border border-slate-850 hover:border-slate-705 text-slate-400 hover:text-white rounded-lg transition active:scale-95 cursor-pointer"
                        title="Edit package parameters"
                      >
                        <Edit2 size={13} />
                      </button>
                      
                      <button
                        onClick={() => handleDeletePackage(pkg.id)}
                        id={`btn-delete-pkg-${pkg.id}`}
                        className="p-2 bg-red-950/10 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:bg-red-950/30 rounded-lg transition active:scale-95 cursor-pointer"
                        title="Delete package"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Package Create / Edit Modal overlay drawer inside tab */}
            <AnimatePresence>
              {showAddForm && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-[#111116] border border-slate-700/80 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
                  >
                    <div className="p-5 border-b border-slate-800 flex justify-between items-center text-white bg-slate-900/50">
                      <h3 className="text-base font-extrabold flex items-center gap-1.5 tracking-wide uppercase">
                        <Gem size={16} className="text-purple-500" />
                        {isEditing ? "Modify Game Package" : "Create Hot Diamond Bundle Offer"}
                      </h3>
                      <button 
                        onClick={() => setShowAddForm(false)} 
                        id="btn-form-modal-close"
                        className="p-1 hover:text-white text-slate-400 rounded transition cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <form onSubmit={handleCreateOrUpdatePackage} className="p-6 space-y-4 text-xs font-sans">
                      <div className="space-y-1.5">
                        <label className="block text-slate-400 font-bold uppercase tracking-wider">Package Marketing Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Neon Surge, Vortex Vault"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          id="input-form-name"
                          className="w-full bg-[#181822] border border-slate-800 rounded-xl px-4 py-2.5 text-white tracking-wide text-[13px] focus:border-purple-500 focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-slate-400 font-bold uppercase tracking-wider">Base Diamonds</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formData.diamonds}
                            onChange={(e) => setFormData({ ...formData, diamonds: Number(e.target.value) })}
                            id="input-form-diamonds"
                            className="w-full bg-[#181822] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-[13px] font-mono focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-slate-400 font-bold uppercase tracking-wider">Bonus Diamonds</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={formData.bonus}
                            onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
                            id="input-form-bonus"
                            className="w-full bg-[#181822] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-[13px] font-mono focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="block text-slate-400 font-bold uppercase tracking-wider">Price (INR ₹)</label>
                          <input
                            type="number"
                            required
                            min="1"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                            id="input-form-price"
                            className="w-full bg-[#181822] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-[13px] font-mono focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="block text-slate-400 font-bold uppercase tracking-wider">Graphic Icon Theme</label>
                          <select
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            id="input-form-image"
                            className="w-full bg-[#181822] border border-slate-800 rounded-xl px-4 py-2.5 text-white text-[13px] focus:border-purple-500 focus:outline-none cursor-pointer"
                          >
                            <option value="ruby">Ruby Red (100 - 300 💎)</option>
                            <option value="sapphire">Sapphire Cyan (300 - 500 💎)</option>
                            <option value="emerald">Emerald Green (500 - 1000 💎)</option>
                            <option value="diamond">Elite Purple Diamond (1000 - 2000 💎)</option>
                            <option value="crown">Gold Royal Crown (2000 - 5000 💎)</option>
                            <option value="cosmos">Infinite Cosmos (5000+ 💎)</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3 border-t border-slate-800 mt-6">
                        <button
                          type="button"
                          onClick={() => setShowAddForm(false)}
                          id="btn-form-cancel"
                          className="py-2.5 px-5 rounded-xl border border-slate-805 text-slate-400 hover:text-white font-bold transition hover:bg-slate-800/30 cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          type="submit"
                          id="btn-form-save"
                          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-500 text-white font-black hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Save size={13} />
                          {isEditing ? "Save Changes" : "Create Package"}
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
