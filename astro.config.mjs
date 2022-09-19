import { defineConfig } from "astro/config"
import frontendistaHtmlMinify from "@frontendista/astro-html-minify"

// https://astro.build/config
export default defineConfig({

	server: { port: 80, host: true },
	publicDir: "static",
	outDir: "build",
	site: "https://www.example.com",
	base: "/",

	integrations: [frontendistaHtmlMinify({
		htmlTerserMinifierOptions: {
			caseSensitive: false,
			collapseBooleanAttributes: true,
			collapseInlineTagWhitespace: true,
			collapseWhitespace: true,
			conservativeCollapse: true,
			decodeEntities: true,
			keepClosingSlash: false,
			minifyCSS: true,
			preserveLineBreaks: true,
			removeAttributeQuotes: true,
			removeComments: true,
			removeScriptTypeAttributes: true,
			removeStyleLinkTypeAttributes: false,
			removeTagWhitespace: false,
			sortAttributes: true,
			sortClassName: true,
		}
	})],

	vite: {
		server: {
			open: true,
		},
	},
})
