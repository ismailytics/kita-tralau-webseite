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

import type { HTMLAttributes } from "astro/types";

export interface VideoProps extends HTMLAttributes<"video"> {
	src: string;
	overlay?: string;
}