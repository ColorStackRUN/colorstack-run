"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { SiteLinks } from "@/app/lib/content-types";

const links = [["/about", "About"], ["/events", "Events"], ["/learn", "Learn"], ["/opportunities", "Opportunities"], ["/community", "Community"]] as const;
export function HubNav({ siteLinks }: { siteLinks: SiteLinks }) {
 const path = usePathname(); const [open,setOpen]=useState(false);
 return <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-[#fafafa]/95 backdrop-blur dark:border-white/10 dark:bg-[#080808]/95"><div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-12"><Link href="/" className="flex items-center gap-3"><Image src="/colorstack_run_logo_red_4.png" alt="ColorStack Rutgers Newark logo" width={36} height={36} className="rounded-full"/><span className="font-semibold text-lg text-gray-900 dark:text-white">ColorStack<span className="text-red-500">RUN</span></span></Link><div className="hidden items-center gap-1 md:flex">{links.map(([href,label])=><Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm transition ${path===href || path.startsWith(`${href}/`) ? "bg-red-500/10 text-red-600 dark:text-red-400" : "text-gray-700 hover:bg-black/5 dark:text-white/70 dark:hover:bg-white/5"}`}>{label}</Link>)}<a href={siteLinks.join} target="_blank" rel="noopener noreferrer" className="ml-3 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-500">Join Us</a></div><button onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation menu" className="rounded p-2 text-gray-800 dark:text-white md:hidden">☰</button></div>{open&&<div className="border-t border-gray-200 px-6 py-4 dark:border-white/10 md:hidden">{links.map(([href,label])=><Link key={href} onClick={()=>setOpen(false)} href={href} className="block rounded px-3 py-3 text-gray-800 dark:text-white">{label}</Link>)}<a href={siteLinks.join} target="_blank" rel="noopener noreferrer" className="mt-2 block rounded-full bg-red-600 px-4 py-3 text-center font-semibold text-white">Join Us</a></div>}</nav>;
}
