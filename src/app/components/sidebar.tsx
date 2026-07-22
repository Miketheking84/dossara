"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "Today", href: "/", icon: "home" },
  { label: "Inbox", href: "/inbox", icon: "inbox" },
  { label: "Matters", href: "/matters", icon: "folder" },
  { label: "Prompts", href: "/prompts", icon: "document" },
  { label: "Settings", href: "/settings", icon: "settings" },
] as const;

function Icon({ name }: { name: (typeof items)[number]["icon"] }) {
  const paths = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5M9 21v-7h6v7"/></>,
    inbox: <><path d="M3 5h18v14H3z"/><path d="m3 12 5 4h8l5-4"/></>,
    folder: <path d="M3 6h7l2 2h9v11H3z"/>,
    document: <><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 12h6M9 16h6"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a8 8 0 0 0-1.7-1L14.6 3h-5l-.4 3.1a8 8 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a8 8 0 0 0 1.7 1l.4 3.1h5l.4-3.1a8 8 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/></>,
  };

  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">SM</div>
        <div><strong>SDJ MIKE V1</strong><span>Legal Command Center</span></div>
      </div>
      <nav aria-label="Glavna navigacija">
        {items.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return <Link key={item.href} href={item.href} className={active ? "active" : ""}><Icon name={item.icon}/><span>{item.label}</span></Link>;
        })}
      </nav>
      <p className="local-only"><span aria-hidden="true" />Local only</p>
    </aside>
  );
}
