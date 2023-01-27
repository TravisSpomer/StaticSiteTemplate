# Travis's static site template

This project contains the basic static site template that I use. I've set it up for rapid development and to produce simple, very-high-performance static websites the way that Grandma used to, but with a few extra modern necessities like TypeScript and CSS preprocessing. It produces no JavaScript by default.

This is a project for my own use and I don't have any plans to elevate it beyond that but you're welcome to take it and build on it from there. (Unless you prefer indenting with spaces, in which case GTFO.)

### **[🆕 Create a website with this template now](https://github.com/TravisSpomer/StaticSiteTemplate/generate)**

## Features

### Astro

This template is now powered by [Astro](https://astro.build), which handles the dev server and most of the processing.

*	No client-side JavaScript is emitted unless you add some.
*	You can create one or more page layouts (templates) for your site to hold your common navigation and page structure.
*	You can create pages in the site by just adding an Astro/HTML or Markdown file to the source tree.
*	You can write your client-side script in TypeScript instead of JavaScript, and it'll be automatically converted.
*	You can include your favorite NPM packages.

See the [Astro docs](https://astro.build/docs) for information on how to use Astro, though it's quite self-explanatory.

### Enhancements

This template includes a few things that aren't included in Astro by default:

*	The site template and styles include a few opinionated defaults for making beautiful text.
*	Your code will be automatically linted and reformatted, ensuring consistent style and eliminating some common mistakes.
*	You can write CSS using the more modern SCSS (Sass) syntax, and it'll be automatically converted.
*	In production builds, HTML is minified for maximum performance.
*	When paired with the [Azure Static Web Apps](https://azure.microsoft.com/en-us/services/app-service/static/) service or an Azure Blob Storage static website, you automatically get continuous production deployments based on your main Git branch, without ever manually uploading any files.
	*	But you can use it with any other static site host too by running a single build command and then uploading the contents of the site via FTP.

For more details on these enhancements, see "Using the template" below.

## Environment setup

### Required software

Download and install the latest stable versions of these products from their websites.

1.	[Visual Studio Code](https://code.visualstudio.com)
2.	[Node](https://nodejs.org/en/)

### Building and running

Whenever picking up a new version of the template, you need to make sure your dependencies are installed. In Visual Studio Code:

1.	Terminal > New Terminal
2.	`npm install`

When you're ready to see your site:

1.	`npm start`

When you're ready to produce a minified production build of the site in the `build` folder:

1.	`npm run build`

## Using the template

Here are some things to know about using this site template.

### Customizing for your site

At minimum, do this to customize the site for your purposes:

1.	Find and replace `StaticSiteTemplate` with the name of your site
2.	Update the `site` canonical URL in [`astro.config.mjs`](astro.config.mjs)
3.	Update the copyright information in [`src/layouts/*.astro`](src/layouts/)
4.	Replace image assets in `static/images/app` with appropriate logos for your site
5.	Add appropriate information to the [app manifest](static/app.webmanifest)
6.	Give yourself credit in [`humans.txt`](static/humans.txt)

#### Editing the page layout (template)

This site template comes with two page layouts:

*	[`default.astro`](src/layouts/default.astro), which is suitable for most pages and is used whenever a layout is not explicitly chosen by a page.
*	[`plain.astro`](src/layouts/plain.astro), which is useful for popup windows and very custom pages that don't want the standard page chrome, but still want the site's CSS.

There's also [`base.astro`](src/layouts/base.astro), which defines the page skeleton shared by both `default` and `plain`.

### Compatibility

Compatibility with Internet Explorer, Edge Legacy (pre-Chromium), and other non-modern browsers is not a goal. That just applies to the included CSS, though—if you replace my default CSS with something simpler, it would work just fine.

### Stuff you can safely delete

The template includes a few files that aren't necessary that you can feel free to delete.

*	`page2.md` is just an example of how to write a page in Markdown and you should delete it.
*	`humans.txt` is just for your benefit and is not necessary in any way.
*	The `plain.astro` layout isn't used by anything in the template, and don't need it if you don't decide to use it.
*	`staticwebapp.config.json` is only needed if you're deploying to the Azure Static Web Apps service **or** you've changed that file to create client-side redirects.

### Optimization

Production builds will optimize your HTML, CSS, and JavaScript outputs. If you'd also like to optimize images and other assets, you can use [astro-compress](https://github.com/Lightrix/astro-compress). If you do this you'll probably want to remove the `@frontendista/astro-html-minify` dependency. (I chose that one for this template because it's about 60 MB smaller than `astro-compress`.)

### Creating routes and redirects

Use [`staticwebapp.config.json`](static/staticwebapp.config.json) to configure routes and redirects for the app.

This file will be copied as-is to the output folder and [used by the Azure Static Web Apps service](https://docs.microsoft.com/en-us/azure/static-web-apps/routes).

#### Example staticwebapp.config.json

```json
{
	"routes": [
		{ "route": "default.aspx", "serve": "/", "statusCode": 301 }
	],
	"responseOverrides": {
		"404": { "rewrite": "/404/index.html" }
	}
}
```

## Deploying to the web

You have a few options:

### Deploying to Azure Static Web Apps

You can deploy to Azure Static Web Apps with very minimal configuration:

*	When creating the app in Azure Portal, set the build artifacts folder to `build` (it's empty by default).

Once your repo and Azure are set up in this way, whenever your default branch is changed, GitHub will automatically build your site and publish it to Azure without any manual steps.

### Deploying to Azure Blob Storage

You can easily deploy to an Azure Blob Storage static website using GitHub Actions (if your project is on GitHub):

*	[Generate a SAS URL for your storage account and create a Secret in your repo](https://github.com/marketplace/actions/deploy-to-azure-storage#how-to-get-a-sas-url-and-save-it).
*	In GitHub, open this repo's [`.github/workflows/publish.yml`](.github/workflows/publish.yml), edit it, and uncomment the two `push:` and `branches: [ main ]` lines at the top to enable automatic deployments.
	*	If you are using `staticwebapp.config.json` to configure redirects, uncomment the "create redirects" section and fill in the `canonical-url` property.
	*	If you prefer, you can manually trigger a deployment from the Actions tab instead of running automatically.

Once your repo is set up this way, whenever your default branch has changes pushed, GitHub will automatically build your site and publish it to Azure without any manual steps.

Tip: You can use my [`deploy-to-azure-storage`](https://github.com/marketplace/actions/deploy-to-azure-storage) Action to automatically deploy static sites built with other templates, too.

### Deploying to any static file host

You can also deploy the site to any static file host. Just run a production build (`npm run build`; see above) and upload the contents of the `build` folder to a host of your choice.

### Optionally purging an Azure CDN

The deployment workflow included with this template can also automatically purge an associated Azure CDN endpoint whenever the site's contents change, to minimize the length of time when files are stale. Open [`.github/workflows/publish.yml`](.github/workflows/publish.yml) on github.com, and see the instructions near `ENABLE_CDN_PURGE`. Note that CDN purging requires a separate secret in addition to the `DEPLOY_SAS_URL` secret you already set up.

## Technologies used

*	[Astro](https://astro.build) for most features, replacing my old Gulp-powered build pipeline.
*	[TypeScript](https://www.typescriptlang.org/) for JavaScript transpilation.
*	[ESLint](https://eslint.org/) for JavaScript linting and formatting.
*	[SCSS (Sass)](https://sass-lang.com/) for CSS preprocessing and minification.

For more information, including licenses for these packages, check the `node_modules` subfolders.

---

This template is © 2020-2023 Travis Spomer but released to the public domain under the [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0) license. This license does not apply to sites built with this template, nor to external libraries referenced by this template; only the template itself. It is provided as-is and no warranties are made as to its functionality or suitability.
