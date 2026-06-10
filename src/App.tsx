/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Package, Order } from "./types";
import PackageCard from "./components/PackageCard";
import CheckoutForm from "./components/CheckoutForm";
import AdminPanel from "./components/AdminPanel";
import PaymentSuccess from "./components/PaymentSuccess";
import { 
  Gamepad2, Sparkles, ShieldCheck, Heart, Radio, Rocket, Clock,
  Lock, Settings, RefreshCw, Smartphone, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [view, setView] = useState<'home' | 'checkout' | 'success' | 'admin'>('home');
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPackages = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch("/api/packages");
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      } else {
        throw new Error("Backend server failed to respond.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error synchronizing diamond list catalog. Try refreshing.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleBuyNow = (pkg: Package) => {
    setSelectedPackage(pkg);
    setView('checkout');
  };

  const handleReturnToStore = () => {
    setSelectedPackage(null);
    setSuccessOrder(null);
    setView('home');
    fetchPackages(); // refresh state list
  };

  const handlePaymentSuccess = (order: Order) => {
    setSuccessOrder(order);
    setView('success');
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-slate-100 flex flex-col font-sans transition-all duration-550 selection:bg-purple-600 selection:text-white relative">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-[#00f2ff]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[450px] h-[450px] bg-orange-500/5 rounded-full blur-[110px] pointer-events-none" />

      {/* Styled Header Bar */}
      <header className="border-b border-slate-900 bg-[#07070a]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4.5 flex items-center justify-between">
          {/* Logo Brand */}
          <div 
            onClick={handleReturnToStore}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 opacity-75 blur-sm group-hover:opacity-100 transition duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-[#111116] border border-slate-705 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                <Gamepad2 size={22} className="text-glow-blue" />
              </div>
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white uppercase block leading-none">
                Neon <span className="text-cyan-400">TopUp</span>
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">Free Fire Store</span>
            </div>
          </div>

          {/* Nav Controls */}
          <nav className="flex items-center gap-4">
            <button
              onClick={handleReturnToStore}
              className={`text-xs font-bold font-sans uppercase tracking-wider transition ${view === 'home' || view === 'checkout' ? "text-cyan-400" : "text-slate-400 hover:text-white"}`}
            >
              Bundles Store
            </button>
            <span className="text-slate-800 font-mono">|</span>
            
            {/* Admin toggle Button */}
            <button
              onClick={() => { setView(view === 'admin' ? 'home' : 'admin'); }}
              id="btn-nav-admin"
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer border transition duration-300 ${
                view === 'admin' 
                ? "bg-[#181822] border-cyan-500 text-cyan-400 glow-blue" 
                : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:text-white text-slate-400"
              }`}
            >
              <Settings size={14} className={view === 'admin' ? 'animate-spin' : ''} />
              Admin Portal
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container Stage */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          {view === 'admin' ? (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel onBackToHome={() => setView('home')} />
            </motion.div>
          ) : view === 'checkout' ? (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {selectedPackage && (
                <CheckoutForm 
                  selectedPackage={selectedPackage}
                  onBack={handleReturnToStore}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              )}
            </motion.div>
          ) : view === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              {successOrder && (
                <PaymentSuccess 
                  order={successOrder}
                  onReturnToHome={handleReturnToStore}
                />
              )}
            </motion.div>
          ) : (
            /* HOME STORE CATALOGUE VIEW */
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-16 pb-20"
            >
              {/* Epic Gaming Hero Banner Section */}
              <section className="relative overflow-hidden bg-gradient-to-b from-[#111116]/80 to-[#07070a] border-b border-slate-900 py-16 sm:py-24 text-center">
                {/* Horizontal Neon lines decoration */}
                <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                <div className="absolute top-10 right-10 animate-bounce text-purple-500/40 opacity-75"><Radio size={48} /></div>
                
                <div className="max-w-4xl mx-auto px-4 relative z-10 space-y-6">
                  {/* Free Fire inspired badge */}
                  <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-[10px] font-black font-mono tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-purple-500/10">
                    <Sparkles size={11} fill="currentColor" fillOpacity={0.8} /> FREE FIRE TOP-UP HUB
                  </div>

                  <h1 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tight leading-none">
                    Unleash Your <br />
                    <span className="bg-gradient-to-r from-[#00f2ff] via-purple-500 to-orange-500 bg-clip-text text-transparent filter drop-shadow-[0_2px_15px_rgba(0,242,255,0.2)]">
                      Neon Diamonds
                    </span>
                  </h1>

                  <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto font-medium leading-relaxed">
                    Instantly load Free Fire diamonds with high bonus ratios. Connect your game Character UID, select your bundle, check verified gamer nickname, and verify instant transfers.
                  </p>

                  <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="text-cyan-400" size={16} /> Secured by Razorpay SSL</span>
                    <span className="flex items-center gap-1.5"><Rocket className="text-purple-400" size={16} /> Instant Transfer credit</span>
                    <span className="flex items-center gap-1.5"><Clock className="text-orange-400" size={16} /> 24/7 Live fulfillment queue</span>
                  </div>

                  {/* Redirection prompt */}
                  <div className="pt-4">
                    <a
                      href="#packages-store"
                      className="inline-flex items-center gap-2 font-black tracking-wider text-xs uppercase bg-[#181825] hover:bg-[#1f1f2e] border border-slate-800 hover:border-slate-700 px-6 py-3 rounded-full text-white transition"
                    >
                      Browse Store Items
                    </a>
                  </div>
                </div>
              </section>

              {/* Products packages LIST section */}
              <section id="packages-store" className="max-w-7xl mx-auto px-4 scroll-mt-20">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Gamepad2 className="text-cyan-400" size={24} /> Promotional Bundles
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                      Choose from our best value packages. Prices are inclusive of tax.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={fetchPackages}
                      className="p-2 border border-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition active:scale-95 cursor-pointer"
                      title="Reload package store"
                    >
                      <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className="py-24 text-center text-slate-400 space-y-3">
                    <RefreshCw className="animate-spin text-purple-500 inline-block" size={36} />
                    <p className="text-xs font-mono">Synchronizing available items buffer...</p>
                  </div>
                ) : errorMsg ? (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl max-w-md mx-auto text-center space-y-4">
                    <AlertTriangle size={32} className="mx-auto" />
                    <p className="text-sm font-semibold">{errorMsg}</p>
                    <button 
                      onClick={fetchPackages}
                      className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs border border-slate-800 hover:border-slate-700 transition"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {packages.map((pkg) => (
                      <PackageCard 
                        key={pkg.id} 
                        pkg={pkg} 
                        onBuy={handleBuyNow} 
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Secure Trust features panel */}
              <section className="max-w-7xl mx-auto px-4 border-t border-slate-900 pt-16">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Razorpay Encrypted SSL</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        All transaction data is digitally certified and locked down using SHA-256 standard cryptographic verification. We never store personal bank cards.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">UPI Direct Wallet Transfers</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        Fulfilled completely via custom callback automation across GPay, PhonePe, Paytm, and traditional UPI interfaces instantly.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                      <Rocket size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Instantaneous UID Provisioning</h4>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1">
                        Verified profiles undergo robotic matching automatically upon receipt validation, reducing manual wait times to less than 3 minutes.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Styled Footer */}
      <footer className="bg-[#050508] border-t border-slate-900 py-8 text-center text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <p className="font-mono tracking-wide leading-relaxed">
            © 2026 Neon TopUp Game Store. Inspired by premium gaming stores. All game assets, product trademarks, and copyrights belong to their respective publishers.
          </p>
          <div className="flex justify-center items-center gap-1 text-[10px] text-slate-600 font-medium">
            Formulated with <Heart size={10} className="text-red-600 fill-red-600" /> for gamers globally.
          </div>
        </div>
      </footer>
    </div>
  );
}
