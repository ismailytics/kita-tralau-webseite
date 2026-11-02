import type { HTMLAttributes } from "astro/types";
import type { Bearbeiten, Bild } from "@/inhaltsquelle";

export interface MenuItem {
	label: string;
	href: string;
	target?: "_self" | "_blank";
	class?: string;
	hoverClass?: string;
	activeClass?: string;
}

export interface LayoutProps {
	title?: string;
	seoDescription?: string;
	noindex?: boolean;
	/** Klick-zum-Bearbeiten für den Inhalt der Seite (Inhaltsquelle). */
	bearbeiten?: Bearbeiten;
	/** Teilen-Bild (OG/Twitter); ohne Angabe das Hero-Bild der Startseite. */
	bild?: Bild;
}

export interface ContainerProps {
	class?: string;
	contain?: boolean;
}

export interface MainHeadingProps {
	align?: "left" | "center" | "right";
	class?: string;
}

export interface SectionProps {
	id?: string;
	class?: string;
}

export interface SectionHeadingProps {
	class?: string;
}

export interface VideoProps extends HTMLAttributes<"video"> {
	src: string;
	overlay?: string;
}
