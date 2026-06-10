import React, { useState, useEffect } from "react";
import { Package, Order } from "../types";
import DiamondGraphic from "./DiamondGraphic";
import { 
  User, CheckCircle2, AlertCircle, ShoppingBag, CreditCard, 
  ChevronLeft, Loader2, ShieldCheck, Plus, Minus, ArrowRight,
  QrCode, Landmark, Wallet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CheckoutFormProps {
  selectedPackage: Package;
  onBack: () => void;
  onPaymentSuccess: (order: Order) => void;
}

export default function CheckoutForm({ selectedPackage, onBack, onPaymentSuccess }: CheckoutFormProps) {
  const [uid, setUid] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedNickname, setVerifiedNickname] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showNicknamePopup, setShowNicknamePopup] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'GPay' | 'PhonePe' | 'Paytm'>('UPI');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [razorpayConfig, setRazorpayConfig] = useState<{ isRazorpayActive: boolean; razorpayKeyId: string } | null>(null);

  // Simulated Payment Modal state
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [activeSimulatedOrder, setActiveSimulatedOrder] = useState<any>(null);

  // Fetch Razorpay config on mount
  useEffect(() => {
    fetch("/api/config")
      .then(res => res.json())
      .then(data => setRazorpayConfig(data))
      .catch(err => console.error("Could not fetch remote config", err));
  }, []);

  const handleVerifyPlayer = async () => {
    if (!uid || uid.trim().length < 5) {
      setErrorMsg("UID must be at least 5 alphanumeric characters.");
      setVerifiedNickname(null);
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`/api/verify-player/${encodeURIComponent(uid.trim())}`);
      const data = await response.json();

      if (response.ok && data.exists) {
        setVerifiedNickname(data.nickname);
        setShowNicknamePopup(true);
      } else {
        setErrorMsg(data.error || "Player search failed. Check UID and try again.");
        setVerifiedNickname(null);
      }
    } catch (err) {
      setErrorMsg("Error contacting verification server. Try again.");
      setVerifiedNickname(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handlePaymentProceed = async () => {
    if (!verifiedNickname) {
      setErrorMsg("Please verify player UID prior to payment routing.");
      return;
    }

    setIsProcessingPayment(true);
    setErrorMsg(null);

    try {
      const payload = {
        uid: uid.trim(),
        nickname: verifiedNickname,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        diamonds: selectedPackage.diamonds,
        bonus: selectedPackage.bonus,
        price: selectedPackage.price,
        quantity,
        paymentMethod
      };

      const response = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const orderData = await response.json();

      if (!response.ok) {
        throw new Error(orderData.error || "Payment order creation failed");
      }

      if (orderData.isSimulated) {
        // Trigger simulation flow
        setActiveSimulatedOrder(orderData);
        setShowSimulatorModal(true);
      } else {
        // Live Razorpay SDK handler
        const loadRzpScript = () => {
          return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
          });
        };

        const loaded = await loadRzpScript();
        if (!loaded) {
          throw new Error("Unable to load payment processing libraries. Retry.");
        }

        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Neon TopUp Store",
          description: `Top-up ${selectedPackage.diamonds + selectedPackage.bonus} Diamonds`,
          image: "https://styles.redditmedia.com/t5_fljgr/styles/communityIcon_p3vttw68m9p61.png",
          order_id: orderData.razorpayOrderId,
          handler: async function (response: any) {
            // Verify payment
            try {
              const verifyPayload = {
                orderId: orderData.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                isSimulated: false
              };

              const verificationRes = await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(verifyPayload)
              });

              const verifyData = await verificationRes.json();
              if (verificationRes.ok && verifyData.success) {
                // Route to success screen
                const finalOrder: Order = {
                  id: orderData.orderId,
                  uid: uid.trim(),
                  nickname: verifiedNickname,
                  packageId: selectedPackage.id,
                  packageName: selectedPackage.name,
                  diamonds: selectedPackage.diamonds,
                  bonus: selectedPackage.bonus,
                  price: selectedPackage.price,
                  quantity,
                  totalAmount: selectedPackage.price * quantity,
                  paymentMethod,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  status: "success",
                  createdAt: new Date().toISOString()
                };
                onPaymentSuccess(finalOrder);
              } else {
                setErrorMsg(verifyData.error || "Payment verification failed.");
              }
            } catch (err) {
              setErrorMsg("Error finishing transactions.");
            }
          },
          prefill: {
            name: verifiedNickname,
            contact: "9999999999"
          },
          theme: {
            color: "#7000ff"
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (resp: any) {
          setErrorMsg(`Transaction declined: ${resp.error.description}`);
        });
        rzp.open();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An issue occured while processing checkout.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const executeSimulatedPayment = async (status: 'success' | 'failed') => {
    if (!activeSimulatedOrder) return;
    
    setIsProcessingPayment(true);
    setShowSimulatorModal(false);

    try {
      const payload = {
        orderId: activeSimulatedOrder.orderId,
        razorpayOrderId: activeSimulatedOrder.razorpayOrderId,
        razorpayPaymentId: status === 'success' ? `pay_sim_${Math.random().toString(36).substring(2, 11)}` : undefined,
        isSimulated: true
      };

      if (status === 'success') {
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const verifyData = await response.json();
        if (response.ok && verifyData.success) {
          const finalOrder: Order = {
            id: activeSimulatedOrder.orderId,
            uid: uid.trim(),
            nickname: verifiedNickname || "Simulating Account",
            packageId: selectedPackage.id,
            packageName: selectedPackage.name,
            diamonds: selectedPackage.diamonds,
            bonus: selectedPackage.bonus,
            price: selectedPackage.price,
            quantity,
            totalAmount: selectedPackage.price * quantity,
            paymentMethod,
            razorpayOrderId: activeSimulatedOrder.razorpayOrderId,
            razorpayPaymentId: payload.razorpayPaymentId,
            status: "success",
            createdAt: new Date().toISOString()
          };
          onPaymentSuccess(finalOrder);
        } else {
          setErrorMsg(verifyData.error || "Simulated authorization failure.");
        }
      } else {
        setErrorMsg("Simulated invoice generation rejected by user selection.");
      }
    } catch (err: any) {
      setErrorMsg("Simulation engine crashed. Check back logs.");
    } finally {
      setIsProcessingPayment(false);
      setActiveSimulatedOrder(null);
    }
  };

  const totalAmount = selectedPackage.price * quantity;
  const grandDiamonds = (selectedPackage.diamonds + selectedPackage.bonus) * quantity;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative">
      {/* Back button */}
      <button
        onClick={onBack}
        id="btn-checkout-back"
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-semibold transition"
      >
        <ChevronLeft size={16} /> Backward to store
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Player verification & Payment details */}
        <div className="md:col-span-7 space-y-6">
          {/* UID Verification Box */}
          <div className="bg-[#111116] border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4 tracking-wide">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm">1</span>
              Configure Free Fire UID
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Player Account Game UID</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="e.g. 5429184531"
                      value={uid}
                      onChange={(e) => setUid(e.target.value.replace(/[^0-9A-Za-z]/g, ""))}
                      id="input-uid"
                      className="w-full bg-[#181822] border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none font-mono tracking-wider text-base"
                    />
                    {verifiedNickname && (
                      <span className="absolute right-3 top-3.5 text-emerald-500 flex items-center gap-1 text-xs font-bold font-mono">
                        <CheckCircle2 size={14} fill="currentColor" className="text-emerald-500 fill-black" />
                        VERIFIED
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleVerifyPlayer}
                    disabled={isVerifying || !uid}
                    id="btn-verify-uid"
                    className="gradient-btn px-6 py-3 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white flex items-center justify-center gap-2 min-w-[120px] transition disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifying ? <Loader2 size={16} className="animate-spin" /> : "Verify UID"}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-1.5 leading-relaxed">
                  Tip: End UID with '99' to test UID Account verification error state.
                </p>
              </div>

              {/* Verified Nickname Banner */}
              {verifiedNickname && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <span className="text-[11px] text-emerald-500 font-bold tracking-widest uppercase">Validated Owner</span>
                      <h4 className="text-base font-black text-white font-mono mt-0.5">{verifiedNickname}</h4>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">ID: {uid}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods Box */}
          <div className="bg-[#111116] border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4 tracking-wide">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-black text-sm">2</span>
              Choose Payment Method
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "UPI", label: "Unified UPI", desc: "Pay with any UPI app", icon: <QrCode size={18} /> },
                { id: "GPay", label: "Google Pay", desc: "Fast GPay flow", icon: <Landmark size={18} /> },
                { id: "PhonePe", label: "PhonePe", desc: "Secure PhonePe direct", icon: <Wallet size={18} /> },
                { id: "Paytm", label: "Paytm Wallet", desc: "Instant Paytm balance", icon: <CreditCard size={18} /> }
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as any)}
                  id={`pay-${method.id}`}
                  className={`flex flex-col items-start text-left p-4 rounded-xl border transition cursor-pointer ${
                    paymentMethod === method.id 
                    ? "bg-[#181825] border-purple-500 shadow-[0_0_15px_rgba(112,0,255,0.25)] text-white" 
                    : "bg-[#0d0d12] border-slate-800/80 hover:border-slate-700 text-slate-400"
                  }`}
                >
                  <div className="flex items-center gap-2 justify-between w-full">
                    <span className="p-1.5 rounded-lg bg-slate-800/50 text-purple-400 font-bold">{method.icon}</span>
                    {paymentMethod === method.id && <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />}
                  </div>
                  <h4 className="text-[13px] font-bold mt-3">{method.label}</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">{method.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Order summary section */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#111116] border border-slate-800 rounded-2xl p-6 sticky top-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <ShoppingBag size={20} className="text-purple-400" />
              Order Sheet Summary
            </h2>

            {/* Selected Package Details */}
            <div className="flex gap-4 p-4 rounded-xl bg-[#181822] border border-slate-800 mb-6">
              <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg flex items-center justify-center">
                <DiamondGraphic type={selectedPackage.image} size="sm" />
              </div>
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-sm font-bold text-white tracking-wide">{selectedPackage.name} Bundle</h3>
                <p className="text-emerald-400 text-xs font-bold mt-1 font-mono">+{selectedPackage.bonus} Bonus Included</p>
                <div className="text-[11px] text-slate-500 font-semibold font-mono mt-1">₹{selectedPackage.price}/ea</div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Quantity</span>
              <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-1.5 rounded-xl">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  id="btn-qty-minus"
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-white font-bold font-mono text-base">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  id="btn-qty-plus"
                  className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Price breakdown and calculations */}
            <div className="space-y-3 font-mono text-xs border-t border-slate-800 pt-4 pb-2 mb-6">
              <div className="flex justify-between text-slate-400">
                <span>Bundle Diamonds</span>
                <span className="text-white font-bold">{selectedPackage.diamonds * quantity} 💎</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Earned Bonus Diamonds</span>
                <span className="text-emerald-400 font-bold">+{selectedPackage.bonus * quantity} Premium 💎</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Subtotal Price</span>
                <span className="text-white">₹{selectedPackage.price * quantity}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Platform Taxes & Fees</span>
                <span className="text-emerald-500 font-bold font-semibold uppercase">Free (0%)</span>
              </div>
              <hr className="border-slate-800/80 my-3" />
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold uppercase font-sans tracking-wide">Total Diamonds Credit</span>
                <span className="text-cyan-400 font-black font-sans tracking-wide text-base">{grandDiamonds} 💎</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-200 font-sans font-bold uppercase tracking-wide">Total Payable</span>
                <span className="text-white font-sans font-black text-xl">₹{totalAmount}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-xs font-medium mb-4 leading-relaxed">
                <AlertCircle size={16} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Proceed Button */}
            <button
              onClick={handlePaymentProceed}
              disabled={isProcessingPayment || !verifiedNickname}
              id="btn-proceed-payment"
              className={`w-full font-sans font-bold uppercase tracking-wider text-sm py-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition ${
                verifiedNickname 
                ? "bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white font-semibold hover:shadow-[0_0_25px_rgba(112,0,255,0.4)] active:scale-[0.98]" 
                : "bg-slate-800 text-slate-500 cursor-not-allowed"
              }`}
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Routing transaction...
                </>
              ) : (
                <>
                  <CreditCard size={16} />
                  Proceed to Payment
                  <ArrowRight size={14} />
                </>
              )}
            </button>

            {/* Safe gateway seal */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-medium tracking-wide mt-4">
              <ShieldCheck size={14} className="text-emerald-500" /> Secure Payments certified by Razorpay SSL
            </div>
          </div>
        </div>
      </div>

      {/* Verification Nickname confirmation overlay popup (as requested) */}
      <AnimatePresence>
        {showNicknamePopup && verifiedNickname && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#111116] border border-slate-700/80 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
                  <User size={32} />
                </div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-wider">Confirm Player Identity</h3>
                
                <p className="text-xs text-slate-400 px-4 leading-relaxed">
                  We found the following Free Fire account. Please carefully confirm this matches your actual profile nickname.
                </p>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 py-5 space-y-2">
                  <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Verified Player Game Nickname</div>
                  <div className="text-xl font-black text-white font-mono tracking-wide">{verifiedNickname}</div>
                  <div className="text-xs font-mono text-cyan-500 bg-cyan-500/10 px-2.5 py-1 rounded-full inline-block mt-2">UID: {uid}</div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      setVerifiedNickname(null);
                      setUid("");
                      setShowNicknamePopup(false);
                    }}
                    id="btn-popup-cancel"
                    className="py-3 px-4 rounded-xl border border-slate-800 text-slate-400 hover:text-white font-bold text-xs uppercase hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    Incorrect UID
                  </button>
                  <button
                    onClick={() => setShowNicknamePopup(false)}
                    id="btn-popup-confirm"
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs uppercase hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition cursor-pointer"
                  >
                    Yes, Confirm Account
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* High-Fidelity Razorpay Simulator Modal */}
      <AnimatePresence>
        {showSimulatorModal && activeSimulatedOrder && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#0f111a] border border-purple-500/50 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-400" />
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-black text-xs">R</div>
                    <div>
                      <h3 className="text-sm font-black text-white tracking-widest uppercase mb-0.5">Razorpay Payments</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">INTEGRATION SANDBOX SIMULATION</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 uppercase">Testing Mode</span>
                </div>

                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/40 pb-2">
                    <span>Vendor Merchant</span>
                    <span className="text-white font-semibold">Neon Diamonds TopUp Ltd</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/40 pb-2">
                    <span>Player Gamer Name</span>
                    <span className="text-cyan-400 font-semibold">{verifiedNickname}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/40 pb-2">
                    <span>Package Name</span>
                    <span className="text-white font-semibold">{selectedPackage.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/40 pb-2">
                    <span>Units Ordered</span>
                    <span className="text-white font-semibold">{quantity}x</span>
                  </div>
                  <div className="flex justify-between text-slate-400 border-b border-slate-800/40 pb-2">
                    <span>Payment Routing Gateway</span>
                    <span className="text-purple-400 font-bold uppercase">{paymentMethod} Direct</span>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4 text-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-widest">Total Billable Payable Amount</span>
                    <span className="text-2xl font-black text-white mt-1 block">₹{totalAmount}.00</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-[11px] text-amber-400 leading-relaxed gap-2 flex items-start">
                  <AlertCircle size={16} className="shrink-0 text-amber-400 mt-0.5" />
                  <span>
                    No active credentials were defined in <strong>.env</strong>. We have loaded our sandbox simulator so you can fully test successful top-up routing.
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => executeSimulatedPayment('failed')}
                    className="py-3 px-4 rounded-xl border border-slate-800 hover:border-red-500/40 text-slate-400 hover:text-red-400 font-bold text-xs uppercase hover:bg-red-950/20 transition cursor-pointer"
                  >
                    Simulate Block / Fail No
                  </button>
                  <button
                    onClick={() => executeSimulatedPayment('success')}
                    className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-500 text-white font-black text-xs uppercase hover:shadow-[0_0_20px_rgba(112,0,255,0.4)] transition cursor-pointer"
                  >
                    Simulate Success Pay Yes
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
