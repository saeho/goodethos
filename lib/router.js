
// Subs that are always stopped at the route's exit
var stopSubs = null

// Subs that continue
var contSubs = new SubsManager({
  cacheLimit: 8,
  expireIn: 4
})

if( Meteor.isClient){
  var before_route = function(args){
    // Default Args
    var defaults = {
        template_name: false, // Template Name
        meta_title: false, // Custom Meta Title
        meta_desc: false, // Custom Meta Desc
    }
    var args = _.isObject(args) ? _.defaults(args, defaults) : defaults

    // If Meta Title/Desc was not set look for preset default values
    if ( !args.meta_title || !args.meta_desc) {
      switch( args.template_name) {
        case 'not_found':
          args.meta_title = args.meta_title || 'Page Not Found | Good Ethos'
          args.meta_desc = args.meta_desc || 'Sorry we could not find the page you were looking for.'
          break
        case 'loading':
          args.meta_title = args.meta_title || 'Loading...'
          break
        case 'user_new_story':
          args.meta_title = args.meta_title || 'Create a New Story | Good Ethos'
          args.meta_desc = args.meta_desc || 'Create a new story on Good Ethos.'
          break
        case 'user_new_event':
          args.meta_title = args.meta_title || 'Create a New Event | Good Ethos'
          args.meta_desc = args.meta_desc || 'Create a new event on Good Ethos.'
          break
        case 'signin':
          args.meta_title = args.meta_title || 'Sign In | Good Ethos'
          args.meta_desc = args.meta_desc || 'Sign in to Good Ethos.'
          break
        case 'signup':
          args.meta_title = args.meta_title || 'Sign Up | Good Ethos'
          args.meta_desc = args.meta_desc || 'Sign up an account for Good Ethos.'
          break
        default:
          args.meta_title = args.meta_title || 'Good Ethos'
          args.meta_desc = args.meta_desc || 'Good Ethos'
      }
    }
    // Set Meta
    var meta = {
        title: args.meta_title,
        desc: args.meta_desc,
        image_src: args.image_src,
    }
    ge.set_meta(meta)

    // Reset Nav before every route
    $('#overlord').removeClass('up down nav-switch')
  }

  // Deny access to these templates for mobile/tablet devices
  var template_no_mobile = function( name){
    if( (Meteor.Device.isTablet() || Meteor.Device.isPhone())
    && (_.contains( ['user_new_story','user_new_event'], name) || name===true))
      return true
    return false
  }

  // Rerouted templates - i.e. Shared templates
  var template_reroute = {
    user_new_story: 'user_new_page',
    user_new_event: 'user_new_page'
  }
  // Denied templates - i.e. Not enough user level or temporarily offline
  var template_deny = {
    user_new_page: { level: 11 }, // 10 is max level, 11 means it is not meant to be routed to
  }

  /**
   * You mustn't use Router.configure() because this is a package, not an app.
   */
  var onBefore = function(){
    ga('create', Meteor.settings.public.gaId, 'auto')
    ga('send', 'pageview')
    if( Meteor.Device.isTablet() || Meteor.Device.isPhone())
      Session.set('nav_state', false)
  }
  var defRoute = {
    layoutTemplate: 'GE_layout',
    notFoundTemplate: 'not_found',
    loadingTemplate: 'loading',
    fastRender: true,
    onBeforeAction: function(){
      onBefore()
      this.next()
    },
    onStop: function(){
      if (stopSubs) stopSubs.stop() // Always stop Route-specific Mongo subscriptions after every route
      ge.close_popup() // Always close popup after every route
      window.scrollTo(0,0) // Scroll to top before changing route (Necessary in a SPA)
    }
  }

  Router.route('/blog', _.defaults({
    name: 'blog',
    onBeforeAction: function() {
      onBefore()
      before_route( { template_name: 'signup' } )
      this.next()
    },
    waitOn: function(){
      return contSubs.subscribe('o-pubs')
    },
    action: function() {
      // Profile Found
      var o_data = { brand: {} } // TODO : THIS!!
      var this_template = 'blog'
      var meta = {
        template_name: this_template,
        meta_title: 'Blog',
        meta_desc: 'Blog', // Blog Description
      }

      Session.set('brand', o_data)
      before_route(meta)
      this.render(this_template, { data: { o: o_data } })
    }
  }, defRoute))

  Router.route('/blog/signin', _.defaults({
    name: 'GE_signin',
    layoutTemplate: 'auth',
    template: 'signin',
    onBeforeAction: function() {
      onBefore()
      before_route( { template_name: 'signin' } )
      this.next()
    }
  }, defRoute))

  Router.route('/blog/signup', _.defaults({
    name: 'GE_signup',
    layoutTemplate: 'auth',
    template: 'signup',
    onBeforeAction: function() {
      onBefore()
      before_route( { template_name: 'signup' } )
      this.next()
    }
  }, defRoute))

  Router.route('/blog/user/:_action', _.defaults({
    name: 'user',
    onBeforeAction: function() {
      onBefore()

      // Set "Layout" session which controls the layout options for every Template.
      var layout_session = { hide_footer: true }

      if( Meteor.Device.isPhone() || Meteor.Device.isTablet())
        layout_session.fixed = true

      Session.set('GE_layout', layout_session)
      Session.set('brand', false)

      var no_mobile = template_no_mobile('user_'+this.params._action)
      if(no_mobile)
        this.render('no_device')
      else
        this.next()
    },
    waitOn: function(){
      return contSubs.subscribe('o-pubs')
    },
    action: function(){
      var user = Meteor.user()
      var this_template = 'user_'+this.params._action // For this route, the template name is the action parameter.
      var this_data = {}

      if (user){
        if (_.has( template_reroute, this_template))
          this_template = template_reroute[ this_template] // Rerouted templates
        else if (_.has( template_deny, this_template)){
          // TODO : Level check for users
          // if ( template_deny[ this_template].level <= Meteor.user().level)
          // TODO : Create "DENIED" Template
          this_template = 'user_denied'
        }

        // If the requested template was found
        if (Template[this_template]){
          if (user.isStaff){
            this_data = {
              action: this.params._action,
              editing: 1
            }
          } else
            this_template = 'no_staff'
        } else
            this_template = 'not_found'
     } else {
         // If NOT logged in
         this_template = 'signin'
         this.layout('auth')
     }

     before_route( { template_name: this_template } )
     this.render( this_template, { data: this_data })
   }
  }, defRoute))
  /*
    Route: Edit Posts
  */
  Router.route('/blog/:_page/:_action?', _.defaults({
    name: 'GE_post',
    onBeforeAction: function() {
      onBefore()
      var allowed = ['edit'] // Allowed actions

      if( this.params._action && !_.contains(allowed, this.params._action))
        this.render('not_found')
      else if( this.params._action && (Meteor.Device.isTablet() || Meteor.Device.isPhone())){
        Session.set('GE_layout',{ hide_footer: true })
        this.render('no_device') // All editing is disabled for mobile
      } else
        this.next()
    },
    waitOn: function() {
      var args = this.params._action
        ? { p_id: this.params._page }
        : { p_slug: this.params._page }
      return contSubs.subscribe('single-page', args)
    },
    action: function() {
      var page = this.params._page
      var user = Meteor.user()

      var p_data = GE_Posts.findOne({ $or: [{ _id: page },{ slug: page }] })

      // Assume page wasn't found until it's found.
      var this_template = 'not_found'
      var this_data = {}
      var meta = {}

      if( p_data && p_data.info.type){
        if (!this.params._action && p_data.status>=4 && this.params._page==p_data._id){
          Router.go('GE_post', { _page: p_data.slug }) // If published and in view-mode, redirect to slug url
          return // Redirected
        } else if(this.params._action && (!user || !user.isStaff)) {
          this.layout('auth')
          this_template = 'signin'
        } else {
          var content = p_data.content

          this_data = { page: p_data }
          this_template = 'page_'+p_data.info.type
          meta.meta_title = content.title || 'Untitled '+GE_Help.capitalize(p_data.info.type)
          meta.meta_desc = content.summary && content.summary.length>25 ? content.summary : ge.excerpt(content.body)
          meta.image_src = ge.featured_img(content, 'medium') // Find img to display for Social Sharing

          this.layout('GE_layout', { data: {
            page: p_data,
            share_url: 'blog/'+p_data.slug
          }})
        }
      }

      meta.template_name = this_template
      before_route(meta)
      this.render( this_template, { data: this_data })
    } // END : Ready
  }, defRoute))
}
