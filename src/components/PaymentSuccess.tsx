import React from "react";
import { Order } from "../types";
import DiamondGraphic from "./DiamondGraphic";
import { CheckCircle2, ShieldCheck, Home, ArrowRight, Printer, Sparkles } from "lucide-react";
import { motion } from "motion/react";

interface PaymentSuccessProps {
  order: Order;
  onReturnToHome: () => void;
}

export default function PaymentSuccess({ order, onReturnToHome }: PaymentSuccessProps) {
  const handlePrintReceipt = () => {
    window.print();
  };

  const totalDiamonds = (order.diamonds + order.bonus) * order.quantity;

  return (
    <div className="max-w-xl mx-auto px-4 py-8 text-center sm:py-16">
      {/* Animated Success Check circle */}
      <div className="relative inline-block mb-6">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 150, damping: 15 }}
          className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500 rounded-full flex items-center justify-center text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.5)] mx-auto"
        >
          <CheckCircle2 size={44} className="fill-black" />
        </motion.div>
        
        {/* Decorative sparkles */}
        <div className="absolute -top-1 -right-1 text-yellow-400 animate-bounce">
          <Sparkles size={16} fill="currentColor" />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-3"
      >
        <span className="text-xs font-black font-mono tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-4 py-1.5 rounded-full inline-block">
          TRANSACTION COMPLETELY PASSED & SUCCESSFUL
        </span>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Diamonds Transferred!</h1>
        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed mt-2">
          Your credit order request was processed through secure servers. Diamonds have been instantly transferred into your Free Fire character profile!
        </p>
      </motion.div>

      {/* Modern Neon Receipt */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-[#111116] border border-slate-800 rounded-2xl p-6 mt-8 shadow-2xl relative text-left"
      >
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-t-2xl" />

        <div className="flex justify-between items-start border-b border-slate-800/80 pb-4 mb-4 font-mono text-xs text-slate-500">
          <div>
            <span>STORE RECEIPT ID</span>
            <span className="text-white font-extrabold block uppercase mt-0.5">#{order.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="text-right">
            <span>TRANSACTION STAMP</span>
            <span className="text-white font-bold block mt-0.5">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div className="bg-slate-900 border border-slate-850 rounded-xl p-4 flex gap-4 items-center">
            <DiamondGraphic type="sapphire" size="sm" />
            <div className="flex-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase block tracking-wider">Deposited Bundle Payload</span>
              <span className="text-base font-black text-white tracking-wide block leading-tight mt-0.5">{order.packageName}</span>
              <span className="text-xs text-cyan-400 font-bold block mt-1">Total {totalDiamonds}💎 Credited ({order.quantity}x Multiplier)</span>
            </div>
          </div>

          <div className="space-y-2 border-b border-slate-800/50 pb-3 pt-1">
            <div className="flex justify-between text-slate-400">
              <span>Verified Gamer Profile</span>
              <span className="text-white font-semibold font-sans">{order.nickname}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Account Character UID</span>
              <span className="text-cyan-400 font-bold font-mono">{order.uid}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Subtotal Price</span>
              <span className="text-white">₹{order.price * order.quantity}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Pay System Core</span>
              <span className="text-purple-400 font-bold uppercase">{order.paymentMethod} Direct</span>
            </div>
            {order.razorpayPaymentId && (
              <div className="flex justify-between text-slate-400">
                <span>Network Payment ID</span>
                <span className="text-slate-500 text-[10px] select-all uppercase">{order.razorpayPaymentId}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-sm pt-2">
            <span className="text-slate-200 font-bold uppercase font-sans tracking-wide">Aggregate Payable Paid</span>
            <span className="text-white font-sans font-black text-xl">₹{order.price * order.quantity}</span>
          </div>
        </div>
      </motion.div>

      {/* Bottom controls */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <button
          onClick={handlePrintReceipt}
          className="px-5 py-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:text-white text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer print:hidden"
        >
          <Printer size={14} /> Print Store Receipt
        </button>

        <button
          onClick={onReturnToHome}
          className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white font-black text-xs uppercase hover:shadow-[0_0_20px_rgba(112,0,255,0.3)] flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer print:hidden"
        >
          <Home size={14} /> Return to Store Catalog <ArrowRight size={14} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium tracking-wide mt-6">
        <ShieldCheck size={14} className="text-emerald-500" /> Insured by Razorpay Merchant Protection
      </div>
    </div>
  );
}
