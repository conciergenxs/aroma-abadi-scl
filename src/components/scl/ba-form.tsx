import { useState, useEffect } from "react";
import { Copy, RefreshCw, X, BadgeCheck, Search, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { baStore, BA_POSITIONS, type BA } from "./ba-store";
import { useSkuStore } from "./sku-store";

/* The one form for a Beauty Ambassador's LMS account — opened from the BA view
 * in Contacts to add one, and from a BA's own record to change theirs. It used
 * to live on a separate /ba directory page; that page is gone, so the form
 * moved here where both callers can reach it. */

export function BAForm({
  initial,
  onClose,
  onSubmit,
}: {
  initial: BA | null;
  onClose: () => void;
  onSubmit: (input: Omit<BA, "id">, id?: string) => void;
}) {
  const { brands } = useSkuStore();
  const [name, setName] = useState(initial?.name || "");
  const [leader, setAreaCoordinator] = useState(initial?.leader || "");
  const [brandId, setBrandId] = useState<string>(initial?.brandIds?.[0] || brands[0]?.id || "");
  const [gender, setGender] = useState<BA["gender"]>(initial?.gender || "Female");
  const [password, setPassword] = useState(
    initial?.password || baStore.generatePassword(leader, name),
  );
  const [spinning, setSpinning] = useState(false);
  const [waNumber, setWaNumber] = useState(initial?.waNumber || "+62 ");
  const [city, setCity] = useState(initial?.city || "");
  const [store, setStore] = useState(initial?.store || "");
  const [position, setPosition] = useState(initial?.position || "BA");

  // Keep the auto-generated password in sync with the ARCO + BA name prefix
  // while creating a new BA — editing an existing one leaves its live
  // credentials untouched unless Regenerate is pressed explicitly.
  useEffect(() => {
    if (initial) return;
    setPassword(baStore.generatePassword(leader, name));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, leader]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !waNumber.trim()) {
      toast.error("Name and WhatsApp number are required");
      return;
    }
    onSubmit(
      {
        name,
        gender,
        username: name.toLowerCase().replace(/\s+/g, "."),
        password,
        waNumber,
        brandIds: brandId ? [brandId] : [],
        city,
        store,
        position,
        leader,
      },
      initial?.id,
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex modal-backdrop">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <form
        onSubmit={submit}
        className="w-full max-w-md bg-background border-l border-border overflow-y-auto slide-in-right"
      >
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-sm text-primary mb-1">
              <BadgeCheck className="h-3.5 w-3.5" /> Beauty Ambassador
            </div>
            <div className="text-base font-semibold">
              {initial ? "Edit Beauty Ambassador" : "Add New Beauty Ambassador"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <Field label="Full Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name…"
              className={inputCls}
            />
          </Field>
          <Field label="Leader">
            <input
              value={leader}
              onChange={(e) => setAreaCoordinator(e.target.value)}
              placeholder="Enter Leader name…"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Gender">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as BA["gender"])}
                className={inputCls}
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </Field>
            <Field label="WhatsApp Number (login)">
              <input
                value={waNumber}
                onChange={(e) => setWaNumber(e.target.value)}
                placeholder="Enter WhatsApp number…"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Password (generated)">
            <div className="relative flex items-center">
              <input
                value={password}
                readOnly
                placeholder="Auto-generated…"
                className={`${inputCls} font-mono bg-muted/40 cursor-not-allowed pr-16`}
              />
              <div className="absolute right-1 flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(password);
                    toast.success("Password copied");
                  }}
                  className="tap h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                  title="Copy password"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSpinning(true);
                    setPassword(baStore.generatePassword(leader, name));
                    setTimeout(() => setSpinning(false), 420);
                  }}
                  className="tap h-7 w-7 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-gray-100 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${spinning ? "animate-spin-once" : ""}`} />
                </button>
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="City">
              <SearchableSelect
                value={city}
                onChange={setCity}
                placeholder="Search city…"
                options={KOTA_LIST}
              />
            </Field>
            <Field label="Store">
              <SearchableSelect
                value={store}
                onChange={setStore}
                placeholder="Search store…"
                options={STORE_LIST}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Position">
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={inputCls}
              >
                {BA_POSITIONS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </Field>
            <Field label="Brand">
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className={inputCls}
              >
                <option value="">Select brand…</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div className="p-5 border-t border-border flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border px-3 h-9 text-[14px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-primary text-primary-foreground px-4 h-9 text-[14px] font-medium"
          >
            {initial ? "Save" : "Add BA"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "h-9 w-full rounded-md border border-border bg-card/60 px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40";

const KOTA_LIST = [
  "Jakarta",
  "Surabaya",
  "Bandung",
  "Medan",
  "Bekasi",
  "Tangerang",
  "Depok",
  "Semarang",
  "Palembang",
  "Makassar",
  "Bogor",
  "Batam",
  "Pekanbaru",
  "Bandar Lampung",
  "Malang",
  "Padang",
  "Denpasar",
  "Samarinda",
  "Balikpapan",
  "Yogyakarta",
];

const STORE_LIST = [
  "Sogo Grand Indonesia",
  "Sogo Pondok Indah Mall",
  "Sogo Pacific Place",
  "Sogo Tunjungan Plaza",
  "Matahari Mal Kelapa Gading",
  "Matahari Citos",
  "Lippo Mall Kemang",
  "Central Park Mall",
  "Kota Kasablanka",
  "Senayan City",
  "Plaza Indonesia",
  "Gandaria City",
  "Summarecon Mal Serpong",
  "Living World Alam Sutera",
  "Pakuwon Mall Surabaya",
  "Galaxy Mall Surabaya",
  "Paris Van Java Bandung",
  "Trans Studio Mall Bandung",
  "Sun Plaza Medan",
  "Beachwalk Bali",
];

function SearchableSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filtered = options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="relative">
      <input
        value={open ? query : value}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        placeholder={value || placeholder}
        className={inputCls}
      />
      {open && (
        <ul className="animate-scale-in origin-top absolute z-30 top-10 left-0 right-0 rounded-md border border-border bg-background shadow-lg max-h-44 overflow-y-auto">
          {filtered.map((opt) => (
            <li key={opt}>
              <button
                type="button"
                onMouseDown={() => {
                  onChange(opt);
                  setOpen(false);
                  setQuery("");
                }}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${value === opt ? "text-primary font-medium" : ""}`}
              >
                {opt}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Not found — type to add manually
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

/* Resetting an LMS password is a one-way door — the BA's current credentials
 * stop working the moment it happens — so it always asks first and hands back
 * the new password rather than leaving it to be hunted for. */
export function ResetPasswordDialog({
  ba,
  onClose,
}: {
  ba: BA;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 modal-backdrop">
      <div className="w-full max-w-sm bg-background border border-border rounded-xl overflow-hidden modal-content">
        <div className="p-5 border-b border-border">
          <div className="text-sm font-semibold">Reset Password</div>
          <p className="mt-1 text-sm text-muted-foreground">
            Reset password for <span className="text-foreground font-medium">{ba.name}</span>? Their
            current password stops working straight away and a new one is generated.
          </p>
        </div>
        <div className="p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="press rounded-md border border-border px-3 h-9 text-[14px] hover:bg-gray-50 transition-colors duration-150"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const pw = baStore.regeneratePassword(ba.id);
              toast.success(`New password: ${pw}`);
              onClose();
            }}
            className="press rounded-md bg-primary text-primary-foreground px-4 h-9 text-[14px] font-medium hover:bg-primary/90 transition-colors duration-150"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
