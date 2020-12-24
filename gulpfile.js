const BrowserSync = require("browser-sync")
const Del = require("del")
const ESBuild = require("gulp-esbuild")
const FrontMatter = require("gulp-front-matter")
const FS = require("fs")
const Gulp = require("gulp")
const GulpHtmlMin = require("gulp-htmlmin")
const GulpIf = require("gulp-if")
const GulpRename = require("gulp-rename")
const GulpReplace = require("gulp-replace")
const Handlebars = require("handlebars")
const Marked = require("gulp-marked")
const Path = require("path")
const Sass = require("gulp-sass")
const Wrap = require("gulp-wrap")
const TypeScript = require("gulp-typescript")
// eslint-disable-next-line @typescript-eslint/no-unused-vars-experimental
const GulpDebug = require("gulp-debug")

// ------------------------------------------------------------
// Pipeline options: edit in staticsite.json
// ------------------------------------------------------------

// Check to make sure that the required pipeline options are set.
const staticSiteJson = require("./staticsite.json")

if (!("allowSymlinks" in staticSiteJson))
	staticSiteJson.allowSymlinks = true
if (!("azureStaticWebApps" in staticSiteJson))
	staticSiteJson.azureStaticWebApps = false
if (!("cacheBusting" in staticSiteJson))
	staticSiteJson.cacheBusting = false
if (!("canonicalUrl" in staticSiteJson))
	throw new Error("The canonicalUrl setting must be specified in staticsite.json.")
if (!("defaultLayout" in staticSiteJson))
	staticSiteJson.defaultLayout = "default"
if (!("outputFolder" in staticSiteJson))
	staticSiteJson.outputFolder = "build/"
else if (staticSiteJson.outputFolder.substring(staticSiteJson.outputFolder.length - 2, 1) !== "/")
	staticSiteJson.outputFolder += "/"

// Override allowSymlinks to always be false on non-Windows systems because they only seem to work on Windows and I don't care about other platforms
if (process.platform !== "win32" && staticSiteJson.allowSymlinks)
{
	staticSiteJson.allowSymlinks = false
	console.log("Disabling symlink support (allowSymlinks) because they're only supported on Windows.")
}

// ------------------------------------------------------------

// ------------------------------------------------------------
// Helper functions and constants
// ------------------------------------------------------------

const now = new Date()
const buildTimestamp = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, "0")}${(now.getUTCDate() + 1).toString().padStart(2, "0")}${(now.getUTCHours() + 1).toString().padStart(2, "0")}${(now.getUTCMinutes() + 1).toString().padStart(2, "0")}`

const renameWithTimestamp = (path) =>
{
	return ({
		...path,
		basename: `${path.basename}.${buildTimestamp}`,
	})
}

const templateGlob = ["src/layouts/*.hbs"]

let cachedTemplates
const getTemplate = (data) =>
{
	const layout = data.file.frontMatter.layout || staticSiteJson.defaultLayout
	if (layout in cachedTemplates) return cachedTemplates[layout]

	cachedTemplates[layout] = FS.readFileSync(`./src/layouts/${layout}.hbs`).toString()
	return cachedTemplates[layout]
}
const clearCachedTemplates = () =>
{
	cachedTemplates = {}
	Handlebars.unregisterPartial("base")
	Handlebars.registerPartial("base", FS.readFileSync("src/layouts/base.hbs").toString())
	if (staticSiteJson.cacheBusting)
		Handlebars.registerHelper("timestamp", () => buildTimestamp)
}
clearCachedTemplates()

const wrapInTemplate = () => Wrap(getTemplate, {}, { site: staticSiteJson, engine: "handlebars" })

// Adds the current year, or a year range, to the template.
// {{year}}  =>  "2020"
// {{year from=1981}}  =>  "1981-2020"
Handlebars.registerHelper("year", (options) =>
{
	const from = "hash" in options ? options.hash.from : undefined
	const to = (new Date()).getUTCFullYear()
	return (!from || to <= from) ? to.toString() : `${from}-${to}`
})

const routesJsonGlob = ["src/routes.json"]
const routesJson = require(`./${routesJsonGlob[0]}`)

// ------------------------------------------------------------
// Tasks
// ------------------------------------------------------------

const clean = () => Del(`${staticSiteJson.outputFolder}**`)
clean.displayName = "Clean output folder"

// ------------------------------------------------------------

const typescriptGlob = ["src/**/*.ts"]

const esbuildOptions =
{
	format: "esm",
	sourcemap: "inline",
	target: "es6",
}
const esbuildOptionsMin =
{
	...esbuildOptions,
	minify: true,
	sourcemap: false,
}

const typescriptProject = TypeScript.createProject("tsconfig.json")

const typeChecking = () => Gulp
	.src(typescriptGlob)
	.pipe(typescriptProject())
typeChecking.displayName = "Type checking"

const typescript = () => Gulp
	.src(typescriptGlob)
	.pipe(ESBuild(esbuildOptions))
	.pipe(GulpIf(staticSiteJson.cacheBusting, GulpRename(renameWithTimestamp)))
	.pipe(Gulp.dest(staticSiteJson.outputFolder))
typescript.displayName = "Compile TypeScript"

const typescriptMin = () => Gulp
	.src(typescriptGlob)
	.pipe(ESBuild(esbuildOptionsMin))
	.pipe(GulpIf(staticSiteJson.cacheBusting, GulpRename(renameWithTimestamp)))
	.pipe(Gulp.dest(staticSiteJson.outputFolder))
typescriptMin.displayName = "Compile and minify TypeScript"

// ------------------------------------------------------------

const GulpHtmlMinOptions =
{
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	conservativeCollapse: true,
	minifyCSS: true,
	minifyJS: true,
	quoteCharacter: '"',
	removeAttributeQuotes: true,
	removeComments: true,
	sortAttributes: true,
}

const pathsToNotRename = new Set()
for (const errorPage of routesJson.platformErrorOverrides)
	pathsToNotRename.add(`.${errorPage.serve}`)

const renameWithoutExtension = (path) =>
{
	if (pathsToNotRename.has(`${path.dirname === "." ? "." : "./" + path.dirname}/${path.basename}${path.extname}`)) return path
	if (path.basename === "index") return path

	return ({
		...path,
		dirname: `${path.dirname}/${path.basename}`,
		basename: "index",
		extname: ".html",
	})
}

const htmlGlob = ["src/**/*.html", "src/**/*.htm"]

const html = () =>
{
	clearCachedTemplates()
	return Gulp
		.src(htmlGlob)
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(FrontMatter())
		.pipe(GulpIf(staticSiteJson.cacheBusting, GulpReplace("{{timestamp}}", buildTimestamp)))
		.pipe(wrapInTemplate())
		.pipe(Gulp.dest(staticSiteJson.outputFolder))
}
html.displayName = "Process HTML pages"

const htmlMin = () =>
{
	clearCachedTemplates()
	return Gulp
		.src(htmlGlob)
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(FrontMatter())
		.pipe(GulpIf(staticSiteJson.cacheBusting, GulpReplace("{{timestamp}}", buildTimestamp)))
		.pipe(wrapInTemplate())
		.pipe(GulpHtmlMin(GulpHtmlMinOptions))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))
}
htmlMin.displayName = "Process and minify HTML pages"

// ------------------------------------------------------------

const markdownGlob = ["src/**/*.md"]

const markdown = () =>
{
	clearCachedTemplates()
	return Gulp
		.src(markdownGlob)
		.pipe(FrontMatter())
		.pipe(Marked())
		.pipe(wrapInTemplate())
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))
}
markdown.displayName = "Convert Markdown to HTML"

const markdownMin = () =>
{
	clearCachedTemplates()
	return Gulp
		.src(markdownGlob)
		.pipe(FrontMatter())
		.pipe(Marked())
		.pipe(wrapInTemplate())
		.pipe(GulpHtmlMin(GulpHtmlMinOptions))
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))
}
markdownMin.displayName = "Convert Markdown to HTML and minify"

// ------------------------------------------------------------

Sass.compiler = require("node-sass")

const sassGlob = ["src/**/*.scss"]

const css = () =>
{
	return Gulp
		.src(sassGlob)
		.pipe(Sass({ outputStyle: "expanded" }).on("error", Sass.logError))
		.pipe(GulpIf(staticSiteJson.cacheBusting, GulpRename(renameWithTimestamp)))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))
}
css.displayName = "Compile SASS into CSS"

const cssMin = () =>
{
	return Gulp
		.src(sassGlob)
		.pipe(Sass({ outputStyle: "compressed" }).on("error", Sass.logError))
		.pipe(GulpIf(staticSiteJson.cacheBusting, GulpRename(renameWithTimestamp)))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))
}
cssMin.displayName = "Compile SASS into CSS and minify"

// ------------------------------------------------------------

const redirects = (callback) =>
{
	// Skip this for Azure Static Web apps, because that handles routes.json natively.
	if (staticSiteJson.azureStaticWebApps)
	{
		callback()
		return
	}

	for (const routeData of routesJson.routes)
	{
		const contents = `<meta http-equiv=refresh content="0;url=${encodeURI(routeData.serve)}"><link rel=canonical href="${staticSiteJson.canonicalUrl}${encodeURI(routeData.serve)}">`

		// If the route doesn't have an extension, or it has a non-HTML extension, treat it as a folder containing index.html so that it gets the right content-type.
		let filename = Path.join(staticSiteJson.outputFolder, routeData.route)
		const ext = Path.extname(filename)
		if (ext !== ".html" && ext !== ".htm")
			filename = Path.join(filename, "index.html")

		// Before saving the file, create its folder if necessary.
		const dir = Path.dirname(filename)
		if (!FS.existsSync(dir))
			FS.mkdirSync(dir, { recursive: true })

		FS.writeFileSync(filename, contents)
	}

	callback()
}
redirects.displayName = "Generate redirects"

// ------------------------------------------------------------

const staticGlob = ["src/**", "!src", "!src/**/*.{ts,html,htm,md,scss,hbs}"]
if (!staticSiteJson.azureStaticWebApps)
	staticGlob.push("!src/routes.json")

const symlink = () => Gulp
	.src(staticGlob, { nodir: true })
	.pipe(GulpIf(staticSiteJson.allowSymlinks,
		Gulp.symlink(staticSiteJson.outputFolder, { relativeSymlinks: false, overwrite: true }),
		Gulp.dest(staticSiteJson.outputFolder)
	))
symlink.displayName = staticSiteJson.allowSymlinks ? "Symlink static files" : "Copy static files"

// ------------------------------------------------------------

const webModulesGlob = ["web_modules/**/*.js"]
const webModulesOutputFolder = `${staticSiteJson.outputFolder}web_modules/`

const webModules = () => Gulp
	.src(webModulesGlob)
	.pipe(GulpIf(staticSiteJson.allowSymlinks,
		Gulp.symlink(webModulesOutputFolder, { relativeSymlinks: false, overwrite: true }),
		Gulp.dest(webModulesOutputFolder)
	))
webModules.displayName = staticSiteJson.allowSymlinks ? "Symlink web_modules" : "Copy web_modules"

const webModulesMin = () => Gulp
	.src(webModulesGlob)
	.pipe(ESBuild(esbuildOptionsMin))
	.pipe(Gulp.dest(webModulesOutputFolder))
webModulesMin.displayName = "Copy and minify web_modules"

// ------------------------------------------------------------

let isServerRunning = false

const serve = (callback) =>
{
	const browserSyncOptions = require("./browsersync.json")
	if (staticSiteJson.devServerPort && !browserSyncOptions.port)
		browserSyncOptions.port = staticSiteJson.devServerPort
	BrowserSync.init(browserSyncOptions)
	isServerRunning = true

	callback()
}
serve.displayName = "Start a server"

const reloadServer = (callback) =>
{
	if (isServerRunning)
		BrowserSync.reload()
	callback()
}

// ------------------------------------------------------------

const setupOutput = (callback) =>
{
	if (!FS.existsSync(webModulesOutputFolder))
		FS.mkdirSync(webModulesOutputFolder, { recursive: true })

	callback()
}
setupOutput.displayName = "Set up output folder"

// ------------------------------------------------------------
// Exports
// ------------------------------------------------------------

const dev = Gulp.parallel(typeChecking, typescript, html, markdown, css, webModules, redirects, symlink)
const devNoTypes = Gulp.parallel(typescript, html, markdown, css, webModules, redirects, symlink)

const build = Gulp.parallel(typeChecking, typescriptMin, htmlMin, markdownMin, cssMin, webModulesMin, redirects, symlink)

const watch = (callback) =>
{
	Gulp.watch(typescriptGlob, Gulp.parallel(Gulp.series(typescript, reloadServer), typeChecking))
	Gulp.watch([...htmlGlob, ...templateGlob], Gulp.series(html, reloadServer))
	Gulp.watch([...markdownGlob, ...templateGlob], Gulp.series(markdown, reloadServer))
	Gulp.watch(sassGlob, Gulp.series(css, reloadServer))
	Gulp.watch(routesJsonGlob, Gulp.series(redirects, reloadServer))
	// We do a full build before watching, so it's not necessary to do symlinking again here.

	callback()
}
watch.displayName = "Watch for changes"

exports.clean = Gulp.series(setupOutput, clean)
exports.dev = Gulp.series(setupOutput, clean, dev)
exports.build = Gulp.series(setupOutput, clean, build)
exports.watch = Gulp.series(setupOutput, clean, dev, watch)
exports.serve = Gulp.series(setupOutput, serve)
exports.start = Gulp.series(setupOutput, clean, devNoTypes, Gulp.parallel(watch, serve, typeChecking))
exports.startprod = Gulp.series(setupOutput, clean, build, serve)

exports.default = exports.build
