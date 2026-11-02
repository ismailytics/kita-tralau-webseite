import type { MenuItem } from "@/types";

// Feste Navigation (ADR-0006). Neue feste Seiten werden hier ergänzt.
export const MainMenu: MenuItem[] = [
	{
		label: "Start",
		href: "/",
		hoverClass: "hover:text-brand-blue",
		activeClass: "text-brand-blue",
	},
	{
		label: "Aktuelles",
		href: "/aktuelles",
		hoverClass: "hover:text-brand-blue",
		activeClass: "text-brand-blue",
	},
	{
		label: "Termine",
		href: "/termine",
		hoverClass: "hover:text-brand-red",
		activeClass: "text-brand-red",
	},
	{
		label: "Vorstand",
		href: "/vorstand",
		hoverClass: "hover:text-brand-red",
		activeClass: "text-brand-red",
	},
	{
		label: "Tagesablauf",
		href: "/tagesablauf",
		hoverClass: "hover:text-brand-green",
		activeClass: "text-brand-green",
	},
	{
		label: "FAQ",
		href: "/faq",
		hoverClass: "hover:text-brand-yellow",
		activeClass: "text-brand-yellow",
	},
	{
		label: "Downloads",
		href: "/downloads",
		hoverClass: "hover:text-brand-blue",
		activeClass: "text-brand-blue",
	},
];
