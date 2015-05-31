
Package.describe({
  name: 'saeho:goodethos',
  summary: "Blog and longform publishing for Meteor. Demo at https://goodethos.com.",
  version: "0.5.8",
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

    'aldeed:collection2@2.3.3',
    'aldeed:simple-schema@1.3.3',
    'awatson1978:browser-detection@1.0.4',
    'copleykj:jquery-autosize@1.17.8',

    'cfs:filesystem@0.1.2',
    'cfs:graphicsmagick@0.0.18',
    'cfs:gridfs@0.0.33',
    'cfs:s3@0.1.3',
    'cfs:standard-packages@0.5.9',

    'iron:router@1.0.7',
    'fourseven:scss@3.1.1',
    'mrt:moment@2.8.1',
    'bozhao:accounts-instagram@0.2.0',
    'meteorhacks:fast-render@2.4.0',
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
   * Client Files
   */
  api.addFiles([
    // Page Commons
    'client/page/page_body.html',
    'client/page/page_body.js',
    'client/page/page_commons.js',

    // Page Blog
    'client/page/page_blog.html',
    'client/page/page_blog.js',
    'client/page/page_blog.scss',
    'client/page/blog/page_blog_header.html',
    'client/page/blog/page_blog_header.js',

    // Page Story
    'client/page/page_story.html',
    'client/page/page_story.js',
    'client/page/page_story.scss',
    'client/page/story/page_story_header.html',
    'client/page/story/page_story_header.js',

    // Profile
    'client/profile/profile.html',
    'client/profile/profile.js',
    'client/profile/profile.scss',
    'client/profile/profile_loop.html',
    'client/profile/profile_loop.js',
    'client/profile/profile_nav.html',
    'client/profile/profile_nav.js',
    'client/profile/profile_quick_post.html',
    'client/profile/profile_quick_post.js',
    'client/profile/redesign/profile_redesign.html',
    'client/profile/redesign/profile_redesign.js',
    'client/profile/redesign/profile_redesign.scss',

    // No Devices
    'client/no/no.scss',
    'client/no/no_device.html',
    'client/no/no_device.js',
  ], 'client')

  /**
   * Server Files
   */
  api.addFiles([
  ], 'server')

  /**
   * Both Server & Client Files
   */
  api.addFiles([
    'lib/router.js',
  ], both)

    // api.addFiles([
    //     'accounts_multi.js',
    //     'accounts_ui.js',
    //     'login_buttons.html',
    //     'login_buttons_single.html',
    //     'login_buttons_dropdown.html',
    //     'login_buttons_dialogs.html',
    //
    //     'login_buttons_session.js',
    //
    //     'login_buttons.js',
    //     'login_buttons_single.js',
    //     'login_buttons_dropdown.js',
    //     'login_buttons_dialogs.js',
    //
    //     'login_buttons.css'
    // ], 'client');
})
