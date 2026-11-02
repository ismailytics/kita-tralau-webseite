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
		label: "Termine",
		href: "/termine",
		hoverClass: "hover:text-brand-red",
		activeClass: "text-brand-red",
	},
];
