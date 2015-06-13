
Package.describe({
  name: 'saeho:goodethos-blog',
  summary: "Blog and longform publishing for Meteor. Demo at https://goodethos.com.",
  version: "0.7.7",
  git: "https://github.com/saeho/goodethos.git"
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

    'meteorhacks:fast-render@2.5.0',
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

    // No Templates
    'client/no/no_staff.html',
    'client/no/no_staff.js',
    'client/no/no_device.html',
    'client/no/no_device.js',
    'client/no/no.css',


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

    // User
    'client/user/all/all.html',
    'client/user/all/all_aids.html',
    'client/user/team/user_team.html',
    'client/user/team/user_team_aids.html',
    'client/user/all/all.js',
    'client/user/all/all_aids.js',
    'client/user/team/user_team.js',
    'client/user/team/user_team_aids.js',
    'client/user/all/all.css',
    'client/user/team/user_team.css',
    'client/user/search.html',

    // Install
    'client/user/install.html',
    'client/user/install.js',
    'client/user/install.css',

    // New Page
    'client/user/new_page/new_page.html',
    'client/user/new_page/new_page.js',
    'client/user/new_page/new_page.css',

    // Edit User
    'client/user_aids/edit_user/edit_user.html',
    'client/user_aids/edit_user/edit_user.js',
    'client/user_aids/edit_user/edit_user.css',
    'client/user_aids/edit_user/eu_brand.html',
    'client/user_aids/edit_user/eu_brand.js',
    'client/user_aids/edit_user/eu_homepage.html',
    'client/user_aids/edit_user/eu_homepage.js',
    'client/user_aids/edit_user/eu_profile.html',
    'client/user_aids/edit_user/eu_profile.js',
    'client/user_aids/edit_user/eu_social.html',
    'client/user_aids/edit_user/eu_social.js',

    // Page Comments
    'client/user_aids/page_comments/page_comments.html',
    'client/user_aids/page_comments/page_comments.js',
    'client/user_aids/page_comments/page_comments.css',

    // Page POD
    'client/user_aids/page_pod/page_draft.html',
    'client/user_aids/page_pod/page_draft.js',
    'client/user_aids/page_pod/page_publish.html',
    'client/user_aids/page_pod/page_publish.js',
    'client/user_aids/page_pod/page-pod.css',

    // Page Settings
    'client/user_aids/page_settings/page_settings.html',
    'client/user_aids/page_settings/page_settings.js',
    'client/user_aids/page_settings/page_settings.css',

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
    'server/collections/settings.js',
    'server/collections/posts.js',
    'server/collections/sImages.js',
    'server/collections/topics.js',
    'server/collections/users.js',

    // Others
    'server/packages/accounts.js',
    'server/social_media.js',
  ], 'server')

  api.addFiles([
   // Editor
   'img/editor/no-user.png',
   'img/editor/no-user-big.png',
   'img/editor/toolbar.png',
   'img/editor/layout-controls.png',
   'img/editor/page-type-icons.png',
   'img/editor/lmi-icons.png',
   'img/editor/if-buttons.png',
   'img/editor/popup-save.png',
   'img/editor/pmc-new.png',
   'img/editor/big-icons.png',
   'img/editor/gal-controls.png',
   'img/editor/pmc-area.png',
   'img/editor/ana.png',
   'img/editor/lmi-bigger.png',
   'img/editor/edit-user.png',

   // Core
   'img/core/profile-sm.png',
   'img/core/404.jpg',
   'img/core/404-mobile.jpg',
   'img/core/stripes.png',
   'img/core/sm-tiny.png',
   'img/core/share-social.png',
   'img/core/nav-master.jpg',
   'img/core/search-small.png',
   'img/core/search-big.png',
   'img/core/mobile-auth.png',
   'img/core/line-height-32.png',
   'img/core/linepaper.png',
   'img/core/commenting-dark-dots.png',
   'img/core/commenting-light-dots.png',
   'img/core/switch-social.png',

   // Logos
   'img/logos/nav-special.png',
   'img/logos/white-boxed.png',
   'img/logos/black.png',
   'img/logos/white.png',

   // Sections
   'img/sections/quick-post.png',

   // No Templates
    'img/no/no-staff.jpg',
    'img/no/no-device-phone.jpg',
    'img/no/no-device-tablet-tall.jpg',
    'img/no/no-device-tablet.jpg',
    'img/no/no-device.jpg',

 ], 'client', { isAsset: true })
})
