const BrowserSync = require("browser-sync")
const Del = require("del")
const FrontMatter = require("gulp-front-matter")
const FS = require("fs")
const Gulp = require("gulp")
const GulpHtmlMin = require("gulp-htmlmin")
const GulpRename = require("gulp-rename")
const Handlebars = require("handlebars")
const Marked = require("gulp-marked")
const Sass = require("gulp-sass")
const Wrap = require("gulp-wrap")
const Terser = require("gulp-terser")
const TypeScript = require("gulp-typescript")
// eslint-disable-next-line no-unused-vars
const GulpDebug = require("gulp-debug")

// ------------------------------------------------------------
// Pipeline options: edit in staticsite.json
// ------------------------------------------------------------

// Check to make sure that the required pipeline options are set.
const staticSiteJson = require("./staticsite.json")

if (!("azureStaticWebApps" in staticSiteJson))
	staticSiteJson.azureStaticWebApps = false
if (!("canonicalUrl" in staticSiteJson))
	throw new Error("The canonicalUrl setting must be specified in staticsite.json.")
if (!("defaultLayout" in staticSiteJson))
	staticSiteJson.defaultLayout = "default"
if (!("outputFolder" in staticSiteJson))
	staticSiteJson.outputFolder = "build/"
else if (staticSiteJson.outputFolder.substring(staticSiteJson.outputFolder.length - 2, 1) !== "/")
	staticSiteJson.outputFolder += "/"

// ------------------------------------------------------------

// ------------------------------------------------------------
// Helper functions
// ------------------------------------------------------------

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

const clean = async (callback) =>
{
	await Del(`${staticSiteJson.outputFolder}**`)

	callback()
}
clean.displayName = "Clean output folder"

// ------------------------------------------------------------

const terserOptions =
{
	keep_fnames: true,
	mangle: false,
	compress: {
		ecma: 2015,
		unsafe: true,
		warnings: true,
	},
	output: {
		comments: false,
	}
}

const typescriptProject = TypeScript.createProject("tsconfig.json")
const typescriptGlob = ["src/**/*.ts"]

const typescript = (callback) =>
{
	const output = Gulp
		.src(typescriptGlob)
		.pipe(typescriptProject())
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
typescript.displayName = "Compile TypeScript"

const typescriptMin = (callback) =>
{
	const output = Gulp
		.src(typescriptGlob)
		.pipe(typescriptProject())
		.pipe(Terser(terserOptions))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
typescriptMin.displayName = "Compile and minify TypeScript"

// ------------------------------------------------------------

const GulpHtmlMinOptions =
{
	collapseBooleanAttributes: true,
	collapseWhitespace: true,
	conservativeCollapse: true,
	maxLineLength: 400,
	minifyCSS: true,
	minifyJS: true,
	quoteCharacter: '"',
	removeAttributeQuotes: true,
	removeComments: true,
	sortAttributes: true,
}

const pathsToNotRename = new Set(["./index.html"])
for (const errorPage of routesJson.platformErrorOverrides)
	pathsToNotRename.add(`.${errorPage.serve}`)

const renameWithoutExtension = (path) =>
{
	if (pathsToNotRename.has(`${path.dirname}/${path.basename}${path.extname}`)) return path
	return ({
		...path,
		dirname: `${path.dirname}/${path.basename}`,
		basename: "index",
		extname: ".html",
	})
}

const htmlGlob = ["src/**/*.html", "src/**/*.htm"]

const html = (callback) =>
{
	clearCachedTemplates()
	const output = Gulp
		.src(htmlGlob)
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(FrontMatter())
		.pipe(wrapInTemplate())
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
html.displayName = "Process HTML pages"

const htmlMin = (callback) =>
{
	clearCachedTemplates()
	const output = Gulp
		.src(htmlGlob)
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(FrontMatter())
		.pipe(wrapInTemplate())
		.pipe(GulpHtmlMin(GulpHtmlMinOptions))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
htmlMin.displayName = "Process and minify HTML pages"

// ------------------------------------------------------------

const markdownGlob = ["src/**/*.md"]

const markdown = (callback) =>
{
	clearCachedTemplates()
	const output = Gulp
		.src(markdownGlob)
		.pipe(FrontMatter())
		.pipe(Marked())
		.pipe(wrapInTemplate())
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
markdown.displayName = "Convert Markdown to HTML"

const markdownMin = (callback) =>
{
	clearCachedTemplates()
	const output = Gulp
		.src(markdownGlob)
		.pipe(FrontMatter())
		.pipe(Marked())
		.pipe(wrapInTemplate())
		.pipe(GulpHtmlMin(GulpHtmlMinOptions))
		.pipe(GulpRename(renameWithoutExtension))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
markdownMin.displayName = "Convert Markdown to HTML and minify"

// ------------------------------------------------------------

Sass.compiler = require("node-sass")

const sassGlob = ["src/**/*.scss"]

const css = (callback) =>
{
	const output = Gulp
		.src(sassGlob)
		.pipe(Sass({ outputStyle: "expanded" }).on("error", Sass.logError))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
css.displayName = "Compile SASS into CSS"

const cssMin = (callback) =>
{
	const output = Gulp
		.src(sassGlob)
		.pipe(Sass({ outputStyle: "compressed" }).on("error", Sass.logError))
		.pipe(Gulp.dest(staticSiteJson.outputFolder))

	callback()
	return output
}
cssMin.displayName = "Compile SASS into CSS and minify"

// ------------------------------------------------------------

const redirects = (callback) =>
{
	// Skip this for Azure Static Web apps, because that handles routes.json natively.
	if (staticSiteJson.azureStaticWebApps)
	{
		callback()
		return null
	}

	for (const routeData of routesJson.routes)
	{
		const contents = `<meta http-equiv=refresh content="0;url=${routeData.serve}"><link rel=canonical href="${staticSiteJson.canonicalUrl}${routeData.serve}">`

		FS.writeFileSync(staticSiteJson.outputFolder + routeData.route, contents)
	}

	callback()
	return null
}
redirects.displayName = "Generate redirects"

// ------------------------------------------------------------

const staticGlob = ["src/**", "!src", "!src/**/*.{ts,html,htm,md,scss,hbs}"]
if (!staticSiteJson.azureStaticWebApps)
	staticGlob.push("!src/routes.json")

const symlink = (callback) =>
{
	const output = Gulp
		.src(staticGlob, { nodir: true })
		.pipe(Gulp.symlink(staticSiteJson.outputFolder, { relativeSymlinks: false }))

	callback()
	return output
}
symlink.displayName = "Symlink static files"

// ------------------------------------------------------------

const webModulesGlob = ["web_modules/**/*.js"]
const webModulesOutputFolder = `${staticSiteJson.outputFolder}web_modules/`

const webModules = (callback) =>
{
	const output = Gulp
		.src(webModulesGlob)
		.pipe(Gulp.symlink(webModulesOutputFolder, { relativeSymlinks: false, overwrite: true }))

	callback()
	return output
}
webModules.displayName = "Symlink web_modules"

const webModulesMin = (callback) =>
{
	const output = Gulp
		.src(webModulesGlob)
		.pipe(Terser(terserOptions))
		.pipe(Gulp.dest(webModulesOutputFolder))

	callback()
	return output
}
webModulesMin.displayName = "Copy and minify web_modules"

// ------------------------------------------------------------

const serve = (callback) =>
{
	const browserSyncOptions = require("./browsersync.json")
	if (staticSiteJson.devServerPort && !browserSyncOptions.port)
		browserSyncOptions.port = staticSiteJson.devServerPort
	BrowserSync.init(browserSyncOptions)

	callback()
}
serve.displayName = "Start a server"

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

const dev = Gulp.parallel(typescript, html, markdown, css, webModules, redirects, symlink)

const build = Gulp.parallel(typescriptMin, htmlMin, markdownMin, cssMin, webModulesMin, redirects, symlink)

const watch = (callback) =>
{
	Gulp.watch(typescriptGlob, typescript)
	Gulp.watch([...htmlGlob, ...templateGlob], html)
	Gulp.watch([...markdownGlob, ...templateGlob], markdown)
	Gulp.watch(sassGlob, css)
	Gulp.watch(routesJsonGlob, redirects)
	// We do a full build before watching, so it's not necessary to do symlinking again here.

	callback()
}
watch.displayName = "Watch for changes"

exports.clean = Gulp.series(setupOutput, clean)
exports.dev = Gulp.series(setupOutput, clean, dev)
exports.build = Gulp.series(setupOutput, clean, build)
exports.watch = Gulp.series(setupOutput, clean, dev, watch)
exports.serve = Gulp.series(setupOutput, serve)
exports.start = Gulp.series(setupOutput, clean, dev, Gulp.parallel(watch, serve))

exports.default = exports.build
