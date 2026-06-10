import React from "react";
import { Package } from "../types";
import DiamondGraphic from "./DiamondGraphic";
import { Sparkles, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";

interface PackageCardProps {
  key?: React.Key | string | number;
  pkg: Package;
  onBuy: (pkg: Package) => void;
}

export default function PackageCard({ pkg, onBuy }: PackageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.4 }}
      className="relative flex flex-col justify-between bg-[#111116] border border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-cyan-500/80 hover:shadow-[0_0_25px_rgba(0,242,255,0.15)] group"
    >
      {/* Popular badge */}
      {pkg.bonus >= 150 && (
        <span className="absolute -top-3 right-4 bg-gradient-to-r from-orange-500 to-yellow-500 text-black text-xs font-bold font-mono px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-orange-500/25">
          <Sparkles size={12} fill="currentColor" /> BEST IN VALUE
        </span>
      )}

      <div>
        {/* Diamond graphic representation */}
        <div className="my-4 flex justify-center">
          <DiamondGraphic type={pkg.image} size="md" />
        </div>

        {/* Content */}
        <div className="text-center mt-6">
          <h3 className="text-xl font-bold text-white tracking-wide group-hover:text-cyan-400 transition-colors">
            {pkg.diamonds} Diamonds
          </h3>
          <p className="text-sm font-semibold text-emerald-400 mt-2 inline-flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <Sparkles size={14} className="animate-pulse" /> Bonus: +{pkg.bonus}
          </p>
          <div className="text-xs text-slate-400 mt-3 font-mono font-medium">
            Total {pkg.diamonds + pkg.bonus} Diamonds
          </div>
        </div>
      </div>

      <div className="mt-8">
        <hr className="border-slate-800 my-4" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Price</span>
            <span className="text-lg font-black text-white font-mono">
              ₹{pkg.price}
            </span>
          </div>
          
          <button
            onClick={() => onBuy(pkg)}
            id={`btn-buy-${pkg.id}`}
            className="flex-1 gradient-btn flex items-center justify-center gap-2 font-bold px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-500 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <ShoppingCart size={16} />
            Buy Now
          </button>
        </div>
      </div>
    </motion.div>
  );
}
