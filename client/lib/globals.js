globals = {

	// Use "ref" instead of "class" so that functions that use this object can use the name "class"

	/*
	nav_main: {
		title: 'Sections',
		submenu: [
			{title: 'Good Ethos', route: 'goodethos', ref: 'goodethos'},
			// {title: 'Good Company', route: 'goodcompany', ref: 'good.path()company'},
			// {title: 'Good Reads', route: 'goodreads', ref: 'goodreads'},
			// {title: 'Good Company', route: false, ref: 'goodcompany'},
			// {title: 'Good Reads', route: false, ref: 'goodreads'},
		]
	},
	*/

	nav_about: {
		title: 'Good Ethos',
		submenu: [
			{title: 'Good Ethos', route: 'goodethos', ref: 'goodethos'},
			// {title: 'About GE', route: 'about'},
			{title: 'About GE', route: false},
			// {title: 'FAQs', route: 'about/faqs'},
			{title: 'FAQs', route: false},
		]
	},

	nav_social: {
		title: 'Elsewhere',
		submenu: [
			{title: 'Facebook', url: 'https://www.facebook.com/goodethos', key: 'fb'},
			{title: 'Twitter', url: 'https://twitter.com/good_ethos', key: 'tw'},
			//{title: 'Google+', url: 'https://plus.google.com/115072596612122703031', key: 'gp'},
		]
	},

	// Layout Globals
	canvas_layouts: ['full-back'],
	no_header_layouts: ['event-slideshow'],
	merged_layouts: ['event-timeline'],
}
