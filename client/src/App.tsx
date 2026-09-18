import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, Route, Switch, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Crown,
  Eye,
  EyeOff,
  Gift,
  Heart,
  HeartHandshake,
  ImagePlus,
  Lock,
  MapPin,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  UsersRound,
  WalletCards,
  X,
  Zap,
} from "lucide-react";

const profileImages = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=86",
  "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=86",
];

const profiles = [
  { name: "Sophia", age: 24, city: "Barcelona", distance: "3 km", role: "Artist", bio: "Chasing sunlight, making things with my hands, and finding the best cortado in town.", tags: ["Coffee", "Gallery dates", "Surfing"], verified: true, image: profileImages[0], match: 96 },
  { name: "Mateo", age: 27, city: "Barcelona", distance: "5 km", role: "Architect", bio: "I collect ceramics, playlists, and restaurant recommendations. Tell me your current favorite.", tags: ["Design", "Foodie", "Vinyl"], verified: true, image: profileImages[1], match: 92 },
  { name: "Ava", age: 25, city: "Gràcia", distance: "8 km", role: "Photographer", bio: "Soft mornings, loud laughs, and a camera roll full of tiny adventures.", tags: ["Film", "Travel", "Dogs"], verified: false, image: profileImages[2], match: 89 },
  { name: "Leo", age: 29, city: "El Born", distance: "10 km", role: "Chef", bio: "Will cook you pasta and let you pick the playlist. Usually in that order.", tags: ["Cooking", "Jazz", "Plants"], verified: true, image: profileImages[3], match: 87 },
];

const matches = [
  { name: "Sophia", role: "Artist", match: 96, image: profileImages[0], status: "New match" },
  { name: "Mateo", role: "Architect", match: 92, image: profileImages[1], status: "Active 2h ago" },
  { name: "Ava", role: "Photographer", match: 89, image: profileImages[2], status: "Active now" },
  { name: "Nora", role: "Stylist", match: 88, image: profileImages[4], status: "New match" },
  { name: "Leo", role: "Chef", match: 87, image: profileImages[3], status: "Active yesterday" },
  { name: "Maya", role: "Curator", match: 84, image: profileImages[6], status: "Active 1h ago" },
];

const chats = [
  { name: "Sophia", preview: "A walk through El Born sounds perfect ✨", time: "2m", unread: 2, image: profileImages[0], online: true },
  { name: "Ava", preview: "You: That film festival is on my list!", time: "1h", unread: 0, image: profileImages[2], online: true },
  { name: "Mateo", preview: "I know a little place with the best tacos.", time: "3h", unread: 1, image: profileImages[1], online: false },
  { name: "Nora", preview: "The vintage market on Sunday?", time: "Yesterday", unread: 0, image: profileImages[4], online: false },
];

const userKey = "couplehearts_user";
const getUser = () => {
  try { return JSON.parse(localStorage.getItem(userKey) || "null"); } catch { return null; }
};

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className={compact ? "brand brand-compact" : "brand"}><span className="brand-mark">💑</span><span>Couple Hearts<span className="brand-heart">♥</span></span></div>;
}

function Pill({ children, tone = "rose" }: { children: ReactNode; tone?: "rose" | "green" | "purple" | "gold" }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

function AuthShell({ children, eyebrow, title, subtitle, sideTitle }: { children: ReactNode; eyebrow: string; title: string; subtitle: string; sideTitle: string }) {
  return <div className="auth-shell">
    <section className="auth-visual">
      <div className="auth-visual-glow" />
      <div className="auth-visual-inner">
        <Logo />
        <div className="auth-copy">
          <p className="eyebrow eyebrow-light">{eyebrow}</p>
          <h2>{sideTitle}</h2>
          <p>Slow down, be curious, and find your person in the little things.</p>
          <div className="couple-orbit" aria-hidden="true"><span>♡</span><span>♡</span><div className="orbit-line" /></div>
          <div className="auth-proof"><div className="avatar-stack"><img src={profileImages[0]} /><img src={profileImages[2]} /><img src={profileImages[4]} /></div><span><strong>12k+</strong> couples matched today</span></div>
        </div>
        <p className="auth-footnote">Made for meaningful connections <span>♥</span></p>
      </div>
    </section>
    <section className="auth-panel">
      <div className="auth-panel-inner">
        <div className="auth-mobile-logo"><Logo /></div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="auth-subtitle">{subtitle}</p>
        {children}
      </div>
    </section>
  </div>;
}

function Login() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const demo = () => { setEmail("demo@couplehearts.com"); setPassword("123456"); setError(""); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || password.length < 6) { setError("Please enter an email and a password with 6+ characters."); return; }
    const existing = getUser();
    const next = existing?.email === email ? existing : { email, name: email.split("@")[0] === "demo" ? "Alex" : "Lovely human", coins: 1200 };
    localStorage.setItem(userKey, JSON.stringify(next));
    navigate("/dashboard");
  };
  return <AuthShell eyebrow="Welcome back" title="Welcome back 🥰" subtitle="Your next great conversation might be one sign-in away." sideTitle="Find your couple.">
    <form className="auth-form" onSubmit={submit}>
      <label>Email address<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" /></label>
      <label>Password<div className="input-with-action"><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="••••••••" /><button type="button" className="input-action" onClick={() => setShowPassword(!showPassword)} aria-label="Toggle password visibility">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
      <div className="form-row"><label className="checkbox-label"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span>Remember me</span></label><button type="button" className="text-link">Forgot password?</button></div>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit">Sign in <Heart size={17} fill="currentColor" /></button>
      <button className="demo-button" type="button" onClick={demo}><span>🎯</span> Try demo account</button>
      <div className="divider"><span>or continue with</span></div>
      <div className="social-row"><button type="button" className="social-button"><span className="google-g">G</span> Google</button><button type="button" className="social-button"><span className="apple-mark">●</span> Apple</button></div>
      <p className="auth-switch">No account yet? <Link href="/register">Join Couple Hearts <span>💑</span></Link></p>
    </form>
  </AuthShell>;
}

function Register() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", age: "", gender: "", password: "", confirm: "" });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const update = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.age || !form.gender || form.password.length < 6 || form.password !== form.confirm || !agreed) { setError("Complete the fields, match your passwords, and agree to the terms."); return; }
    localStorage.setItem(userKey, JSON.stringify({ email: form.email, name: form.name, coins: 1200 }));
    navigate("/dashboard");
  };
  return <AuthShell eyebrow="Start something real" title="Create your account 🚀" subtitle="A few details, then the fun part: meeting someone lovely." sideTitle="Meet with intention.">
    <form className="auth-form register-form" onSubmit={submit}>
      <div className="register-grid"><label>Full name<input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Alex Morgan" /></label><label>Email<input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" placeholder="you@example.com" /></label><label>Age<select value={form.age} onChange={(e) => update("age", e.target.value)}><option value="">Select age</option>{Array.from({ length: 43 }, (_, i) => <option key={i + 18}>{i + 18}</option>)}</select></label><label>Gender<select value={form.gender} onChange={(e) => update("gender", e.target.value)}><option value="">Choose one</option><option>Female</option><option>Male</option><option>Other</option></select></label></div>
      <label>Password<input value={form.password} onChange={(e) => update("password", e.target.value)} type="password" placeholder="6+ characters" /></label><label>Confirm password<input value={form.confirm} onChange={(e) => update("confirm", e.target.value)} type="password" placeholder="Repeat your password" /></label>
      <button type="button" className="upload-zone"><span className="upload-icon"><ImagePlus size={20} /></span><span><strong>Add a profile photo</strong><small>Add 2+ photos = 3x more matches 📸</small></span><ChevronRight size={17} /></button>
      <label className="checkbox-label terms"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} /><span>I agree to the <button type="button" className="text-link">Couple Hearts Terms</button> 💑</span></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button" type="submit">Create Couple Account <ArrowRight size={17} /></button>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </form>
  </AuthShell>;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Sparkles },
  { href: "/matches", label: "Matches", icon: Heart, badge: "12" },
  { href: "/chats", label: "Chats", icon: MessageCircle, badge: "3" },
  { href: "/wallet", label: "Wallet", icon: WalletCards },
];

function Layout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = getUser() || { name: "Alex", email: "demo@couplehearts.com", coins: 1200 };
  const logout = () => { localStorage.removeItem(userKey); navigate("/login"); };
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div><div className="sidebar-top"><Logo compact /><button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={18} /></button></div><p className="sidebar-kicker">YOUR LOVE STORY, ON YOUR TERMS</p><nav className="sidebar-nav">{navItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={location === item.href ? "nav-item active" : "nav-item"}><Icon size={18} /><span>{item.label}</span>{item.badge && <span className="nav-badge">{item.badge}</span>}{item.href === "/wallet" && <span className="coin-count">{(user.coins || 1200).toLocaleString()}<CircleDollarSign size={13} /></span>}</Link>; })}</nav></div>
      <div className="sidebar-bottom"><div className="sidebar-tip"><Sparkles size={15} /><span><strong>Profile boost</strong><small>Get seen by more lovely people.</small></span><ChevronRight size={14} /></div><div className="user-card"><div className="avatar avatar-small"><img src={profileImages[5]} /><span className="online-dot" /></div><div className="user-meta"><strong>{user.name || "Alex"}</strong><small>Online now</small></div><button className="icon-button"><Settings size={17} /></button></div><button className="sign-out" onClick={logout}><ArrowRight size={16} /> Sign out</button></div>
    </aside>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <main className="main-content"><header className="mobile-header"><button className="icon-button" onClick={() => setMobileOpen(true)}><Menu size={21} /></button><Logo compact /><button className="icon-button"><Bell size={19} /></button></header>{children}</main>
    <nav className="mobile-nav">{navItems.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className={location === item.href ? "mobile-nav-item active" : "mobile-nav-item"}><Icon size={19} /><span>{item.label}</span></Link>; })}</nav>
  </div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="page-description">{description}</p></div>{action}</div>;
}

function Dashboard() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [matchOpen, setMatchOpen] = useState(false);
  const current = profiles[index % profiles.length];
  const next = () => { setDirection(1); setIndex((value) => value + 1); };
  const action = (kind: "pass" | "like" | "super") => { setDirection(kind === "pass" ? -1 : 1); if (kind !== "pass" && (index % 3 === 0 || kind === "super")) setMatchOpen(true); setIndex((value) => value + 1); };
  return <div className="page dashboard-page"><PageHeader eyebrow="Tuesday, September 18" title="Discover couples 💑" description="A little serendipity, curated just for you." action={<div className="header-actions"><button className="ghost-button"><SlidersIcon /> Filters</button><button className="premium-button"><Crown size={16} fill="currentColor" /> Go premium · $6.99</button></div>} />
    <div className="discover-layout"><section className="discover-stage"><div className="stage-label"><span><span className="live-dot" /> Curated for Alex</span><span>{index + 1} of 10</span></div><div className="card-stack"><div className="back-card back-card-two" /><div className="back-card back-card-one" /><AnimatePresence mode="popLayout"><motion.article key={`${current.name}-${index}`} className="swipe-card" initial={{ opacity: 0, x: direction * 60, rotate: direction * 5 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={{ opacity: 0, x: direction * -380, rotate: direction * -18 }} transition={{ duration: .3, ease: [0.23, 1, .32, 1] }} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 90) action(info.offset.x > 0 ? "like" : "pass"); }}><img src={current.image} alt={current.name} /><div className="card-overlay" /><div className="card-content"><div className="profile-topline">{current.verified && <span className="verified-badge"><ShieldCheck size={13} /> Verified</span>}<span className="profile-match">{current.match}% match</span></div><div><h2>{current.name}, <span>{current.age}</span></h2><p className="profile-location"><MapPin size={14} /> {current.city} <span>·</span> {current.distance} away</p><p className="profile-bio">{current.bio}</p><div className="profile-tags">{current.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div></motion.article></AnimatePresence></div><div className="swipe-actions"><button className="swipe-action pass" onClick={() => action("pass")} aria-label="Pass"><X size={25} /></button><button className="swipe-action super" onClick={() => action("super")} aria-label="Super like"><Star size={22} fill="currentColor" /></button><button className="swipe-action like" onClick={() => action("like")} aria-label="Like"><Heart size={30} fill="currentColor" /></button><button className="swipe-action boost" onClick={next} aria-label="Boost"><Zap size={20} fill="currentColor" /></button></div><p className="swipe-hint"><span>←</span> Swipe to explore <span>→</span></p></section><aside className="discover-aside"><div className="aside-card mini-profile"><div className="mini-profile-head"><div><p className="eyebrow">Your profile</p><h3>Looking lovely, Alex.</h3></div><button className="icon-button"><MoreHorizontal size={18} /></button></div><div className="profile-completion"><div className="completion-ring"><span>74%</span></div><div><strong>Almost there</strong><p>Add one more photo to stand out.</p><button className="text-link">Complete profile <ArrowRight size={13} /></button></div></div></div><div className="aside-card intention-card"><div className="intention-icon"><HeartHandshake size={18} /></div><div><p className="eyebrow">Today’s intention</p><h3>Be open to a plot twist.</h3><p>Great connections rarely look exactly like the plan.</p></div></div><div className="aside-card match-teaser"><div className="teaser-top"><p className="eyebrow">Your week in love</p><span className="trend"><ArrowRight size={13} /> 18%</span></div><div className="teaser-stat"><strong>12</strong><span>new possibilities<br />this week</span></div><div className="tiny-avatars">{profileImages.slice(0, 5).map((src, i) => <img key={src} src={src} style={{ zIndex: 5 - i }} />)}<span>+7</span></div></div></aside></div>
    {matchOpen && <MatchModal profile={current} onClose={() => setMatchOpen(false)} />}
  </div>;
}

function SlidersIcon() { return <span className="sliders-icon"><i /><i /><i /></span>; }

function MatchModal({ profile, onClose }: { profile: typeof profiles[number]; onClose: () => void }) {
  return <div className="modal-backdrop" onClick={onClose}><motion.div className="match-modal" initial={{ opacity: 0, scale: .94, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} onClick={(event) => event.stopPropagation()}><div className="confetti">{Array.from({ length: 18 }, (_, i) => <span key={i} style={{ ["--i" as string]: i } as React.CSSProperties} />)}</div><button className="modal-close" onClick={onClose}><X size={18} /></button><div className="match-hearts"><Heart size={28} fill="currentColor" /><Heart size={42} fill="currentColor" /><Heart size={28} fill="currentColor" /></div><p className="eyebrow">It’s a match</p><h2>You & {profile.name} are a couple! 💑❤️</h2><p>That little spark is mutual. Start with something easy and make it yours.</p><div className="match-people"><div><img src={profileImages[5]} /><span>Alex</span></div><Heart size={18} fill="currentColor" /><div><img src={profile.image} /><span>{profile.name}</span></div></div><Link href="/chats" className="primary-button" onClick={onClose}>Chat now <MessageCircle size={17} /></Link><button className="text-link keep-swiping" onClick={onClose}>Keep swiping</button></motion.div></div>;
}

function Matches() {
  const [tab, setTab] = useState("All");
  const tabs = ["All", "New", "Liked you"];
  return <div className="page"><PageHeader eyebrow="The good stuff" title="Your matches ❤️" description="People who make your heart do that little skip." action={<button className="ghost-button"><Search size={17} /> Discover more</button>} /><div className="tabs-row">{tabs.map((item) => <button key={item} className={tab === item ? "tab active" : "tab"} onClick={() => setTab(item)}>{item}{item === "New" && <span>4</span>}</button>)}</div><div className="matches-grid">{matches.map((match, i) => <motion.article key={match.name} className="match-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .05 }}><div className="match-image-wrap"><img src={match.image} alt={match.name} /><div className="match-image-gradient" /><span className="percent-badge">{match.match}% match</span><button className="match-card-menu"><MoreHorizontal size={17} /></button><div className="match-card-info"><h3>{match.name}</h3><p>{match.role}</p></div></div><div className="match-card-footer"><span className={match.status === "New match" ? "status-new" : "status-muted"}>{match.status === "Active now" && <span className="live-dot" />}{match.status}</span><Link href="/chats" className="round-message"><MessageCircle size={16} /></Link></div></motion.article>)}<article className="premium-lock-card"><div className="lock-orbit"><Lock size={22} /></div><p className="eyebrow">A little mystery</p><h3>See who already likes you.</h3><p>Unlock your admirers and let the good energy find you faster.</p><button className="premium-button"><Crown size={15} fill="currentColor" /> Unlock with premium</button></article></div></div>;
}

function Chats() {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string[]>([]);
  const active = chats[selected];
  const send = (event: React.FormEvent) => { event.preventDefault(); if (message.trim()) { setSent((current) => [...current, message.trim()]); setMessage(""); } };
  return <div className="page chats-page"><PageHeader eyebrow="Good conversations" title="Your chats 🥰" description="Keep the spark going, one message at a time." action={<button className="ghost-button"><UsersRound size={17} /> New connection</button>} /><div className="chat-layout"><aside className="chat-list"><div className="chat-search"><Search size={16} /><input placeholder="Search chats" /></div><div className="chat-list-head"><span>Messages</span><span>{chats.filter((chat) => chat.unread).length} unread</span></div>{chats.map((chat, i) => <button key={chat.name} className={selected === i ? "chat-preview selected" : "chat-preview"} onClick={() => setSelected(i)}><div className="avatar"><img src={chat.image} /><span className={chat.online ? "online-dot" : "online-dot offline"} /></div><div className="chat-preview-copy"><div><strong>{chat.name}</strong><span>{chat.time}</span></div><p>{chat.preview}</p></div>{chat.unread > 0 && <span className="unread-badge">{chat.unread}</span>}</button>)}<div className="chat-list-bottom"><Sparkles size={16} /><span>Tip: ask about something in their profile.</span></div></aside><section className="conversation"><header className="conversation-head"><div className="conversation-person"><div className="avatar"><img src={active.image} /><span className={active.online ? "online-dot" : "online-dot offline"} /></div><div><h3>{active.name}</h3><p>{active.online ? "Online now" : "Last seen today"}</p></div></div><div className="conversation-actions"><button className="icon-button"><Bell size={18} /></button><button className="icon-button"><MoreHorizontal size={18} /></button></div></header><div className="conversation-body"><div className="day-divider"><span>Today</span></div><div className="message-row theirs"><img src={active.image} /><div><div className="bubble"><p>Hey Alex! Your profile has such a good energy.</p></div><small>10:24 AM</small></div></div><div className="message-row mine"><div><div className="bubble"><p>That’s the loveliest thing to hear. Yours made me smile too ✨</p></div><small>10:26 AM <Check size={13} /></small></div></div><div className="message-row theirs"><img src={active.image} /><div><div className="bubble"><p>{active.name === "Sophia" ? "A walk through El Born sounds perfect ✨" : "What’s something you’re excited about this week?"}</p></div><small>10:27 AM</small></div></div>{sent.map((text, i) => <div className="message-row mine" key={`${text}-${i}`}><div><div className="bubble"><p>{text}</p></div><small>Just now <Check size={13} /></small></div></div>)}</div><div className="composer-wrap"><div className="gift-options"><button><Gift size={15} /> Send a little gift</button><span><b>Rose</b> 10</span><span><b>Teddy</b> 50</span><span><b>Diamond</b> 100</span></div><form className="composer" onSubmit={send}><button type="button" className="composer-action"><Gift size={19} /></button><input value={message} onChange={(e) => setMessage(e.target.value)} placeholder={`Write ${active.name} a thoughtful message...`} /><button className="send-button" type="submit"><Send size={17} /></button></form></div></section></div></div>;
}

function Wallet() {
  const [coins, setCoins] = useState(1200);
  const [notice, setNotice] = useState("");
  const packages = [{ coins: 100, price: "$2", label: "A little boost" }, { coins: 500, price: "$8", label: "Most loved", popular: true }, { coins: 1200, price: "$15", label: "Best value" }];
  const buy = (pack: typeof packages[number]) => { setCoins((current) => current + pack.coins); setNotice(`${pack.coins.toLocaleString()} coins added to your wallet.`); setTimeout(() => setNotice(""), 2600); };
  return <div className="page wallet-page"><PageHeader eyebrow="A little extra magic" title="Your wallet 💰" description="More ways to make your intentions known." action={<div className="balance-chip"><CircleDollarSign size={16} /> {coins.toLocaleString()} coins</div>} /><div className="wallet-grid"><section className="balance-card"><div className="balance-glow" /><div className="balance-card-top"><span className="wallet-icon"><CircleDollarSign size={21} /></span><span className="balance-label">Current balance</span><button className="icon-button light"><MoreHorizontal size={18} /></button></div><div className="balance-number">{coins.toLocaleString()}</div><div className="balance-caption">COUPLE COINS <span>·</span> Ready to spend on connection</div><div className="balance-card-foot"><span><span className="live-dot" /> Your wallet is active</span><button className="light-text-button">Transaction history <ArrowRight size={14} /></button></div></section><section className="wallet-section"><div className="section-heading"><div><p className="eyebrow">Choose your energy</p><h2>Top up coins</h2></div><span className="secure-label"><Lock size={13} /> Secure checkout</span></div><div className="coin-packages">{packages.map((pack) => <button key={pack.coins} className={pack.popular ? "coin-package popular" : "coin-package"} onClick={() => buy(pack)}>{pack.popular && <span className="popular-label">Popular</span>}<span className="coin-symbol">◉</span><strong>{pack.coins.toLocaleString()}</strong><span>coins</span><b>{pack.price}</b><small>{pack.label}</small></button>)}</div></section><section className="wallet-section perks-section"><div className="section-heading"><div><p className="eyebrow">Spend them on</p><h2>Little gestures, big energy</h2></div></div><div className="perk-grid"><Perk icon={<Zap size={19} />} title="Boost" value="100 coins" description="Be seen by more compatible people." /><Perk icon={<Star size={19} />} title="Super like" value="20 coins" description="Let someone know they really caught your eye." /><Perk icon={<Crown size={19} />} title="Premium" value="$6.99 / month" description="Unlimited likes, rewind, and no ads." premium /></div></section><section className="payment-card"><div className="payment-icon"><CreditCard size={20} /></div><div><p className="eyebrow">Simple & secure</p><h3>Pay the way that feels easy.</h3><p>Cards, Paystack, and M-Pesa are all welcome here.</p></div><button className="icon-button"><ChevronRight size={18} /></button></section></div>{notice && <motion.div className="toast" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Check size={16} /> {notice}</motion.div>}</div>;
}

function Perk({ icon, title, value, description, premium = false }: { icon: ReactNode; title: string; value: string; description: string; premium?: boolean }) {
  return <article className="perk-card"><div className={premium ? "perk-icon premium-icon" : "perk-icon"}>{icon}</div><div><div className="perk-name"><h3>{title}</h3>{premium && <Crown size={14} fill="currentColor" />}</div><strong>{value}</strong><p>{description}</p></div><button className="round-arrow"><ArrowRight size={15} /></button></article>;
}

function Protected({ children }: { children: ReactNode }) {
  const [, navigate] = useLocation();
  const user = getUser();
  useEffect(() => { if (!user) navigate("/login"); }, [navigate, user]);
  return user ? <Layout>{children}</Layout> : null;
}

function RootRedirect() { const [, navigate] = useLocation(); useEffect(() => { navigate(getUser() ? "/dashboard" : "/login"); }, [navigate]); return null; }

export default function App() {
  return <Switch><Route path="/" component={RootRedirect} /><Route path="/login" component={Login} /><Route path="/register" component={Register} /><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/matches"><Protected><Matches /></Protected></Route><Route path="/chats"><Protected><Chats /></Protected></Route><Route path="/wallet"><Protected><Wallet /></Protected></Route><Route><RootRedirect /></Route></Switch>;
}
