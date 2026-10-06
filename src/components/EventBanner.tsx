import React, { useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  Rocket,
  CheckCircle2,
  XCircle,
  Trophy,
  Zap,
  Target,
} from 'lucide-react';

export type EventBannerType =
  | 'snake'
  | 'ladder'
  | 'correct'
  | 'wrong'
  | 'combo'
  | 'combo-break'
  | 'challenge'
  | 'puzzle-entrance'
  | 'mission'
  | 'victory'
  | 'bounce-100'
  | 'bounce';

export interface EventBannerData {
  id: number;
  type: EventBannerType;
  title: string;
  subtitle?: string;
  badge?: string;
  duration?: number;
}

interface EventBannerProps {
  banner: EventBannerData | null;
  onDismiss: () => void;
}

export const EventBanner: React.FC<EventBannerProps> = ({ banner, onDismiss }) => {
  useEffect(() => {
    if (!banner) return;
    const time = banner.duration || 1800;
    const timer = setTimeout(() => {
      onDismiss();
    }, time);
    return () => clearTimeout(timer);
  }, [banner, onDismiss]);

  if (!banner) return null;

  const getConfig = () => {
    switch (banner.type) {
      case 'snake':
        return {
          icon: <span className="text-2xl animate-bounce">🐍</span>,
          bg: 'bg-gradient-to-r from-rose-950/95 via-red-900/95 to-rose-950/95 border-rose-500/80 text-rose-100',
          glow: 'shadow-rose-600/50',
          accent: 'text-rose-400',
        };
      case 'ladder':
        return {
          icon: <Rocket className="w-6 h-6 text-emerald-400 animate-bounce" />,
          bg: 'bg-gradient-to-r from-emerald-950/95 via-teal-900/95 to-emerald-950/95 border-emerald-500/80 text-emerald-100',
          glow: 'shadow-emerald-600/50',
          accent: 'text-emerald-400',
        };
      case 'correct':
        return {
          icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
          bg: 'bg-gradient-to-r from-emerald-950/95 via-green-900/95 to-emerald-950/95 border-emerald-500 text-emerald-100',
          glow: 'shadow-emerald-500/40',
          accent: 'text-emerald-300',
        };
      case 'wrong':
        return {
          icon: <XCircle className="w-6 h-6 text-rose-400" />,
          bg: 'bg-gradient-to-r from-rose-950/95 via-red-950/95 to-rose-950/95 border-rose-500 text-rose-100',
          glow: 'shadow-rose-500/40',
          accent: 'text-rose-300',
        };
      case 'combo':
        return {
          icon: <Flame className="w-6 h-6 text-orange-400 fill-orange-400 animate-pulse" />,
          bg: 'bg-gradient-to-r from-amber-950/95 via-orange-900/95 to-rose-950/95 border-orange-500 text-amber-100',
          glow: 'shadow-orange-500/50',
          accent: 'text-orange-300',
        };
      case 'combo-break':
        return {
          icon: <span className="text-2xl animate-spin">💥</span>,
          bg: 'bg-gradient-to-r from-slate-900/95 via-rose-950/95 to-slate-900/95 border-slate-700 text-slate-200',
          glow: 'shadow-slate-800/60',
          accent: 'text-rose-400',
        };
      case 'challenge':
        return {
          icon: <Zap className="w-6 h-6 text-amber-400 animate-bounce" />,
          bg: 'bg-gradient-to-r from-purple-950/95 via-indigo-900/95 to-purple-950/95 border-purple-500 text-purple-100',
          glow: 'shadow-purple-500/50',
          accent: 'text-purple-300',
        };
      case 'puzzle-entrance':
        return {
          icon: <span className="text-2xl animate-pulse">🧠</span>,
          bg: 'bg-gradient-to-r from-cyan-950/95 via-blue-900/95 to-indigo-950/95 border-cyan-400 text-cyan-100',
          glow: 'shadow-cyan-500/40',
          accent: 'text-cyan-300',
        };
      case 'mission':
        return {
          icon: <Target className="w-6 h-6 text-cyan-400 animate-spin" />,
          bg: 'bg-gradient-to-r from-sky-950/95 via-blue-900/95 to-indigo-950/95 border-sky-400 text-sky-100',
          glow: 'shadow-sky-500/40',
          accent: 'text-sky-300',
        };
      case 'victory':
        return {
          icon: <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />,
          bg: 'bg-gradient-to-r from-amber-950/95 via-yellow-900/95 to-orange-950/95 border-amber-400 text-amber-100',
          glow: 'shadow-amber-500/60',
          accent: 'text-amber-300',
        };
      case 'bounce-100':
        return {
          icon: <span className="text-2xl animate-bounce">💯</span>,
          bg: 'bg-gradient-to-r from-amber-950/95 via-yellow-900/95 to-amber-950/95 border-amber-400 text-amber-100',
          glow: 'shadow-amber-500/60 ring-2 ring-amber-400/50',
          accent: 'text-amber-300',
        };
      case 'bounce':
        return {
          icon: <span className="text-2xl animate-spin">🔄</span>,
          bg: 'bg-gradient-to-r from-orange-950/95 via-amber-900/95 to-orange-950/95 border-orange-500 text-orange-100',
          glow: 'shadow-orange-500/50',
          accent: 'text-orange-300',
        };
      default:
        return {
          icon: <AlertTriangle className="w-6 h-6 text-cyan-400" />,
          bg: 'bg-slate-900/95 border-slate-700 text-white',
          glow: 'shadow-slate-900/50',
          accent: 'text-cyan-300',
        };
    }
  };

  const config = getConfig();

  return (
    <aside
      aria-label="Notifikasi Permainan"
      aria-live="polite"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none px-3 w-full max-w-sm flex justify-center"
    >
      <div
        className={`animate-bannerPop flex items-center gap-3 px-5 py-3 rounded-2xl border-2 shadow-2xl backdrop-blur-md ${config.bg} ${config.glow}`}
      >
        <div className="shrink-0">{config.icon}</div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm sm:text-base tracking-wide uppercase text-white">
              {banner.title}
            </span>
            {banner.badge && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/40 border border-white/20 ${config.accent}`}>
                {banner.badge}
              </span>
            )}
          </div>
          {banner.subtitle && (
            <p className="text-xs text-slate-200 font-semibold leading-tight mt-0.5">
              {banner.subtitle}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
};
