
Template.signin.helpers({
	main_attr: function() {
		var attr = {
			class: 'relative'+(this.passover ? '' : ' pop-in-soft'),
			id: 'auth-main'
		}
		if( this.overlay) {
			attr.class += " shadow-big auth-popup"
		}
		return attr
	},
	signup_link: function() {
		return this.overlay ?
			{ class: 'smaller auth-signup' }
			: { class: 'smaller', href: Router.routes['GE_signup'].url() }
	},
	error: function() {
		var error = Session.get('error') || {}
		return error.loading || error.msg
		? {
			back: this.overlay ? 'bg-white' : 'bg-alt',
			msg: error.msg || null,
			ok: error.fields ? 'bg-red' : 'bg-green pc-close',
			loading: error.loading || false,
		} : false
	},
	errorClass: function(key) {
		var error = Session.get('error') || {}
		return error.fields && error.fields[key] ? 'error' : ''
	}
});

Template.signin.events({
	'input': function(e, t) {
		var user_or_email = t.$('[name=user_or_email]').val()
		var password = t.$('[name=password]').val()
		var button = t.$('button.submit-button')

		if( user_or_email && password) {
			button.addClass('perm')
		} else {
			button.removeClass('perm')
		}

		$(e.currentTarget).removeClass('error')
	},
	'submit': function(e, t) {
		e.preventDefault()

		if( !$('#auth-error-msgs').length) {
			var user_or_email = t.$('[name=user_or_email]').val().toLowerCase()
			var password = t.$('[name=password]').val()
			var errors = {}

			if (!user_or_email && !password) {
				errors.fields = {
					user_or_email: true,
					password: true
				}
				errors.msg = 'Please fill in all fields'
			} else if (!user_or_email) {
				errors.fields = { user_or_email: true }
				errors.msg = 'Email or username is required'
			} else if (!password) {
				errors.fields = { password: true }
				errors.msg = 'Password is required'
			}

			Session.set('error', errors)
			if ( _.isEmpty( errors)) {
				Session.set('error',{ loading: true })
				Meteor.loginWithPassword(user_or_email, password, function(error) {
					if (error)
						Session.set('error', {msg: error.reason, fields: true})
					else {
						if( GE_Help.nk( t, 'data.overlay'))
							Session.set('error', {msg: 'You are now logged in', ok: 'bg-green pc-close' })
						else {
							var user = Meteor.user()
							var route = Router.current().route.getName()

							if(route=='signin'){
								if(user.organization){
									// Do the findOne(). Session is not always ready in time.
									var o = Organizations.findOne( user.organization)
									if( o && o.slug)
										Router.go('/'+o.slug)
								} else
									Router.go('/')
							}
						}
						Meteor.call( 'notify', 'logged-in')
					}
				})
			} // END : NO Errors
			return false
		} // END : If Prompt is gone
	},
  'click .share-social': function(e,t){

      var callback = function(err){
          if (err)
              Session.set('error', {fields: false, msg: 'Sorry, we could not log you in.'})
          else {
              var has_o = false
              var user = Meteor.user()
              if( !t.data || !t.data.overlay){
                  var o = user.organization ? Organizations.findOne( user.organization) : false

                  if( o && o.slug){
                      has_o = true
                      Router.go('/'+o.slug)
                  } else
                      Router.go('/')
              } else if( user.organization){
                  has_o = true
                  Session.set('error', {fields: false, msg: 'Thank you for signing in!' })
              }

              // If no organization
              if( !has_o){
                  Meteor.setTimeout( function(){
                      Session.set('popup', {
                          template: 'edit_user',
                          class: 'bg-dim fade-in fixed-full',
                          data: {
                              cur: 'organization',
                              overlay: true,
                          }
                      })
                  }, ( !t.data || !t.data.overlay ? 500 : 0))
              }
          }
      }

      if( $(e.currentTarget).hasClass('ss-fb'))
          Meteor.loginWithFacebook( callback)
      else if( $(e.currentTarget).hasClass('ss-tw'))
          Meteor.loginWithTwitter( callback)
      else if( $(e.currentTarget).hasClass('ss-is'))
          Meteor.loginWithInstagram( callback)
  },
})


Template.signin.created = function() {
	delete Session.keys['error']
}

Template.signin.rendered = function() {
	$('#auth-main input')[0].focus()
}

Template.signin.destroyed = function() {
	delete Session.keys['error']
}
