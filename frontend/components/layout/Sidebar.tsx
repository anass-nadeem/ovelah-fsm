"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { clearToken } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: (props: { className?: string }) => React.ReactElement;
};

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="2.5" width="6.5" height="4" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="8.5" width="6.5" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function QuotationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 2.5h7L17 6.5V17a0.5 0.5 0 0 1-0.5.5h-11A0.5 0.5 0 0 1 5 17V3a0.5 0.5 0 0 1 0-0.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M12 2.5V6.5H16" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7.5 10.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7.5 13.5H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function InvoiceIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 2.5h10a0.5 0.5 0 0 1 0.5 0.5v14l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3V3a0.5 0.5 0 0 1 0.5-0.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M7 7H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 10H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function JobsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M12.5 4.2a3.3 3.3 0 0 0-4.4 3.9L3 13.2v2.3h2.3l5.1-5.1a3.3 3.3 0 0 0 3.9-4.4l-2.1 2.1-1.7-.5-.5-1.7 2.1-2.1Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BranchesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M10 17.5S16 12.1 16 7.8a6 6 0 0 0-12 0C4 12.1 10 17.5 10 17.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="7.8" r="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ItemsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M10 2.5 17 6.2V13.8L10 17.5 3 13.8V6.2L10 2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 6.2 10 10 17 6.2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 10V17.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 2.8v1.8M10 15.4v1.8M17.2 10h-1.8M4.6 10H2.8M15.1 4.9l-1.3 1.3M6.2 13.8l-1.3 1.3M15.1 15.1l-1.3-1.3M6.2 6.2 4.9 4.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClientsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="7.5" cy="6.5" r="2.8" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 16.5c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2.1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12.8 11.7c2.4.2 4.2 2.2 4.2 4.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExpensesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <circle cx="10" cy="10" r="7.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 5.8v8.4M12.3 7.6c0-1-1-1.6-2.3-1.6-1.4 0-2.4.7-2.4 1.7 0 2.5 4.7 1.2 4.7 3.7 0 1-1 1.7-2.4 1.7-1.3 0-2.3-.6-2.3-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function AssetsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 6.5 10 3l7 3.5-7 3.5-7-3.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 6.5v7L10 17l7-3.5v-7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M10 10v7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CreditsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <rect x="2.5" y="5" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BalancesIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 4v12h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 13l3-3.5 2.5 2L16 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Quotations", href: "/quotations", icon: QuotationIcon },
  { label: "Invoices", href: "/invoices", icon: InvoiceIcon },
  { label: "Jobs", href: "/jobs", icon: JobsIcon },
  { label: "Clients", href: "/clients", icon: ClientsIcon },
  { label: "Branches", href: "/branches", icon: BranchesIcon },
  { label: "Items", href: "/items", icon: ItemsIcon },
  { label: "Expenses", href: "/expenses", icon: ExpensesIcon },
  { label: "Assets", href: "/assets", icon: AssetsIcon },
  { label: "Credits", href: "/credits", icon: CreditsIcon },
  { label: "Balances", href: "/balances", icon: BalancesIcon },
  { label: "Settings", href: "/settings", icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-ies-navy-950">

      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <Image
            src="/ies-mark.png"
            alt=""
            width={34}
            height={34}
            className="shrink-0"
          />

          <div className="leading-tight">
            <p className="font-[family-name:var(--font-display)] text-[13.5px] font-bold tracking-tight text-white">
              INFINITY
            </p>
            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
              Engineering Solutions
            </p>
          </div>
        </div>

        {/* Signature accent rule - echoes the blue/red divider on
            the real letterhead */}
        <div className="mt-5 h-[3px] w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-full bg-gradient-to-r from-ies-blue via-ies-blue to-ies-red" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                active
                  ? "bg-ies-navy-700 text-white"
                  : "text-white/60 hover:bg-ies-navy-800 hover:text-white/90"
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-ies-red" />
              )}

              <Icon
                className={`h-[18px] w-[18px] shrink-0 ${
                  active ? "text-white" : "text-white/50 group-hover:text-white/80"
                }`}
              />

              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-white/35">
          Infinity Engineering Solutions
        </p>
        <p className="text-[11px] text-white/35">
          Internal ERP
        </p>

        <button
          type="button"
          onClick={() => {
            clearToken();
            window.location.href = "/login";
          }}
          className="mt-3 text-[11px] font-medium text-white/50 hover:text-white/80"
        >
          Log Out
        </button>
      </div>

    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-ies-navy-950 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2.5">
          <Image src="/ies-mark.png" alt="" width={26} height={26} />
          <span className="font-[family-name:var(--font-display)] text-[13px] font-bold tracking-tight text-white">
            INFINITY
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
          className="rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5">
            <path
              d="M3 5.5H17M3 10H17M3 14.5H17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden">
          <div className="h-[calc(100vh-53px)] w-full">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="fixed h-screen w-60">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}