
// Local Variables
var Model = {
    username: '',
    email: '',
    password: '',
}
var Validation_User = {
    username: {
//        regEx: /^[0-9a-zA-Z]+$/,
        alphanumeric: true,
        min: 3,
        max: 20,
        error_msg: 'Your username is invalid'
    // unique: true, Ignored by javascript checks. Do a manual DB find()
    // If you need to check for requirement, just set min to 1
    // required: true,
    },
    email: {
        email: true,
        min: 1,
        error_msg: 'Your e-mail address is invalid'
    },
    password: {
        min: 5,
        error_msg: 'Your password is too short'
    },
    confirm: {
        min: 1,
        must_match: 'password',
        error_msg: 'Your passwords did not match'
    },
}

/*
    TODO
    Merge Signin and Signup template into one,
    They both use similar template and JS code.
*/

// Sign Up Template
Template.signup.helpers({
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
	signin_link: function() {
		return this.overlay ?
      { class: 'smaller auth-signin' } :
      { class: 'smaller', href: '/signin' }
	},
  signup: function( type) {
      var signup = Session.get('signup')
      return !_.isUndefined( type) ? type==signup : signup
  },
	error: function() {
		var error = Session.get('error') || {}
		return error.loading || error.msg
		? {
      back: this.overlay ? 'bg-white' : 'bg-alt',
			msg: error.msg || null,
			ok: error.fields ? 'bg-red' : 'bg-green',
			loading: error.loading || false,
		} : false
	},
})
// END: Helpers

Template.signup.events({
    'click .signup-cancel': function(e,t) {
        Session.set('signup', false)
    },
    'input': function(e, t) {
        var errors = ge.validate_collection( t.$('form').serializeArray(), Validation_User, false)

        for (var key in errors) {
            if( $(e.target).attr('name') == key ) {
                if (typeof errors[key] === 'object') {
                    t.$('[name='+key+']').addClass('error-active')
                } else if (errors[key]) {
                    t.$('[name='+key+']').removeClass('error-active')
                }
            }
        }
    },
    'submit': function(e,t) {
        e.preventDefault()

        if( !$('#auth-error-msgs').length) {
            var form_values = t.$('form').serializeArray()
            var check = true
            var errors = {}
            $.each( form_values, function( i,v ){
                if (v.value.length<=0) {
                    check = false
                    return check
                }
            })

            if ( check ) {
                // Not an empty form submission
                var errors_validate = ge.validate_collection( form_values, Validation_User, true)
                for (var key in errors_validate) {
                    if( errors_validate[key] !== true) {
                        if ( !errors.fields) { errors.fields = {} }
                        errors.fields[key] = true
                        errors.msg = errors_validate[key].error_msg
                    }

                    if (typeof errors_validate[key] === 'object') {
                        t.$('[name='+key+']').addClass('error-active')
                    } else if (errors_validate[key]) {
                        t.$('[name='+key+']').removeClass('error-active')
                    }
                }
            } else {
                // Empty form submission
                errors.fields = true
                errors.msg = 'Please fill in all the fields'
            }

            Session.set('error', errors)
            if ( errors.fields) return false
            var form_data = {
                username: t.$('[name=username]').val().toLowerCase(),
                email: t.$('[name=email]').val().toLowerCase(),
                password: t.$('[name=password]').val(),
            }

            Session.set('error',{ loading: true })
            Accounts.createUser( form_data, function(error) {
                if( error) Session.set('error', {fields: true, msg: error.reason})
                else {
                    var popup = {
                        template: 'edit_user',
                        class: 'bg-dim fade-in fixed-full',
                        data: {
                            cur: 'organization',
                            overlay: true,
                        }}
                    if( !t.data || !t.data.overlay) {
                        Meteor.setTimeout( function(){
                            Session.set('popup', popup)
                        }, 500)
                        Router.go('/')
                    } else
                        Session.set('popup', popup)
                }
            }) // END : Create User
        } // END : If prompt is gone
    }
})
// END: Events

Template.signup.created = function() {
	delete Session.keys['error']
    Session.set('signup', false)
}

Template.signup.rendered = function() {
	//$('#auth-main input')[0].focus()
}

Template.signup.destroyed = function() {
	delete Session.keys['error']
    delete Session.keys['signup']
}



// #### Sign Up - Organizations
Template.signup_organization.helpers({
	errorClass: function(key) {
		return Session.get('error') && Session.get('error').fields && Session.get('error').fields[key] ? 'error' : ''
	}
})

// #### Sign Up - Choose Portal
Template.signup_choose.events({
    'click #option-organization': function(){
        Session.set('signup', 'organization')
    },
    'click #option-user': function(){
        Session.set('signup', 'user')
    },
})



// #### Sign Up - Employee Login
Template.signup_user.helpers({
    msg: function(){
        var user = Meteor.user()
        var default_msg = 'Sign in as a user using one of the following social media networks.'
        if( !user) return default_msg

        var service = false

        if( GE_Help.nk( user, 'services.facebook.id'))
            service = 'Facebook'
        else if( GE_Help.nk( user, 'services.twitter.id'))
            service = 'Twitter'
        else if( GE_Help.nk( user, 'services.instagram.id'))
            service = 'Instagram'

        if( service)
            return 'You are currently logged in using <strong>'+service+'</strong>.'
        else
            return default_msg
    }
})
Template.signup_user.events({
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
                    Session.set('error', {fields: false, msg: 'Thank you for signing in!'})
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
