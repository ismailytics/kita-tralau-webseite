// Gemeinsam für storyblok-pull und storyblok-push: Zugang aus der Umgebung (Region EU) und Aufruf des Storyblok-CLI.
import { execFileSync } from "node:child_process";

export function storyblokZugang(welcherSpace = "") {
	const { STORYBLOK_PERSONAL_ACCESS_TOKEN: pat, STORYBLOK_SPACE_ID: space } = process.env;
	if (!pat || !space) {
		console.error(`STORYBLOK_PERSONAL_ACCESS_TOKEN und STORYBLOK_SPACE_ID${welcherSpace} müssen gesetzt sein.`);
		process.exit(1);
	}
	// Das CLI liest STORYBLOK_TOKEN als Management-Token; im Projekt ist STORYBLOK_TOKEN der Preview-Token.
	const env = { ...process.env, STORYBLOK_LOGIN: "env", STORYBLOK_TOKEN: pat, STORYBLOK_REGION: "eu" };
	/** Storyblok-CLI gegen den Space; Dateien liegen unter <-p dir>/<typ>/<space oder --from>/. */
	const cli = (...args) => execFileSync("pnpm", ["exec", "storyblok", ...args, "-s", space], { env, stdio: "inherit" });
	return { pat, space, cli };
}
