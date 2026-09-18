import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useTransform } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Bell, Check, CheckCheck, ChevronRight, CircleDollarSign, CreditCard, Crown,
  Eye, EyeOff, Gift, Heart, HeartHandshake, ImagePlus, Lock, MapPin, Menu, MessageCircle, MoreHorizontal,
  Paperclip, Phone, Search, Send, Settings, ShieldCheck, Sparkles, Star, UserRound, UsersRound, Video,
  WalletCards, X, Zap,
} from "lucide-react";
import { africanProfiles, profileFallback, type AfricanProfile } from "@/data/profiles";
import { replies, type ReplyCategory } from "@/data/aiReplies";

type Profile = AfricanProfile;
type MatchRecord = Profile & { matchedAt: number; isNew?: boolean };
type ChatMessage = { id: string; sender: "me" | "them"; text?: string; image?: string; gift?: string; voice?: boolean; followUp?: boolean; at: number; read?: boolean };
type ChatRecord = { userId: number; messages: ChatMessage[]; lastAt: number };
type User = { email: string; name: string; coins?: number; premium?: boolean; premiumSince?: number; coinsPurchasedAt?: number };
type LocalAccount = User & { password: string };

type PaystackPackage = { id: string; name: string; coins: number; amount: number; price: number; icon: string; description: string; features: string[]; popular?: boolean; badge?: string; isPremium?: boolean };
type PaystackCheckout = { openIframe: () => void };
type PaystackSetupOptions = { key: string; email: string; amount: number; currency: string; ref: string; metadata: { coins: number; package: string }; onClose: () => void; callback: (response: { reference?: string }) => void };
type PaystackApi = { setup: (options: PaystackSetupOptions) => PaystackCheckout };

declare global {
  interface Window { PaystackPop?: PaystackApi }
}

const userKey = "couplehearts_user";
const allUsersKey = "couplehearts_all_users";
const matchKey = "couplehearts_matches";
const chatKey = "couplehearts_chats";
const defaultUser: User = { email: "", name: "", coins: 0, premium: false };
const paystackScriptUrl = "https://js.paystack.co/v1/inline.js";
let paystackScriptPromise: Promise<void> | null = null;

function ensurePaystackScript() {
  if (typeof window === "undefined" || typeof document === "undefined") return Promise.reject(new Error("Paystack is only available in a browser."));
  if (window.PaystackPop) return Promise.resolve();
  if (paystackScriptPromise) return paystackScriptPromise;
  paystackScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(`script[src="${paystackScriptUrl}"]`) as HTMLScriptElement | null;
    const script = existing || document.createElement("script");
    const finish = () => window.PaystackPop ? resolve() : reject(new Error("Paystack loaded without its checkout API."));
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("Paystack could not be loaded.")), { once: true });
    if (!existing) {
      script.src = paystackScriptUrl;
      script.async = true;
      script.dataset.coupleheartsPaystack = "true";
      document.head.appendChild(script);
    } else if (window.PaystackPop) finish();
  });
  return paystackScriptPromise;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}
function getAllUsers(): LocalAccount[] { return readJson<LocalAccount[]>(allUsersKey, []); }
function saveAllUsers(users: LocalAccount[]) { localStorage.setItem(allUsersKey, JSON.stringify(users)); }
function ensureSeedAccount() {
  const users = getAllUsers();
  if (users.some((user) => user.email.toLowerCase() === "bradln021@gmail.com")) return;
  saveAllUsers([...users, { email: "bradln021@gmail.com", password: "Password123!", name: "Bradlyn", coins: 20, premium: false }]);
}
function getUser(): User | null {
  const user = readJson<User | null>(userKey, null);
  if (!user) return null;
  // Clear the old demo balance from earlier previews. Paid balances are marked by the Paystack callback.
  if (!user.premium && Number(user.coins ?? 0) > 0 && !user.coinsPurchasedAt && !("password" in user)) {
    const migrated = { ...user, coins: 0 };
    localStorage.setItem(userKey, JSON.stringify(migrated));
    return migrated;
  }
  return user;
}
function readCoins() { const value = Number(getUser()?.coins ?? 0); return Number.isFinite(value) ? Math.max(0, value) : 0; }
function persistUser(user: User) {
  localStorage.setItem(userKey, JSON.stringify(user));
  window.dispatchEvent(new Event("storage"));
  window.dispatchEvent(new CustomEvent("couplehearts:coins", { detail: user.coins ?? 0 }));
}
function updateCoins(delta: number) {
  const current = getUser() || defaultUser;
  const next = { ...current, coins: Math.max(0, Number(current.coins ?? 0) + delta) };
  localStorage.setItem(userKey, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("couplehearts:coins", { detail: next.coins }));
  return next.coins;
}
function spendCoins(cost: number) { if (readCoins() < cost) return false; updateCoins(-cost); return true; }
function saveMatches(items: MatchRecord[]) { localStorage.setItem(matchKey, JSON.stringify(items)); window.dispatchEvent(new Event("couplehearts:matches")); }
function saveChats(items: ChatRecord[]) { localStorage.setItem(chatKey, JSON.stringify(items)); window.dispatchEvent(new Event("couplehearts:chats")); }
function profileById(id: number) { return africanProfiles.find((profile) => profile.id === id) || africanProfiles[0]; }
function seededMatches(): MatchRecord[] { return africanProfiles.slice(0, 5).map((profile, index) => ({ ...profile, matchedAt: Date.now() - index * 3600000, isNew: index < 2 })); }
function loadMatches() {
  const stored = readJson<MatchRecord[]>(matchKey, []);
  if (stored.length) return stored.map((item) => ({ ...profileById(item.id), matchedAt: item.matchedAt, isNew: item.isNew }));
  const initial = seededMatches(); saveMatches(initial); return initial;
}
function matchPercent(profile: Profile, mine = ["Coffee", "Travel", "Design", "Film"]) {
  const common = profile.interests.filter((interest) => mine.includes(interest)).length;
  return profile.match || Math.min(99, 85 + common * 3 + ((profile.id * 7) % 5));
}
function timeLabel(at: number) { const diff = Math.max(0, Date.now() - at); if (diff < 60000) return "now"; if (diff < 3600000) return `${Math.floor(diff / 60000)}m`; if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`; return "Yesterday"; }
function randomItem<T>(items: T[]) { return items[Math.floor(Math.random() * items.length)] || items[0]; }
function vibrate(pattern: number | number[] = 18) { if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern); }

function SafeImage({ src, alt, className, style, onClick }: { src?: string; alt: string; className?: string; style?: React.CSSProperties; onClick?: () => void }) {
  return <img className={className} style={style} src={src || profileFallback} alt={alt} onClick={onClick} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = profileFallback; }} />;
}
function Logo({ compact = false }: { compact?: boolean }) { return <div className={compact ? "brand brand-compact" : "brand"}><span className="brand-mark">💑</span><span>Couple Hearts<span className="brand-heart">♥</span></span></div>; }
function Pill({ children, tone = "rose" }: { children: ReactNode; tone?: "rose" | "green" | "purple" | "gold" }) { return <span className={`pill pill-${tone}`}>{children}</span>; }
function AuthShell({ children, eyebrow, title, subtitle, sideTitle }: { children: ReactNode; eyebrow: string; title: string; subtitle: string; sideTitle: string }) {
  return <div className="auth-shell"><section className="auth-visual"><div className="auth-visual-glow" /><div className="auth-visual-inner"><Logo /><div className="auth-copy"><p className="eyebrow eyebrow-light">{eyebrow}</p><h2>{sideTitle}</h2><p>Slow down, be curious, and find your person in the little things.</p><div className="couple-orbit" aria-hidden="true"><span>♡</span><span>♡</span><div className="orbit-line" /></div><div className="auth-proof"><div className="avatar-stack">{africanProfiles.slice(0, 3).map((profile) => <SafeImage key={profile.id} src={profile.images[0]} alt="" />)}</div><span><strong>12k+</strong> couples matched today</span></div></div><p className="auth-footnote">Made for meaningful connections <span>♥</span></p></div></section><section className="auth-panel"><div className="auth-panel-inner"><div className="auth-mobile-logo"><Logo /></div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="auth-subtitle">{subtitle}</p>{children}</div></section></div>;
}
function Login() {
  const [, navigate] = useLocation(); const savedEmail = localStorage.getItem("couplehearts_saved_email"); const [email, setEmail] = useState(savedEmail || ""); const [password, setPassword] = useState(""); const [remember, setRemember] = useState(!!savedEmail); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState("");
  useEffect(() => { ensureSeedAccount(); }, []);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) { setError("Enter a valid email address."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    ensureSeedAccount();
    const users = getAllUsers();
    const found = users.find((user) => user.email.toLowerCase() === normalizedEmail);
    if (!found) { setError("No account found for this email. Please create a new account."); return; }
    if (found.password !== password) { setError("Wrong password. Please try again."); return; }
    const nextUser = { ...found };
    if (remember) localStorage.setItem("couplehearts_saved_email", normalizedEmail);
    else localStorage.removeItem("couplehearts_saved_email");
    localStorage.setItem(userKey, JSON.stringify(nextUser));
    window.dispatchEvent(new CustomEvent("couplehearts:coins", { detail: nextUser.coins ?? 0 }));
    navigate("/dashboard");
  };
  return <div className="lovely-login">
    <section className="lovely-login-hero">
      <div className="lovely-login-hero-image" />
      <div className="lovely-login-hero-gradient" />
      <div className="lovely-login-logo"><span>♡</span> Couple Hearts</div>
      <p className="lovely-login-quote">Find your forever, together.</p>
    </section>
    <section className="lovely-login-main">
      <div className="floating-hearts" aria-hidden="true"><span>💖</span><span>💗</span><span>💞</span><span>💕</span><span>💘</span></div>
      <div className="lovely-login-card">
        <div className="lovely-mobile-logo"><span>♡</span> Couple Hearts</div>
        <div className="lovely-login-heading"><h1>Welcome back</h1><p>Log in to continue to Couple Hearts</p></div>
        <form className="lovely-login-form" onSubmit={submit} noValidate>
          <label>Email or phone<input value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} type="email" placeholder="you@email.com" autoComplete="email" required /></label>
          <label>Password<div className="lovely-password"><input value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} type={showPassword ? "text" : "password"} placeholder="••••••••" autoComplete="current-password" minLength={6} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <div className="lovely-login-options"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> <span>Remember me</span></label><a href="#forgot">Forgot password?</a></div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="lovely-login-button" type="submit">Log In <Heart size={17} fill="currentColor" /></button>
          <p className="lovely-signup">Don&apos;t have an account? <Link href="/register">Sign Up</Link></p>
        </form>
      </div>
    </section>
  </div>;
}
function Register() {
  const [, navigate] = useLocation(); const [form, setForm] = useState({ name: "", email: "", age: "", gender: "", password: "", confirm: "" }); const [agreed, setAgreed] = useState(false); const [error, setError] = useState(""); const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  useEffect(() => { ensureSeedAccount(); }, []);
  const submit = (event: React.FormEvent) => { event.preventDefault(); const normalizedEmail = form.email.trim().toLowerCase(); if (!form.name || !normalizedEmail || !form.age || !form.gender || form.password.length < 6 || form.password !== form.confirm || !agreed) { setError("Complete the fields, match your passwords, and agree to the terms."); return; } const users = getAllUsers(); if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) { setError("An account with this email already exists. Please log in."); return; } const account: LocalAccount = { email: normalizedEmail, password: form.password, name: form.name.trim(), coins: 20, premium: false }; saveAllUsers([...users, account]); localStorage.setItem(userKey, JSON.stringify(account)); navigate("/dashboard"); };
  return <AuthShell eyebrow="Start something real" title="Create your account 🚀" subtitle="A few details, then the fun part: meeting someone lovely." sideTitle="Meet with intention."><form className="auth-form register-form" onSubmit={submit}><div className="register-grid"><label>Full name<input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Alex Morgan" /></label><label>Email<input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="you@example.com" /></label><label>Age<select value={form.age} onChange={(e) => update("age", e.target.value)}><option value="">Select age</option>{Array.from({ length: 43 }, (_, i) => <option key={i + 18}>{i + 18}</option>)}</select></label><label>Gender<select value={form.gender} onChange={(e) => update("gender", e.target.value)}><option value="">Choose one</option><option>Female</option><option>Male</option><option>Other</option></select></label></div><label>Password<input value={form.password} onChange={(e) => update("password", e.target.value)} type="password" placeholder="6+ characters" /></label><label>Confirm password<input value={form.confirm} onChange={(e) => update("confirm", e.target.value)} type="password" placeholder="Repeat your password" /></label><button type="button" className="upload-zone"><span className="upload-icon"><ImagePlus size={20} /></span><span><strong>Add a profile photo</strong><small>Add 2+ photos = 3x more matches 📸</small></span><ChevronRight size={17} /></button><label className="checkbox-label terms"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>I agree to the Couple Hearts Terms 💑</span></label>{error && <p className="form-error">{error}</p>}<button className="primary-button" type="submit">Create Couple Account <ArrowRight size={17} /></button><p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p></form></AuthShell>;
}

const navItems = [{ href: "/dashboard", label: "Dashboard", icon: Sparkles }, { href: "/matches", label: "Matches", icon: Heart, badge: "10" }, { href: "/chats", label: "Chats", icon: MessageCircle, badge: "3" }, { href: "/wallet", label: "Wallet", icon: WalletCards }];
function getUserCoins(user: User | null) {
  const value = Number(user?.coins ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}
function hasChatAccess(user: User | null) { return user?.premium === true || getUserCoins(user) > 0; }
function useCurrentUser() {
  const [user, setUser] = useState<User | null>(() => getUser());
  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("couplehearts:coins", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("couplehearts:coins", sync); window.removeEventListener("storage", sync); };
  }, []);
  return user;
}
function useCoins() { return getUserCoins(useCurrentUser()); }
function Layout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const currentUser = useCurrentUser();
  const user = currentUser || defaultUser;
  const coins = getUserCoins(user);
  const chatLocked = !hasChatAccess(user);
  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setMobileOpen(false);
    if (href === "/chats" && chatLocked) {
      event.preventDefault();
      setShowPaywall(true);
    }
  };
  return <div className="app-shell"><aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}><div><div className="sidebar-top"><Logo compact /><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><p className="sidebar-kicker">YOUR LOVE STORY, ON YOUR TERMS</p><nav className="sidebar-nav">{navItems.map((item) => { const Icon = item.icon; const locked = item.href === "/chats" && chatLocked; return <Link key={item.href} href={item.href} onClick={(event) => handleNavClick(event, item.href)} className={location.split("?")[0] === item.href ? "nav-item active" : "nav-item"}><Icon size={18} /><span>{item.label}</span>{locked ? <span className="nav-locked-badge">LOCKED</span> : item.badge && <span className="nav-badge">{item.badge}</span>}{item.href === "/wallet" && <span className="coin-count">{coins}<CircleDollarSign size={13} /></span>}</Link>; })}</nav></div><div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={15} /><span><strong>Profile boost</strong><small>Get seen by more lovely people.</small></span><ChevronRight size={14} /></div><div className="user-card"><div className="user-meta"><strong>{user.email || "Signed-in account"}</strong><small>{coins} coins · Online now</small></div><button className="icon-button"><Settings size={17} /></button></div><button className="sign-out" onClick={() => { localStorage.removeItem(userKey); localStorage.removeItem("couplehearts_token"); navigate("/login"); }}><ArrowRight size={16} /> Sign out</button></div></aside>{mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}<main className="main-content"><header className="mobile-header"><button className="icon-button" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><Logo compact /><button className="icon-button"><Bell size={19} /></button></header>{children}</main><nav className="mobile-nav">{navItems.map((item) => { const Icon = item.icon; const locked = item.href === "/chats" && chatLocked; return <Link key={item.href} href={item.href} onClick={(event) => handleNavClick(event, item.href)} className={location.split("?")[0] === item.href ? "mobile-nav-item active" : "mobile-nav-item"}><Icon size={19} /><span>{item.label}</span>{locked && <span className="mobile-nav-locked-badge">LOCKED</span>}</Link>; })}</nav>{showPaywall && <div className="chat-paywall-backdrop" role="dialog" aria-modal="true" aria-labelledby="chat-paywall-title" onClick={() => setShowPaywall(false)}><div className="chat-paywall-card" onClick={(event) => event.stopPropagation()}><button className="chat-paywall-close" type="button" aria-label="Close" onClick={() => setShowPaywall(false)}>×</button><div className="chat-paywall-icon">🔒💬</div><h2 id="chat-paywall-title">Chats Locked</h2><p>You need coins to chat 😍 Buy coins to unlock your conversations and start connecting.</p><button className="primary-button chat-paywall-buy" type="button" onClick={() => { setShowPaywall(false); navigate("/wallet"); }}>Buy Coins <WalletCards size={17} /></button></div></div>}</div>;
}
function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>; }
function LowCoinsModal({ needed, onClose }: { needed: number; onClose: () => void }) { const coins = useCoins(); return <div className="modal-backdrop" onClick={onClose}><motion.div className="utility-modal low-coins-modal" initial={{ opacity: 0, scale: .95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="utility-icon gold"><CircleDollarSign size={25} /></div><p className="eyebrow">Your sparkle needs a top-up</p><h2>Need coins! Go to Wallet</h2><p>You need {needed} coins, but your balance is {coins || 0}. Buy a little magic to keep connecting.</p><Link href="/wallet" className="primary-button" onClick={onClose}>Go to Wallet <WalletCards size={17} /></Link><button className="text-link keep-swiping" onClick={onClose}>Maybe later</button></motion.div></div>; }

function FilterModal({ value, onChange, onClose, onApply }: { value: { minAge: number; maxAge: number; distance: number; interests: string[]; verified: boolean }; onChange: (next: { minAge: number; maxAge: number; distance: number; interests: string[]; verified: boolean }) => void; onClose: () => void; onApply: () => void }) {
  const allInterests = Array.from(new Set(africanProfiles.flatMap((profile) => profile.interests)));
  const toggle = (interest: string) => onChange({ ...value, interests: value.interests.includes(interest) ? value.interests.filter((item) => item !== interest) : [...value.interests, interest] });
  return <div className="modal-backdrop" onClick={onClose}><motion.div className="utility-modal filter-modal" initial={{ opacity: 0, scale: .95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><p className="eyebrow">Curate your serendipity</p><h2>Filters</h2><div className="filter-grid"><label>Age range<div className="range-row"><input type="number" min="18" max="70" value={value.minAge} onChange={(e) => onChange({ ...value, minAge: Number(e.target.value) })} /><span>to</span><input type="number" min="18" max="70" value={value.maxAge} onChange={(e) => onChange({ ...value, maxAge: Number(e.target.value) })} /></div></label><label>Distance <select value={value.distance} onChange={(e) => onChange({ ...value, distance: Number(e.target.value) })}><option value="10">Within 10 km</option><option value="20">Within 20 km</option><option value="50">Within 50 km</option></select></label></div><div className="filter-label">Interests</div><div className="interest-picker">{allInterests.map((interest) => <button type="button" key={interest} className={value.interests.includes(interest) ? "interest-choice selected" : "interest-choice"} onClick={() => toggle(interest)}>{interest}{value.interests.includes(interest) && <Check size={13} />}</button>)}</div><label className="checkbox-label filter-check"><input type="checkbox" checked={value.verified} onChange={(e) => onChange({ ...value, verified: e.target.checked })} /><span>Only show verified profiles</span></label><button className="primary-button" onClick={onApply}>Show my matches <ArrowRight size={17} /></button></motion.div></div>;
}
function MatchModal({ profile, onClose }: { profile: Profile; onClose: () => void }) { return <div className="modal-backdrop" onClick={onClose}><motion.div className="utility-modal match-modal" initial={{ opacity: 0, scale: .95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="match-avatars"><SafeImage src={africanProfiles[5].images[0]} alt="You" /><span>♥</span><SafeImage src={profile.images[0]} alt={profile.name} /></div><p className="eyebrow">It is a match!</p><h2>You and {profile.name} like each other.</h2><p>Start with a warm hello and see where the spark takes you.</p><Link href={`/chats?user=${profile.id}`} className="primary-button" onClick={onClose}>Say hello <MessageCircle size={17} /></Link></motion.div></div>; }

function Dashboard() {
  const [index, setIndex] = useState(0); const [history, setHistory] = useState<{ profile: Profile; action: string }[]>([]); const [matchProfile, setMatchProfile] = useState<Profile | null>(null); const [filterOpen, setFilterOpen] = useState(false); const [boost, setBoost] = useState(0); const [lowCoins, setLowCoins] = useState(0); const [filters, setFilters] = useState({ minAge: 22, maxAge: 35, distance: 50, interests: [] as string[], verified: false });
  const x = useMotionValue(0); const y = useMotionValue(0); const rotate = useTransform(x, [-260, 260], [-16, 16]); const likeOpacity = useTransform(x, [-120, -35], [1, 0]); const nopeOpacity = useTransform(x, [35, 120], [0, 1]); const superOpacity = useTransform(y, [-150, -55], [1, 0]); const controls = useAnimationControls();
  const filtered = useMemo(() => africanProfiles.filter((profile) => profile.age >= filters.minAge && profile.age <= filters.maxAge && profile.distance <= filters.distance && (!filters.verified || profile.verified) && (!filters.interests.length || profile.interests.some((interest) => filters.interests.includes(interest)))), [filters]);
  const current = filtered[index];
  useEffect(() => { setIndex(0); setHistory([]); controls.set({ x: 0, y: 0, rotate: 0 }); }, [filters, controls]);
  useEffect(() => { if (!boost) return; const timer = window.setInterval(() => setBoost((value) => value <= 1 ? 0 : value - 1), 1000); return () => window.clearInterval(timer); }, [boost]);
  const doMatch = (profile: Profile, action: string) => { if (action !== "like" && action !== "super") return; const isMatch = action === "super" || profile.id % 3 === 1; if (!isMatch) return; const currentMatches = loadMatches(); if (!currentMatches.some((item) => item.id === profile.id)) saveMatches([{ ...profile, matchedAt: Date.now(), isNew: true }, ...currentMatches]); setMatchProfile(profile); };
  const finishSwipe = (action: "pass" | "like" | "super") => { if (!current) return; setHistory((items) => [...items, { profile: current, action }]); setIndex((value) => value + 1); window.requestAnimationFrame(() => { x.set(0); y.set(0); controls.set({ x: 0, y: 0, rotate: 0, opacity: 1 }); }); doMatch(current, action); vibrate(action === "pass" ? 10 : [15, 40, 15]); };
  const swipe = async (action: "pass" | "like" | "super") => { if (!current) return; if (action === "super" && !spendCoins(20)) { setLowCoins(20); return; } const exit = action === "like" ? -500 : action === "pass" ? 500 : 0; await controls.start({ x: exit, y: action === "super" ? -240 : 0, rotate: action === "like" ? -18 : action === "pass" ? 18 : 0, opacity: 0, transition: { duration: .24 } }); finishSwipe(action); };
  const dragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number } }) => { if (info.offset.x < -120) void swipe("like"); else if (info.offset.x > 120) void swipe("pass"); else if (info.offset.y < -120) void swipe("super"); else controls.start({ x: 0, y: 0, rotate: 0 }); };
  const rewind = () => { if (!history.length) return; if (!spendCoins(50)) { setLowCoins(50); return; } setHistory((items) => items.slice(0, -1)); setIndex((value) => Math.max(0, value - 1)); };
  const startBoost = () => { if (!spendCoins(100)) { setLowCoins(100); return; } setBoost(300); };
  return <div className="page dashboard-page"><PageHeader eyebrow="Your daily serendipity" title="Find your person 💕" description="A few promising profiles, chosen with a little help from your heart." action={<div className="header-actions"><button className="ghost-button" onClick={() => setFilterOpen(true)}><Sparkles size={16} /> Filters {filters.interests.length > 0 && <Pill tone="rose">{filters.interests.length}</Pill>}</button><Link className="premium-button" href="/wallet"><Crown size={16} fill="currentColor" /> Go premium · KSH 4,000</Link></div>} /><div className="discover-layout"><section className="discover-stage"><div className="stage-label"><span><span className="live-dot" /> Curated for Alex</span><span>{current ? `${index + 1} of ${filtered.length}` : "Deck complete"}</span></div><div className="card-stack">{current ? <><div className="back-card back-card-one stack-preview"><SafeImage src={filtered[index + 1]?.images[0] || current.images[0]} alt="Next profile" /></div><motion.article key={`${current.id}-${index}`} className="swipe-card" animate={controls} style={{ x, y, rotate }} drag dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }} onDragEnd={dragEnd}><SafeImage src={current.images[0]} alt={current.name} /><div className="card-overlay" /><motion.div className="swipe-label like-label" style={{ opacity: likeOpacity }}>LIKE</motion.div><motion.div className="swipe-label nope-label" style={{ opacity: nopeOpacity }}>NOPE</motion.div><motion.div className="swipe-label super-label" style={{ opacity: superOpacity }}>SUPER LIKE</motion.div><div className="card-content"><div className="profile-topline"><span className="verified-badge">{current.verified && <><ShieldCheck size={13} /> Verified</>}</span><span className="profile-match">{matchPercent(current)}% match</span></div><div><h2>{current.name}, <span>{current.age}</span></h2><p className="profile-location"><MapPin size={14} /> {current.city} <span>·</span> {current.distance} km away {current.online && <><span>·</span><span className="card-online">online now</span></>}</p><p className="profile-bio">{current.bio}</p><div className="profile-tags">{current.interests.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div></motion.article></> : <div className="deck-empty"><div className="utility-icon"><Heart size={24} /></div><h2>You saw everyone nearby.</h2><p>Try widening your filters or rewind your last decision.</p><div className="deck-empty-actions"><button className="ghost-button" onClick={() => setFilterOpen(true)}>Change filters</button><button className="primary-button" onClick={rewind} disabled={!history.length}>Rewind 50 <CircleDollarSign size={15} /></button></div></div>}</div>{current && <><div className="swipe-actions"><button className="swipe-action pass" onClick={() => void swipe("pass")} aria-label="Pass"><X size={25} /></button><button className="swipe-action rewind" onClick={rewind} aria-label="Rewind"><ArrowLeft size={20} /></button><button className="swipe-action super" onClick={() => void swipe("super")} aria-label="Super like"><Star size={22} fill="currentColor" /></button><button className="swipe-action boost" onClick={startBoost} aria-label="Boost"><Zap size={20} fill="currentColor" /></button></div><p className="swipe-hint"><span>←</span> Swipe to explore <span>↑ super like</span> <span>→</span></p></>}</section><aside className="discover-aside"><div className="aside-card mini-profile"><div className="mini-profile-head"><div><p className="eyebrow">Your profile</p><h3>Looking lovely.</h3></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="profile-completion"><div className="completion-ring"><span>74%</span></div><div><strong>Almost there</strong><p>Add one more photo to stand out.</p><button className="text-link">Complete profile <ArrowRight size={13} /></button></div></div></div><div className="aside-card intention-card"><div className="intention-icon"><HeartHandshake size={18} /></div><div><p className="eyebrow">Today’s intention</p><h3>Be open to a plot twist.</h3><p>Great connections rarely look exactly like the plan.</p></div></div><div className="aside-card match-teaser"><div className="teaser-top"><p className="eyebrow">Your week in love</p><span className="trend"><ArrowRight size={13} /> 18%</span></div><div className="teaser-stat"><strong>10</strong><span>new possibilities<br />this week</span></div><div className="tiny-avatars">{africanProfiles.slice(0, 5).map((profile, i) => <SafeImage key={profile.id} src={profile.images[0]} style={{ zIndex: 5 - i } as React.CSSProperties} alt="" />)}<span>+5</span></div></div></aside></div>{boost > 0 && <div className="boost-pill"><Zap size={14} fill="currentColor" /> Boost active · {String(Math.floor(boost / 60)).padStart(2, "0")}:{String(boost % 60).padStart(2, "0")}</div>}{filterOpen && <FilterModal value={filters} onChange={setFilters} onClose={() => setFilterOpen(false)} onApply={() => setFilterOpen(false)} />}{matchProfile && <MatchModal profile={matchProfile} onClose={() => setMatchProfile(null)} />}{lowCoins > 0 && <LowCoinsModal needed={lowCoins} onClose={() => setLowCoins(0)} />}</div>;
}

function Matches() {
  const [matches, setMatches] = useState<MatchRecord[]>(loadMatches); const [filter, setFilter] = useState("All");
  useEffect(() => { const sync = () => setMatches(loadMatches()); window.addEventListener("couplehearts:matches", sync); return () => window.removeEventListener("couplehearts:matches", sync); }, []);
  const cities = ["All", ...Array.from(new Set(matches.map((item) => item.city)))]; const visible = filter === "All" ? matches : matches.filter((item) => item.city === filter);
  return <div className="page matches-page"><PageHeader eyebrow="Your little constellation" title="Matches ✨" description="People who made your heart pause for a second." action={<Link href="/dashboard" className="primary-button"><Sparkles size={17} /> Discover more</Link>} /><div className="match-filter-row">{cities.map((city) => <button key={city} className={filter === city ? "filter-chip active" : "filter-chip"} onClick={() => setFilter(city)}>{city}</button>)}</div><div className="matches-grid">{visible.map((profile) => <article className="match-card" key={profile.id}><div className="match-card-image"><SafeImage src={profile.images[0]} alt={profile.name} /><span className={profile.online ? "online-dot" : "online-dot offline"} /><span className="match-score">{matchPercent(profile)}%</span></div><div className="match-card-body"><div className="match-name-row"><div><h3>{profile.name}, {profile.age}</h3><p><MapPin size={12} /> {profile.city}</p></div>{profile.verified && <ShieldCheck size={16} className="verified-icon" />}</div><p className="match-bio">{profile.bio}</p><div className="profile-tags light-tags">{profile.interests.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div><div className="match-card-actions"><Link href={`/chats?user=${profile.id}`} className="primary-button"><MessageCircle size={15} /> Message</Link><button className="icon-button"><Heart size={18} fill="currentColor" /></button></div></div></article>)}{!visible.length && <div className="empty-state"><Heart size={28} /><h3>No matches in this city yet.</h3><p>Discover someone new and let the story unfold.</p><Link href="/dashboard" className="primary-button">Explore profiles</Link></div>}</div></div>;
}

function initialChats(): ChatRecord[] {
  const now = Date.now();
  return loadMatches().slice(0, 4).map((match, index) => ({ userId: match.id, lastAt: now - index * 720000, messages: [{ id: `seed-${match.id}`, sender: "them", text: index === 0 ? "Hey you 😊 I was hoping you would say hi." : "Your profile made me smile.", at: now - index * 720000, read: index !== 0 }, ...(index === 0 ? [{ id: "seed-voice", sender: "them" as const, voice: true, text: "Voice note", at: now - 500000, read: true }] : [])] }));
}
function loadChats() { const stored = readJson<ChatRecord[]>(chatKey, []); if (stored.length) return stored; const initial = initialChats(); saveChats(initial); return initial; }
function chooseReply(text: string, city: string) {
  const value = text.toLowerCase();
  let category: ReplyCategory = "flirty";
  if (value.includes("gift")) category = "giftReaction";
  else if (value.includes("?") || value.includes("how ") || value.includes("what ") || value.includes("where ")) category = "question";
  else if (value.includes("hi") || value.includes("hello") || value.includes("sasa")) category = city === "Lagos" || city === "Abuja" ? "naija" : city === "Nairobi" || city === "Mombasa" ? "kenyan" : "greeting";
  else if (city === "Lagos" || city === "Abuja") category = "naija";
  else if (city === "Nairobi" || city === "Mombasa") category = "kenyan";
  return randomItem(replies[category]);
}
function ChatBubble({ item, active }: { item: ChatMessage; active: Profile }) {
  return <div className="message-content">{item.image && <SafeImage className="sent-image" src={item.image} alt="Shared" />}{item.gift ? <div className="gift-bubble"><Gift size={18} /><strong>{item.gift}</strong><span>{item.text}</span></div> : item.voice ? <div className="voice-note"><button type="button" aria-label="Play voice note">▶</button><span>🎤 0:12</span><i><b /></i></div> : item.text && <div className="bubble"><p>{item.text}</p><time>{new Date(item.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></div>}<small className="message-meta">{timeLabel(item.at)} {item.sender === "me" && <CheckCheck className="read-receipt" size={13} />}</small>{item.sender === "them" && !item.image && !item.text && <span className="sr-only">{active.name}</span>}</div>;
}
function Chats() {
  const user = useCurrentUser();
  const coins = getUserCoins(user);
  if (!hasChatAccess(user)) {
    return <div className="page chats-page"><PageHeader eyebrow="Keep the spark going" title="🔒 Chats Locked! You need coins to chat 😍 Buy coins to unlock 💖" description="Your conversations are waiting for a little more magic." /><section className="chat-lock-card" aria-labelledby="chat-lock-title"><div className="chat-lock-icon" aria-hidden="true"><Lock size={28} /></div><p className="eyebrow">A little more magic</p><h2 id="chat-lock-title">Unlock your conversations 💌</h2><p className="chat-lock-message">You need coins to chat 😍 Buy coins to unlock 💖</p><div className="chat-lock-balance"><CircleDollarSign size={18} /><span>Current balance</span><strong>{coins}</strong><small>coins</small></div><Link href="/wallet" className="primary-button chat-lock-button"><WalletCards size={17} /> Buy coins to unlock</Link></section></div>;
  }
  return <ChatsInterface />;
}
function ChatsInterface() {
  const [location, navigate] = useLocation(); const [records, setRecords] = useState<ChatRecord[]>(loadChats); const [selectedId, setSelectedId] = useState(0); const [query, setQuery] = useState(""); const [message, setMessage] = useState(""); const [typing, setTyping] = useState(false); const [giftOpen, setGiftOpen] = useState(false); const [imageOpen, setImageOpen] = useState(false); const [emojiOpen, setEmojiOpen] = useState(false); const [lowCoins, setLowCoins] = useState(0); const bodyRef = useRef<HTMLDivElement>(null); const timers = useRef<number[]>([]);
  const queryUser = Number(new URLSearchParams(location.split("?")[1] || "").get("user") || 0);
  useEffect(() => { const requested = queryUser && records.some((record) => record.userId === queryUser) ? queryUser : records[0]?.userId || africanProfiles[0].id; setSelectedId(requested); }, [queryUser, records.length]);
  const active = profileById(selectedId || records[0]?.userId || africanProfiles[0].id); const activeRecord = records.find((record) => record.userId === active.id) || { userId: active.id, messages: [], lastAt: Date.now() };
  const unreadCount = (record: ChatRecord) => record.messages.filter((item) => item.sender === "them" && !item.read).length;
  const sorted = useMemo(() => records.filter((record) => { const person = profileById(record.userId); return !query || person.name.toLowerCase().includes(query.toLowerCase()) || record.messages.some((item) => item.text?.toLowerCase().includes(query.toLowerCase())); }).sort((a, b) => b.lastAt - a.lastAt), [records, query]);
  const updateRecord = (userId: number, updater: (record: ChatRecord) => ChatRecord) => setRecords((current) => { const found = current.some((record) => record.userId === userId); const next = found ? current.map((record) => record.userId === userId ? updater(record) : record) : [...current, updater({ userId, messages: [], lastAt: Date.now() })]; saveChats(next); return next; });
  const selectChat = (userId: number) => { setSelectedId(userId); navigate(`/chats?user=${userId}`); updateRecord(userId, (record) => ({ ...record, messages: record.messages.map((item) => item.sender === "them" ? { ...item, read: true } : item) })); };
  useEffect(() => { bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" }); }, [activeRecord.messages.length, typing, selectedId]);
  useEffect(() => () => { timers.current.forEach((timer) => window.clearTimeout(timer)); }, []);
  useEffect(() => {
    const latest = activeRecord.messages[activeRecord.messages.length - 1];
    if (!latest || latest.sender !== "them" || latest.followUp) return;
    const wait = Math.max(1000, 30000 - (Date.now() - latest.at));
    const timer = window.setTimeout(() => {
      updateRecord(active.id, (record) => { const currentLatest = record.messages[record.messages.length - 1]; if (!currentLatest || currentLatest.sender !== "them" || currentLatest.followUp || currentLatest.at !== latest.at) return record; const follow: ChatMessage = { id: `follow-${Date.now()}`, sender: "them", text: "Babe uko? 🥺", followUp: true, at: Date.now(), read: false }; return { ...record, messages: [...record.messages, follow], lastAt: follow.at }; });
    }, wait);
    timers.current.push(timer);
    return () => window.clearTimeout(timer);
  }, [active.id, activeRecord.messages.length, activeRecord.messages[activeRecord.messages.length - 1]?.at]);
  const queueAiReply = (userText: string, userId: number) => {
    setTyping(true); const firstDelay = 1000 + Math.floor(Math.random() * 2000); const firstTimer = window.setTimeout(() => { const person = profileById(userId); const text = chooseReply(userText, person.city); const includeImage = Math.random() < .22; const response: ChatMessage = { id: `ai-${Date.now()}`, sender: "them", text, image: includeImage ? randomItem(person.images) : undefined, at: Date.now(), read: false }; updateRecord(userId, (record) => ({ ...record, messages: [...record.messages, response], lastAt: response.at })); if (selectedId === userId) setTyping(false); if (Math.random() < .28) { if (selectedId === userId) setTyping(true); const secondTimer = window.setTimeout(() => { const second: ChatMessage = { id: `ai-${Date.now()}-2`, sender: "them", text: randomItem(replies.flirty), at: Date.now(), read: false }; updateRecord(userId, (record) => ({ ...record, messages: [...record.messages, second], lastAt: second.at })); if (selectedId === userId) setTyping(false); }, 700 + Math.floor(Math.random() * 700)); timers.current.push(secondTimer); } }, firstDelay); timers.current.push(firstTimer);
  };
  const sendText = (event: React.FormEvent) => { event.preventDefault(); const text = message.trim(); if (!text) return; const item: ChatMessage = { id: `me-${Date.now()}`, sender: "me", text, at: Date.now(), read: true }; updateRecord(active.id, (record) => ({ ...record, messages: [...record.messages, item], lastAt: item.at })); setMessage(""); setGiftOpen(false); setEmojiOpen(false); setImageOpen(false); queueAiReply(text, active.id); };
  const sendImage = (image: string) => { const item: ChatMessage = { id: `image-${Date.now()}`, sender: "me", image, at: Date.now(), read: true }; updateRecord(active.id, (record) => ({ ...record, messages: [...record.messages, item], lastAt: item.at })); setImageOpen(false); queueAiReply("I sent you a photo", active.id); };
  const sendGift = (gift: string, cost: number) => { if (!spendCoins(cost)) { setLowCoins(cost); return; } const item: ChatMessage = { id: `gift-${Date.now()}`, sender: "me", gift, text: `A little something for you · ${cost} coins`, at: Date.now(), read: true }; updateRecord(active.id, (record) => ({ ...record, messages: [...record.messages, item], lastAt: item.at })); setGiftOpen(false); queueAiReply(`gift ${gift}`, active.id); };
  return <div className="page chats-page"><PageHeader eyebrow="Keep the spark going" title="Your chats 🥰" description="Little messages, warm hellos, and the people worth coming back to." action={<Link href="/matches" className="ghost-button"><UsersRound size={17} /> New connection</Link>} /><div className="soyo-chat-layout"><aside className="soyo-chat-list"><div className="soyo-search"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search couples..." /></div><div className="soyo-list-heading"><strong>Messages</strong><span>{records.reduce((sum, record) => sum + unreadCount(record), 0)} unread</span></div><div className="soyo-list-scroll">{sorted.map((record) => { const person = profileById(record.userId); const last = record.messages[record.messages.length - 1]; return <button key={record.userId} className={selectedId === record.userId ? "soyo-chat-preview selected" : "soyo-chat-preview"} onClick={() => selectChat(record.userId)}><div className="soyo-avatar"><SafeImage src={person.images[0]} alt={person.name} /><span className={person.online ? "online-dot" : "online-dot offline"} /></div><div className="soyo-preview-copy"><div><strong>{person.name}</strong><time>{timeLabel(record.lastAt)}</time></div><p>{last?.image ? "Photo" : last?.gift ? `Gift: ${last.gift}` : last?.voice ? "🎤 Voice note" : last?.text || "Say hello"}</p></div>{unreadCount(record) > 0 && <span className="soyo-unread">{unreadCount(record)}</span>}</button>; })}</div><div className="soyo-list-tip"><Sparkles size={16} /><span>Tip: ask about something in their profile.</span></div></aside><section className="soyo-conversation"><header className="soyo-conversation-head"><div className="soyo-person"><div className="soyo-avatar"><SafeImage src={active.images[0]} alt={active.name} /><span className={active.online ? "online-dot" : "online-dot offline"} /></div><div><h3>{active.name}</h3><p>{active.online ? "Online now • Active" : "Last seen today • Active"}</p></div></div><div className="soyo-conversation-actions"><button className="icon-button" aria-label="Call"><Phone size={18} /></button><button className="icon-button" aria-label="Video call"><Video size={18} /></button><button className="icon-button" aria-label="More actions"><MoreHorizontal size={18} /></button></div></header><div className="soyo-conversation-body" ref={bodyRef}><div className="day-divider"><span>Today</span></div><AnimatePresence initial={false}>{activeRecord.messages.map((item) => <motion.div key={item.id} className={`soyo-message-row ${item.sender === "me" ? "mine" : "theirs"}`} initial={{ opacity: 0, y: 8, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }}><>{item.sender === "them" && <SafeImage src={active.images[0]} alt={active.name} />}</><ChatBubble item={item} active={active} /></motion.div>)}</AnimatePresence>{typing && <div className="soyo-typing-row"><SafeImage src={active.images[0]} alt={active.name} /><div className="soyo-typing"><i /><i /><i /></div></div>}</div><div className="soyo-composer-wrap"><div className="soyo-tools"><div className="soyo-tool-popover-wrap"><button type="button" className="soyo-tool" onClick={() => { setImageOpen(!imageOpen); setGiftOpen(false); }}><Paperclip size={17} /> Attach</button>{imageOpen && <div className="soyo-popover soyo-image-picker"><span>Share a little moment</span><div>{active.images.map((image) => <button key={image} onClick={() => sendImage(image)}><SafeImage src={image} alt="Choose" /></button>)}</div></div>}</div><div className="soyo-tool-popover-wrap"><button type="button" className="soyo-tool" onClick={() => setEmojiOpen(!emojiOpen)}>😊 Emoji</button>{emojiOpen && <div className="soyo-popover soyo-emoji-picker">{["✨", "🥰", "☕", "🌙", "😂", "❤️", "🌹", "🙌", "😍", "😉", "🫶", "💫"].map((emoji) => <button key={emoji} onClick={() => { setMessage((value) => value + emoji); setEmojiOpen(false); }}>{emoji}</button>)}</div>}</div><div className="soyo-tool-popover-wrap"><button type="button" className="soyo-tool" onClick={() => { setGiftOpen(!giftOpen); setImageOpen(false); }}><Gift size={17} /> Gift</button>{giftOpen && <div className="soyo-popover soyo-gift-picker">{[["Rose", 10, "🌹"], ["Teddy", 50, "🧸"], ["Diamond", 100, "💎"]].map(([gift, cost, emoji]) => <button key={gift as string} onClick={() => sendGift(gift as string, cost as number)}><span>{emoji}</span><b>{gift}</b><small>{cost} coins</small></button>)}</div>}</div></div><form className="soyo-composer" onSubmit={sendText}><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Write ${active.name} a thoughtful message...`} /><button className="soyo-send" type="submit" aria-label="Send message"><Send size={18} /></button></form></div></section></div>{lowCoins > 0 && <LowCoinsModal needed={lowCoins} onClose={() => setLowCoins(0)} />}</div>;
}

function Wallet() {
  const [user, setUser] = useState<User>(() => ({ ...defaultUser, ...(getUser() || {}) }));
  const [paystackStatus, setPaystackStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [notice, setNotice] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [successPackage, setSuccessPackage] = useState<PaystackPackage | null>(null);
  const coins = Math.max(0, Number(user.coins ?? 0));
  const packages: PaystackPackage[] = [
    { id: "100coins", name: "Starter Spark", coins: 100, amount: 117000, price: 9, icon: "🎯", description: "Perfect to start! 💌 10 chats, 5 Super Likes ⭐, 2 gifts 🎁. Real African beauties near you!", features: ["10 Chats", "5 Super Likes", "2 Gifts"] },
    { id: "500coins", name: "Popular Love", coins: 500, amount: 169000, price: 13, icon: "❤️", badge: "MOST POPULAR", popular: true, description: "Bestseller! 🔥 Unlimited chats 7 days, 25 Super Likes, 10 gifts, 3 Boosts ⚡. 3x more matches!", features: ["Unlimited Chats · 7 days", "25 Super Likes", "10 Gifts", "3 Boosts"] },
    { id: "unlimited", name: "VIP Unlimited", coins: 99999, amount: 400000, price: 30.77, icon: "👑", badge: "UNLIMITED", isPremium: true, description: "VIP Couple! 💑❤️ Unlimited chats, likes, gifts, see who liked you 😍, Verified ✅", features: ["Unlimited Chats", "Super Likes & Boosts", "See Who Liked You", "VIP Verified Badge", "Priority Support"] },
  ];

  useEffect(() => {
    let active = true;
    const syncUser = () => { if (active) setUser({ ...defaultUser, ...(getUser() || {}) }); };
    window.addEventListener("storage", syncUser);
    window.addEventListener("couplehearts:coins", syncUser);
    return () => { active = false; window.removeEventListener("storage", syncUser); window.removeEventListener("couplehearts:coins", syncUser); };
  }, []);

  const showError = (message: string) => { setCheckoutError(message); setNotice(""); };
  const buy = async (pkg: PaystackPackage) => {
    try {
      setPaystackStatus("loading");
      if (!window.PaystackPop) await ensurePaystackScript();
      if (!window.PaystackPop) throw new Error("Paystack checkout is unavailable.");
      setPaystackStatus("ready");
      window.PaystackPop.setup({
        key: "pk_live_746fa4cd031258a58692b35c6f73e79ca330c873",
        email: user.email || "",
        amount: pkg.amount,
        currency: "KES",
        ref: `CH_${Date.now()}`,
        metadata: { coins: pkg.coins, package: pkg.id },
        onClose: () => setNotice("Checkout closed — your wallet is unchanged."),
        callback: () => {
          const current = getUser() || { ...defaultUser, ...user };
          const next: User = pkg.isPremium
            ? { ...current, coins: 99999, premium: true, premiumSince: Date.now(), coinsPurchasedAt: Date.now() }
            : { ...current, coins: Math.max(0, Number(current.coins ?? 0)) + pkg.coins, premium: Boolean(current.premium), coinsPurchasedAt: Date.now() };
          persistUser(next);
          setUser(next);
          setSuccessPackage(pkg);
          setNotice("");
        },
      }).openIframe();
    } catch {
      showError("We could not open Paystack right now. Please try again or use the secure fallback link below.");
    }
  };

  return <div className="page wallet-page paystack-wallet-page">
    <PageHeader eyebrow="A little extra magic" title="Your wallet 💰" description="More ways to make your intentions known." action={<div className="balance-chip"><CircleDollarSign size={16} /> {user.premium ? "VIP unlimited" : `${coins} coins`}</div>} />
    <div className="wallet-grid paystack-wallet-grid">
      <section className={`balance-card paystack-balance-card ${coins === 0 && !user.premium ? "balance-zero" : ""} ${user.premium ? "balance-premium" : ""}`}>
        <div className="balance-glow" />
        <div className="balance-card-top"><span className="wallet-icon"><CircleDollarSign size={21} /></span><span className="balance-label">Current balance</span>{user.premium && <span className="vip-wallet-badge"><Crown size={14} fill="currentColor" /> VIP</span>}<button className="icon-button light" aria-label="Wallet options"><MoreHorizontal size={18} /></button></div>
        <div className="balance-number">{user.premium ? "∞" : coins.toLocaleString()}</div>
        <div className="balance-caption">{user.premium ? "UNLIMITED ACCESS · VIP MEMBER" : coins === 0 ? "0 COINS · BUY A LITTLE MAGIC TO CONNECT 💔" : "COUPLE COINS · READY TO SPEND ON CONNECTION"}</div>
        {coins === 0 && !user.premium && <div className="wallet-zero-warning"><CircleDollarSign size={14} /> Your wallet is empty — choose a spark below.</div>}
        <div className="balance-card-foot"><span><span className="live-dot" /> {user.premium ? "VIP wallet active" : "Your wallet is active"}</span><span className="wallet-secure-foot"><Lock size={12} /> Secure Paystack checkout</span></div>
      </section>

      <section className="wallet-section paystack-packages-section">
        <div className="section-heading"><div><p className="eyebrow">Choose your energy</p><h2>Pick your perfect package</h2></div><span className={`secure-label paystack-status-${paystackStatus}`}><Lock size={13} /> {paystackStatus === "ready" ? "Secure checkout" : "Preparing checkout"}</span></div>
        <div className="paystack-packages">{packages.map((pkg) => <article key={pkg.id} className={`wallet-package-card ${pkg.popular ? "is-popular" : ""} ${pkg.isPremium ? "is-vip" : ""}`}>
          {pkg.badge && <span className="wallet-package-badge">{pkg.badge}</span>}
          <div className="wallet-package-icon" aria-hidden="true">{pkg.icon}</div><h3>{pkg.name}</h3><div className="wallet-package-price"><strong>KSH {Math.round(pkg.amount / 100).toLocaleString()}</strong><span className="usd-equivalent">≈ ${pkg.price.toFixed(2)} USD</span></div><p>{pkg.description}</p><div className="wallet-package-coins"><CircleDollarSign size={16} /> {pkg.isPremium ? "Unlimited coins" : `${pkg.coins.toLocaleString()} coins`}</div><ul>{pkg.features.map((feature) => <li key={feature}><Check size={15} /> <span>{feature}</span></li>)}</ul><button className="wallet-buy-button" type="button" onClick={() => buy(pkg)}>{pkg.isPremium ? `Unlock VIP access · KSH ${Math.round(pkg.amount / 100).toLocaleString()}` : `Buy ${pkg.name} · KSH ${Math.round(pkg.amount / 100).toLocaleString()}`} <ArrowRight size={16} /></button>
        </article>)}</div>
        <p className="paystack-note">💡 No redirect — secure KSH checkout via Paystack. M-Pesa &amp; Cards accepted. Theme matches Couple Hearts❤️</p>
        <a className={`paystack-fallback-link ${checkoutError ? "visible" : ""}`} href="https://paystack.shop/pay/o2dkau16m7" target="_blank" rel="noreferrer">Use secure fallback checkout</a>
      </section>

      <section className="wallet-section perks-section"><div className="section-heading"><div><p className="eyebrow">Spend them on</p><h2>Little gestures, big energy</h2></div></div><div className="perk-grid"><Perk icon={<Zap size={19} />} title="Boost" value="100 coins" description="Be seen by more compatible people." premium={false} /><Perk icon={<Star size={19} />} title="Super like" value="20 coins" description="Let someone know they really caught your eye." /><Perk icon={<Crown size={19} />} title="Premium" value="$6.99 / month" description="Unlimited likes, rewind, and no ads." premium /></div></section>
      <section className="payment-card"><div className="payment-icon"><CreditCard size={20} /></div><div><p className="eyebrow">Simple &amp; secure</p><h3>Pay the way that feels easy.</h3><p>Cards, Paystack, and M-Pesa are all welcome here.</p></div><ChevronRight size={18} /></section>
    </div>
    {notice && <motion.div className="toast wallet-toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Check size={16} /> {notice}</motion.div>}
    {checkoutError && <div className="modal-backdrop" onClick={() => setCheckoutError("")}><motion.div className="utility-modal wallet-error-modal" initial={{ opacity: 0, scale: .95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setCheckoutError("")} aria-label="Close"><X size={18} /></button><div className="utility-icon gold"><CreditCard size={25} /></div><p className="eyebrow">One tiny hiccup</p><h2>Paystack needs another try</h2><p>{checkoutError}</p><a className="primary-button" href="https://paystack.shop/pay/o2dkau16m7" target="_blank" rel="noreferrer">Use fallback checkout <ArrowRight size={17} /></a><button className="text-link keep-swiping" onClick={() => setCheckoutError("")}>Try again</button></motion.div></div>}
    {successPackage && <div className="modal-backdrop" onClick={() => setSuccessPackage(null)}><motion.div className="utility-modal wallet-success-modal" initial={{ opacity: 0, scale: .95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}><div className="confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--i": index } as React.CSSProperties} />)}</div><div className="utility-icon rose">{successPackage.isPremium ? <Crown size={25} fill="currentColor" /> : <Check size={25} />}</div><p className="eyebrow">Payment confirmed</p><h2>{successPackage.isPremium ? "Welcome to VIP Unlimited!" : "Your wallet just got brighter!"}</h2><p>{successPackage.isPremium ? "Your Couple Hearts account now has unlimited access and a VIP verified badge." : `${successPackage.coins.toLocaleString()} coins are ready for your next conversation.`}</p><button className="primary-button" onClick={() => setSuccessPackage(null)}>Keep connecting <Heart size={17} fill="currentColor" /></button></motion.div></div>}
  </div>;
}
function Perk({ icon, title, value, description, premium = false }: { icon: ReactNode; title: string; value: string; description: string; premium?: boolean }) { return <article className="perk-card"><div className={premium ? "perk-icon premium-icon" : "perk-icon"}>{icon}</div><div><div className="perk-name"><h3>{title}</h3>{premium && <Crown size={14} fill="currentColor" />}</div><strong>{value}</strong><p>{description}</p></div><button className="round-arrow"><ArrowRight size={15} /></button></article>; }
function Protected({ children }: { children: ReactNode }) { const [, navigate] = useLocation(); const user = getUser(); useEffect(() => { if (!user) navigate("/login"); }, [navigate, user]); return user ? <Layout>{children}</Layout> : null; }
function RootRedirect() { const [, navigate] = useLocation(); useEffect(() => { navigate(getUser() ? "/dashboard" : "/login"); }, [navigate]); return null; }
export default function App() { return <Switch><Route path="/" component={RootRedirect} /><Route path="/login" component={Login} /><Route path="/register" component={Register} /><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/matches"><Protected><Matches /></Protected></Route><Route path="/chats"><Protected><Chats /></Protected></Route><Route path="/wallet"><Protected><Wallet /></Protected></Route><Route><RootRedirect /></Route></Switch>; }
