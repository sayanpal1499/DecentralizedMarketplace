"use client";

import { useState, useCallback, useEffect } from "react";
import {
  createListing,
  buyListing,
  cancelListing,
  getListing,
  getListingCount,
  getFeePercent,
  getAdmin,
  CONTRACT_ADDRESS,
} from "@/hooks/contract";
import { AnimatedCard } from "@/components/ui/animated-card";
import { Spotlight } from "@/components/ui/spotlight";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ── Icons ────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 10 10" />
      <path d="M6 7V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7" />
      <path d="M6 7h8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r=".5" fill="currentColor" />
    </svg>
  );
}

// ── Styled Input ─────────────────────────────────────────────

function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <input
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none"
        />
      </div>
    </div>
  );
}

function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium uppercase tracking-wider text-white/30">
        {label}
      </label>
      <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-px transition-all focus-within:border-[#7c6cf0]/30 focus-within:shadow-[0_0_20px_rgba(124,108,240,0.08)]">
        <textarea
          {...props}
          className="w-full rounded-[11px] bg-transparent px-4 py-3 font-mono text-sm text-white/90 placeholder:text-white/15 outline-none resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}

// ── Method Signature ─────────────────────────────────────────

function MethodSignature({
  name,
  params,
  returns,
  color,
}: {
  name: string;
  params: string;
  returns?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-4 py-3 font-mono text-sm">
      <span style={{ color }} className="font-semibold">fn</span>
      <span className="text-white/70">{name}</span>
      <span className="text-white/20 text-xs">{params}</span>
      {returns && (
        <span className="ml-auto text-white/15 text-[10px]">{returns}</span>
      )}
    </div>
  );
}

// ── Status Config ────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; variant: "success" | "warning" | "info" | "error" }> = {
  Active: { color: "text-[#34d399]", bg: "bg-[#34d399]/10", border: "border-[#34d399]/20", dot: "bg-[#34d399]", variant: "success" },
  Sold: { color: "text-[#fbbf24]", bg: "bg-[#fbbf24]/10", border: "border-[#fbbf24]/20", dot: "bg-[#fbbf24]", variant: "warning" },
  Cancelled: { color: "text-[#f87171]", bg: "bg-[#f87171]/10", border: "border-[#f87171]/20", dot: "bg-[#f87171]", variant: "error" },
};

// ── Types ────────────────────────────────────────────────────

type ListingStatus = "Active" | "Sold" | "Cancelled";

interface Listing {
  id: number;
  seller: string;
  title: string;
  description: string;
  price: string;
  token_address: string;
  status: ListingStatus;
  created_at: number;
}

// ── Main Component ───────────────────────────────────────────

type Tab = "browse" | "create" | "manage";

interface ContractUIProps {
  walletAddress: string | null;
  onConnect: () => void;
  isConnecting: boolean;
}

export default function ContractUI({ walletAddress, onConnect, isConnecting }: ContractUIProps) {
  const [activeTab, setActiveTab] = useState<Tab>("browse");
  const [error, setError] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);

  // Create listing state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tokenAddress, setTokenAddress] = useState("CDLQXF5DHPZCNTZQ5K5NW3STU2XIDQNRK2VJES4IBJ2K7J3VT2JJ4M3B"); // Default XLM
  const [isCreating, setIsCreating] = useState(false);

  // Browse state
  const [browseId, setBrowseId] = useState("");
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [listing, setListing] = useState<Listing | null>(null);
  const [listingCount, setListingCount] = useState<number>(0);

  // Buy/Cancel state
  const [buyId, setBuyId] = useState("");
  const [isBuying, setIsBuying] = useState(false);
  const [cancelId, setCancelId] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Fee info
  const [feePercent, setFeePercent] = useState<number>(0);
  const [admin, setAdmin] = useState<string | null>(null);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatPrice = (priceStr: string) => {
    try {
      const price = BigInt(priceStr);
      return (Number(price) / 10000000).toFixed(2);
    } catch {
      return priceStr;
    }
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const count = await getListingCount();
        setListingCount(Number(count) || 0);
        const fee = await getFeePercent();
        setFeePercent(Number(fee) || 0);
        const adm = await getAdmin();
        setAdmin(adm);
      } catch (e) {
        console.error("Failed to load initial data:", e);
      }
    }
    loadData();
  }, []);

  const handleCreateListing = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!title.trim() || !description.trim() || !price || !tokenAddress.trim()) {
      return setError("Fill in all fields");
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) return setError("Invalid price");
    
    setError(null);
    setIsCreating(true);
    setTxStatus("Awaiting signature...");
    try {
      const priceInStroops = BigInt(Math.floor(priceNum * 10000000));
      await createListing(
        walletAddress,
        walletAddress,
        title.trim(),
        description.trim(),
        priceInStroops,
        tokenAddress.trim()
      );
      setTxStatus("Listing created on-chain!");
      setTitle("");
      setDescription("");
      setPrice("");
      setTimeout(() => setTxStatus(null), 5000);
      // Refresh count
      const count = await getListingCount();
      setListingCount(Number(count) || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCreating(false);
    }
  }, [walletAddress, title, description, price, tokenAddress]);

  const handleBrowseListing = useCallback(async () => {
    if (!browseId.trim()) return setError("Enter a listing ID");
    setError(null);
    setIsBrowsing(true);
    setListing(null);
    try {
      const result = await getListing(BigInt(browseId.trim()));
      if (result && typeof result === "object") {
        setListing(result as unknown as Listing);
      } else {
        setError("Listing not found");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Query failed");
    } finally {
      setIsBrowsing(false);
    }
  }, [browseId]);

  const handleBuyListing = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!buyId.trim()) return setError("Enter a listing ID");
    setError(null);
    setIsBuying(true);
    setTxStatus("Awaiting signature...");
    try {
      await buyListing(walletAddress, walletAddress, BigInt(buyId.trim()));
      setTxStatus("Purchase complete!");
      setBuyId("");
      setTimeout(() => setTxStatus(null), 5000);
      // Refresh listing if same
      if (listing && BigInt(buyId) === BigInt(listing.id)) {
        const result = await getListing(BigInt(listing.id));
        if (result) setListing(result as unknown as Listing);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsBuying(false);
    }
  }, [walletAddress, buyId, listing]);

  const handleCancelListing = useCallback(async () => {
    if (!walletAddress) return setError("Connect wallet first");
    if (!cancelId.trim()) return setError("Enter a listing ID");
    setError(null);
    setIsCancelling(true);
    setTxStatus("Awaiting signature...");
    try {
      await cancelListing(walletAddress, walletAddress, BigInt(cancelId.trim()));
      setTxStatus("Listing cancelled!");
      setCancelId("");
      setTimeout(() => setTxStatus(null), 5000);
      // Refresh listing if same
      if (listing && BigInt(cancelId) === BigInt(listing.id)) {
        const result = await getListing(BigInt(listing.id));
        if (result) setListing(result as unknown as Listing);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setTxStatus(null);
    } finally {
      setIsCancelling(false);
    }
  }, [walletAddress, cancelId, listing]);

  const tabs: { key: Tab; label: string; icon: React.ReactNode; color: string }[] = [
    { key: "browse", label: "Browse", icon: <SearchIcon />, color: "#4fc3f7" },
    { key: "create", label: "Sell", icon: <PlusIcon />, color: "#7c6cf0" },
    { key: "manage", label: "Manage", icon: <StoreIcon />, color: "#fbbf24" },
  ];

  const isAdmin = admin && walletAddress && admin.toLowerCase() === walletAddress.toLowerCase();

  return (
    <div className="w-full max-w-2xl animate-fade-in-up-delayed">
      {/* Toasts */}
      {error && (
        <div className="mb-4 flex items-start gap-3 rounded-xl border border-[#f87171]/15 bg-[#f87171]/[0.05] px-4 py-3 backdrop-blur-sm animate-slide-down">
          <span className="mt-0.5 text-[#f87171]"><AlertIcon /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#f87171]/90">Error</p>
            <p className="text-xs text-[#f87171]/50 mt-0.5 break-all">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="shrink-0 text-[#f87171]/30 hover:text-[#f87171]/70 text-lg leading-none">&times;</button>
        </div>
      )}

      {txStatus && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.05] px-4 py-3 backdrop-blur-sm shadow-[0_0_30px_rgba(52,211,153,0.05)] animate-slide-down">
          <span className="text-[#34d399]">
            {txStatus.includes("complete") || txStatus.includes("created") || txStatus.includes("cancelled") ? <CheckIcon /> : <SpinnerIcon />}
          </span>
          <span className="text-sm text-[#34d399]/90">{txStatus}</span>
        </div>
      )}

      {/* Main Card */}
      <Spotlight className="rounded-2xl">
        <AnimatedCard className="p-0" containerClassName="rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#7c6cf0]/20 to-[#4fc3f7]/20 border border-white/[0.06]">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#7c6cf0]">
                  <path d="M2 7 12 17l10-10" />
                  <path d="m9 7 5 5-5 5" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/90">Decentralized Marketplace</h3>
                <p className="text-[10px] text-white/25 font-mono mt-0.5">{truncate(CONTRACT_ADDRESS)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {listingCount > 0 && (
                <Badge variant="info" className="text-[10px]">{listingCount} listings</Badge>
              )}
              <Badge variant="info" className="text-[10px]">Soroban</Badge>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/[0.06] px-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setError(null); setListing(null); }}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all",
                  activeTab === t.key ? "text-white/90" : "text-white/35 hover:text-white/55"
                )}
              >
                <span style={activeTab === t.key ? { color: t.color } : undefined}>{t.icon}</span>
                {t.label}
                {activeTab === t.key && (
                  <span
                    className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full transition-all"
                    style={{ background: `linear-gradient(to right, ${t.color}, ${t.color}66)` }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Browse */}
            {activeTab === "browse" && (
              <div className="space-y-5">
                <MethodSignature name="get_listing" params="(listing_id: u64)" returns="-> Listing" color="#4fc3f7" />
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                      label="Listing ID" 
                      value={browseId} 
                      onChange={(e) => setBrowseId(e.target.value)} 
                      placeholder="e.g. 1" 
                      type="number"
                    />
                  </div>
                  <div className="flex items-end">
                    <ShimmerButton onClick={handleBrowseListing} disabled={isBrowsing} shimmerColor="#4fc3f7" className="h-[46px] px-4">
                      {isBrowsing ? <SpinnerIcon /> : <><SearchIcon /> View</>}
                    </ShimmerButton>
                  </div>
                </div>

                {listing && (
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden animate-fade-in-up">
                    <div className="border-b border-white/[0.06] px-4 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-white/25">Listing Details</span>
                      {(() => {
                        const status = listing.status || "Unknown";
                        const cfg = STATUS_CONFIG[status];
                        return cfg ? (
                          <Badge variant={cfg.variant}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dot)} />
                            {status}
                          </Badge>
                        ) : (
                          <Badge>{status}</Badge>
                        );
                      })()}
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">ID</span>
                        <span className="font-mono text-sm text-white/80">#{listing.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Title</span>
                        <span className="font-mono text-sm text-white/80">{listing.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Description</span>
                        <span className="font-mono text-sm text-white/80 max-w-[200px] truncate">{listing.description}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Price</span>
                        <span className="font-mono text-sm text-[#34d399]">{formatPrice(listing.price)} XLM</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/35">Seller</span>
                        <span className="font-mono text-xs text-white/50">{truncate(listing.seller)}</span>
                      </div>
                    </div>
                    {listing.status === "Active" && walletAddress && walletAddress.toLowerCase() !== listing.seller.toLowerCase() && (
                      <div className="border-t border-white/[0.06] p-4">
                        <ShimmerButton onClick={() => setBuyId(String(listing?.id))} shimmerColor="#34d399" className="w-full">
                          <CreditCardIcon /> Buy Now
                        </ShimmerButton>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick buy */}
                {activeTab === "browse" && listing?.status === "Active" && (
                  <div className="rounded-xl border border-[#34d399]/15 bg-[#34d399]/[0.03] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#34d399]">
                      <CreditCardIcon />
                      <span className="text-sm font-medium">Quick Buy</span>
                    </div>
                    <Input 
                      label="Listing ID" 
                      value={buyId} 
                      onChange={(e) => setBuyId(e.target.value)} 
                      placeholder="Enter listing ID"
                      type="number"
                    />
                    <ShimmerButton onClick={handleBuyListing} disabled={isBuying || !buyId} shimmerColor="#34d399" className="w-full">
                      {isBuying ? <><SpinnerIcon /> Processing...</> : <><CreditCardIcon /> Purchase</>}
                    </ShimmerButton>
                  </div>
                )}
              </div>
            )}

            {/* Create */}
            {activeTab === "create" && (
              <div className="space-y-5">
                <MethodSignature name="create_listing" params="(seller, title, desc, price, token)" returns="-> u64" color="#7c6cf0" />
                <Input 
                  label="Title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="e.g. Vintage Guitar" 
                />
                <TextArea 
                  label="Description" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Describe your item..." 
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input 
                    label="Price (XLM)" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)} 
                    placeholder="e.g. 10.5" 
                    type="number"
                    step="0.01"
                  />
                  <Input 
                    label="Token Address" 
                    value={tokenAddress} 
                    onChange={(e) => setTokenAddress(e.target.value)} 
                    placeholder="Token contract" 
                  />
                </div>
                <div className="text-xs text-white/30">
                  Platform fee: {feePercent / 100}% • Price in stroops (1 XLM = 10,000,000 stroops)
                </div>
                
                {walletAddress ? (
                  <ShimmerButton onClick={handleCreateListing} disabled={isCreating || !title || !description || !price} shimmerColor="#7c6cf0" className="w-full">
                    {isCreating ? <><SpinnerIcon /> Creating...</> : <><PlusIcon /> Create Listing</>}
                  </ShimmerButton>
                ) : (
                  <button
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="w-full rounded-xl border border-dashed border-[#7c6cf0]/20 bg-[#7c6cf0]/[0.03] py-4 text-sm text-[#7c6cf0]/60 hover:border-[#7c6cf0]/30 hover:text-[#7c6cf0]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                  >
                    Connect wallet to create listings
                  </button>
                )}
              </div>
            )}

            {/* Manage */}
            {activeTab === "manage" && (
              <div className="space-y-5">
                <MethodSignature name="cancel_listing" params="(seller, listing_id)" returns="-> ()" color="#fbbf24" />
                
                {/* Cancel listing */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-white/70">
                    <XIcon />
                    <span className="text-sm font-medium">Cancel Listing</span>
                  </div>
                  <Input 
                    label="Listing ID to Cancel" 
                    value={cancelId} 
                    onChange={(e) => setCancelId(e.target.value)} 
                    placeholder="Enter listing ID"
                    type="number"
                  />
                  {walletAddress ? (
                    <ShimmerButton onClick={handleCancelListing} disabled={isCancelling || !cancelId} shimmerColor="#f87171" className="w-full">
                      {isCancelling ? <><SpinnerIcon /> Cancelling...</> : <><XIcon /> Cancel Listing</>}
                    </ShimmerButton>
                  ) : (
                    <button
                      onClick={onConnect}
                      disabled={isConnecting}
                      className="w-full rounded-xl border border-dashed border-[#f87171]/20 bg-[#f87171]/[0.03] py-3 text-sm text-[#f87171]/60 hover:border-[#f87171]/30 hover:text-[#f87171]/80 active:scale-[0.99] transition-all disabled:opacity-50"
                    >
                      Connect wallet to cancel listings
                    </button>
                  )}
                </div>

                {/* View your listings - quick access */}
                {listing && listing.seller.toLowerCase() === walletAddress?.toLowerCase() && (
                  <div className="rounded-xl border border-[#fbbf24]/15 bg-[#fbbf24]/[0.03] p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#fbbf24]">
                      <UserIcon />
                      <span className="text-sm font-medium">Your Listing</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-white/35">Title</span>
                        <span className="font-mono text-xs text-white/70">{listing.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-white/35">Status</span>
                        <span className="font-mono text-xs text-white/70">{listing.status}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.04] px-6 py-3 flex items-center justify-between">
            <p className="text-[10px] text-white/15">Decentralized Marketplace &middot; Soroban</p>
            <div className="flex items-center gap-2">
              {["Active", "Sold", "Cancelled"].map((s, i) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={cn("h-1 w-1 rounded-full", STATUS_CONFIG[s]?.dot ?? "bg-white/20")} />
                  <span className="font-mono text-[9px] text-white/15">{s}</span>
                  {i < 2 && <span className="text-white/10 text-[8px]">&rarr;</span>}
                </span>
              ))}
            </div>
          </div>
        </AnimatedCard>
      </Spotlight>
    </div>
  );
}
