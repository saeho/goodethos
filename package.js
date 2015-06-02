
Package.describe({
  name: 'saeho:goodethos',
  summary: "Blog and longform publishing for Meteor. Demo at https://goodethos.com.",
  version: "0.5.9",
})

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.1.0.2')

  var both = ['client','server']

  api.use([
    'accounts-facebook',
    'accounts-password',
    'accounts-twitter',
    'email',
    'fastclick',
    'http',
    'templating',
    'underscore',

    'aldeed:collection2@2.3.3',
    'aldeed:simple-schema@1.3.3',
    'awatson1978:browser-detection@1.0.4',
    'copleykj:jquery-autosize@1.17.8',

    'cfs:filesystem@0.1.2',
    'cfs:graphicsmagick@0.0.18',
    'cfs:gridfs@0.0.33',
    'cfs:s3@0.1.3',
    'cfs:standard-packages@0.5.9',

    'meteorhacks:subs-manager@1.4.0',

    'iron:router@1.0.7',
    'mrt:moment@2.8.1',
    'bozhao:accounts-instagram@0.2.0',
    'mystor:device-detection@0.2.0',
    'richsilv:pikaday@1.0.0',
  ], both);

  api.imply('accounts-facebook', both)
  api.imply('accounts-password', both)
  api.imply('accounts-twitter', both)
  api.imply('email', both)
  api.imply('fastclick', both)
  api.imply('http', both)

  /**
   * Both Server & Client Files
   */
  api.addFiles([
    'lib/collections/images.js',
    'lib/bootstrap.js',
    'lib/ge.js',
    'lib/ge_help.js',
    'lib/router.js',
  ], both)

  /**
   * Client Files
   */
  api.addFiles([
    // Lib
    'client/lib/ge_editor.js',
    'client/lib/ge_js.js',
    'client/lib/ge_media.js',
    'client/lib/ge_uploader.js',
    'client/lib/globals.js',

    'client/lib/core.css',
    'client/lib/animations.css',
    'client/lib/ge-editor.css',

    // Layout
    'client/layout.html',
    'client/layout.js',

    // Auth
    'client/auth/auth.html',
    'client/auth/signin.html',
    'client/auth/signup.html',
    'client/auth/auth.css',
    'client/auth/auth.js',
    'client/auth/signin.js',
    'client/auth/signup.js',

    // Page Blog
    'client/page/page_blog.html',
    'client/page/blog/page_blog_header.html',
    'client/page/page_blog.css',
    'client/page/page_blog.js',
    'client/page/blog/page_blog_header.js',

    // Page Story
    'client/page/page_story.html',
    'client/page/story/page_story_header.html',
    'client/page/page_story.css',
    'client/page/page_story.js',
    'client/page/story/page_story_header.js',

    // Page Commons
    'client/page/page_body.html',
    'client/page/page_body.js',
    'client/page/page_commons.js',

    // Profile
    'client/blog/blog.html',
    'client/blog/blog.js',
    'client/blog/blog.css',
    'client/blog/blog_loop.html',
    'client/blog/blog_loop.js',
    'client/blog/blog_nav.html',
    'client/blog/blog_nav.js',
    'client/blog/blog_quick_post.html',
    'client/blog/blog_quick_post.js',
    'client/blog/redesign/blog_redesign.html',
    'client/blog/redesign/blog_redesign.js',
    'client/blog/redesign/blog_redesign.css',

    // No Devices
    'client/no/no.css',
    'client/no/no_device.html',
    'client/no/no_device.js',

    // Nav Master
    'client/nav_master/nav_master.html',
    'client/nav_master/nav_master.js',
    'client/nav_master/nav_master.css',

    // Header
    'client/commons/header/co_menu.html',
    'client/commons/header/co_menu.js',
    'client/commons/header/header.html',
    'client/commons/header/header.js',
    'client/commons/header/header.css',

    // Footer
    'client/commons/footer/footer.html',
    'client/commons/footer/footer.js',

    // Commons
    'client/commons/ge_editor.html',
    'client/commons/ge_editor.js',
    'client/commons/globals.js',
    'client/commons/not_found.html',
    'client/commons/not_found.js',
    'client/commons/social_media_tmpl.html',
    'client/commons/social_media_tmpl.js',

    // Elements
    'client/commons/elements/author_pic.html',
    'client/commons/elements/author_pic.js',
    'client/commons/elements/button.html',
    'client/commons/elements/button.js',

    // Popup
    'client/commons/popup/popup_master.html',
    'client/commons/popup/popup_master.js',
    'client/commons/popup/GE_pip.html',
    'client/commons/popup/GE_pip.js',
    'client/commons/popup/popup_media.html',
    'client/commons/popup/popup_media.js',
    'client/commons/popup/popup_media.css',
    'client/commons/popup/popup_media_pip.html',

    // Mobile
    'client/commons/mobile/mobile_header.html',
    'client/commons/mobile/mobile_header.js',
    'client/commons/mobile/mobile_header.css',
    'client/commons/mobile/mobile_nav.html',
    'client/commons/mobile/mobile_nav.js',
    'client/commons/mobile/mobile_nav.css',

    // Helpers
    'client/commons/helpers/time.html',
    'client/commons/helpers/time.js',

    // Commenting
    'client/commons/commenting/comment_single.html',
    'client/commons/commenting/comment_single.js',
    'client/commons/commenting/commenting.html',
    'client/commons/commenting/commenting.js',
    'client/commons/commenting/commenting.css',
    'client/commons/commenting/commenting_book.html',
    'client/commons/commenting/commenting_book.js',

  ], 'client')

  /**
   * Server Files
   */
  api.addFiles([
    // Collections
    'server/collections/comments.js',
    'server/collections/images.js',
    'server/collections/organizations.js',
    'server/collections/posts.js',
    'server/collections/sImages.js',
    'server/collections/topics.js',
    'server/collections/users.js',

    // Others
    'server/packages/accounts.js',
    'server/social_media.js',
  ], 'server')
})
