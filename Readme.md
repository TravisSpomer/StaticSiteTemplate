*Viewing this on GitHub? Just click the **Use this template** button above.*

# Travis's static site template

This project contains the basic site template that I use. I've set it up for rapid development and to produce simple, very-high-performance static websites the way that Grandma used to, but with a few extra modern necessities like TypeScript and CSS preprocessing. It has no particular runtime dependencies.

This is a project for my own use and I don't have any plans to elevate it beyond that but you're welcome to take it and build on it from there. (Unless you prefer indenting with spaces, in which case GTFO.)

## What you can do with it

Back in the olden days, a website that didn't need server-side processing was just a folder full of files. I wanted to get as close to that experience as possible, while still being able to take advantage of a few key advancements in web technologies that have happened since then. But most notably, I *don't* want to use any sort of JavaScript-based UI framework like React.

*	You can create one or more page layouts (templates) for your site to hold your common navigation and page structure.
*	You can create pages in the site by just adding an HTML or Markdown file to the source tree.
	*	There's intentionally no support for server-side code, but you can run compile-time code in your pages by creating a Handlebars "helper".
*	You can write your client-side script in TypeScript instead of JavaScript, and it'll be automatically converted.
*	Your code will be automatically linted and reformatted, ensuring consistent style and eliminating some common mistakes.
*	You can include NPM packages without bundling.
*	You can write CSS using the more modern SCSS (Sass) syntax, and it'll be automatically converted.
*	The site template and styles include a few opinionated defaults for making beautiful text.
*	A fast development server is included so you can preview your site instantly, and for production builds, the output is minified for maximum performance.

For more details, see "Using the template" below.

## Environment setup

### Required software

Download and install the latest stable versions of these products from their websites.

1.	[Visual Studio Code](https://code.visualstudio.com)
2.	[Node](https://nodejs.org/en/)
3.	[Yarn](https://yarnpkg.com/lang/en/)
	* **Important:** Install the "Classic" (v1) version of Yarn. Yarn v2 is an entirely different product and does not seem to be very compatible with Visual Studio Code and a few other parts of the ecosystem yet.

In addition, in Windows, you must enable Developer Mode so that the site template can create symlinks without requiring administrator elevation.

1.	Start > `developer settings`
2.	Developer Mode > On

### Building and running

Whenever picking up a new version of the template, you need to make sure your dependencies are installed.  In Visual Studio Code:

1.	Terminal > Run Task
2.	Tasks: Run Task
3.	Install dependencies

Then, you can do a full dev build of the project with:

1.	Ctrl+Shift+B (or Terminal > Run Build Task)

But, the most useful option will be the **Start** task, which will perform a full dev build of the project, and then start a web server, open a tab in your browser, and automatically reload the site whenever you change anything while the server is running. The task uses [Browsersync](https://browsersync.io/), so you can open multiple browsers to the same site and they'll stay in sync.

1.	Terminal > Run Task
2.	Tasks: Run Task
3.	Start

To see the status of the server or build task, click the tools icon in the status bar, or Terminal > Show Running Tasks.

When you're ready to produce a minified production build of the site, run the `build` build command:

1.	Terminal > Run Task
2.	Tasks: Run Task
3.	Production build

#### Without Visual Studio Code

If you want to use the project without Visual Studio Code, use the following scripts instead of the above:

*	`yarn install`: Install dependencies
*	`yarn start`: Start live server
*	`yarn dev`: Development build
*	`yarn prod`: Production build

## Using the template

Here are some things to know about using this site template.

### Customizing for your site

At minimum, do this to customize the site for your purposes:

1.	Set your site's deployed/canonical URL in [`staticsite.json`](staticsite.json)
2.	Find and replace `StaticSiteTemplate` with the name of your site
3.	Update the copyright information in [`src/layouts/*.hbs`](src/layouts/*.hbs)
4.	Replace image assets in `src/images/app` with appropriate logos for your site
5.	Add appropriate information to the [app manifest](src/app.webmanifest)
6.	Give yourself credit in [`humans.txt`](src/humans.txt)

#### Editing the page layout (template)

This site template comes with two page layouts:

*	[`default.hbs`](src/layouts/default.hbs), which is suitable for most pages and is used whenever a layout is not explicitly chosen by a page.
*	[`plain.hbs`](src/layouts/plain.hbs), which is useful for popup windows and very custom pages that don't want the standard page contents.

You can add any number of additional page layouts just by adding more files to that folder. Use `file.frontMatter` in your layout to access the page's FrontMatter data.

There's also [`base.hbs`](src/layouts/base.hbs), which defines the page skeleton shared by both `default` and `plain`. (Currently it's a special case, but
you could adapt the template to handle more than one base layout: see the call to `Handlebars.registerPartial` in [`gulpfile.js`](gulpfile.js).)

### Compatibility

Compatibility with Internet Explorer, "Spartan" (pre-Chromium) Edge, and other non-modern browsers is not a goal. That just applies to the included CSS, though—if you replace my default CSS with something simpler, it would work just fine.

### Site options

Open [`staticsite.json`](staticsite.json) to configure options for the site.

*	`azureStaticWebApps`: Set to `true` if deploying this site to Azure Static Web Apps, and `false` otherwise. Default is `false`.
*	`canonicalUrl`: **Required.** Set this to the canonical deployed URL of the site. For example: `"https://www.example.com/"`.
*	`defaultLayout`: Set to the name of the default layout template in `src/layouts`, without the extension. Default is `default`.
*	`devServerPort`: The port to use when running the `serve` command. If not specified, browsersync will choose a port for you, likely 3000.
*	`outputFolder`: Set to the name of the folder where you'd like the built site files to be created. Default is `build/`. The contents of this folder can be uploaded to your hosting provider as-is. **Important:** All files in this folder will be deleted when the output is built or cleaned.

### Stuff you can safely delete

The template includes a few files that aren't necessary that you can feel free to delete.

*	`page2.md` is just an example of how to write a page in Markdown and you should delete it.
*	`site.ts` is the TypeScript source for the site. There's nothing in it, so it'll generate an empty JavaScript file. You don't need this if you aren't writing any client script.
*	`humans.txt` is just for your benefit and is not necessary in any way.
*	The `plain.hbs` layout isn't used by anything in the teample, and you may not need it.
*	`lit-element` in `webDependencies` is only used as an example of how to include lightweight NPM packages for use in client-side script. You can remove it from `webDependencies`.

### Creating routes and redirects

Use [`routes.json`](src/routes.json) to configure routes and redirects for the app.

When the `azureStaticWebApps` option is set to true, this file will be copied as-is to the output folder and [used by the Azure Static Web Apps service](https://docs.microsoft.com/en-us/azure/static-web-apps/routes).

When the option is set to false (or omitted), the pipeline will use its contents for two things:
*	Redirects in the `routes` section will be created as redirect files. (In the example below, a file called `default.aspx` will be created, which redirects to `/`.)
*	Files specified in `platformErrorOverrides` will not have their extensions stripped. (In the example below, `404.html` will *not* be output as `404/index.html` like it would normally.)

#### Example routes.json

```json
{
	"routes": [
		{ "route": "default.aspx", "serve": "/", "statusCode": 301 }
	],
	"platformErrorOverrides": [
		{ "errorType": "NotFound", "serve": "/404.html" }
	]
}
```

## Deploying to the web

You have two options:

### Deploying to Azure Static Web Apps

You can deploy to Azure Static Web Apps with very minimal configuration:

*	Set `azureStaticWebApps` to `true` in [`staticsite.json`](staticsite.json).
*	When creating the app, set the build artifacts folder to `build` (it's empty by default).

Once your repo and Azure are set up in this way, whenever your main branch is changed, GitHub will automatically build your site and publish it to Azure without any manual steps.

### Deploying to any static file host

You can also deploy the site to any static file host. Just run a production build (`yarn build`; see above) and upload the contents of the `build` folder to a host of your choice.

## Technologies used

*	[Handlebars](https://www.handlebarsjs.com/) for page templating.
*	[TypeScript](https://www.typescriptlang.org/) for JavaScript transpilation.
*	[ESLint](https://eslint.org/) for JavaScript linting and formatting.
*	[Terser](https://terser.org/) for JavaScript minification.
*	[SCSS (Sass)](https://sass-lang.com/) for CSS preprocessing and minification.
*	[Marked](https://marked.js.org/) for Markdown to HTML transformation.
*	[HTML Minifier](https://github.com/kangax/html-minifier) for HTML minification.
*	[Gulp](https://gulpjs.com/) for the build pipeline.
*	[Snowpack](https://snowpack.dev/) for client package management.
*	[Browsersync](https://www.browsersync.io/) for the development server.

For more information, including licenses for these packages, check the `node_modules` subfolders.

---

This template is © 2020 Travis Spomer but released to the public domain under the [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0) license. This license does not apply to sites built with this template, nor to external libraries referenced by this template; only the template itself.
