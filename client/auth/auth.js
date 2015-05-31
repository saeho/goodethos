/**
 * TODO, depreciate 'error' session and remove its use.
 * Currently the 'error' session is only used for auth signin/signup
 */
var auth_pip_close = {
	'click .ok': function(e,t){
	  var errorSession = Session.get('error')
	  if (!$(e.currentTarget).hasClass('pc-close') && errorSession) {
			t.$('#popup-in-popup').removeClass('pop-in-soft').addClass('pop-out-soft')
			Meteor.setTimeout( function(){
				errorSession.msg = false
				errorSession.loading = false
	  		Session.set('error', errorSession)
			},350)
	  }
	}
}

Template.signin.events(auth_pip_close)
Template.signup.events(auth_pip_close)

Template.auth.created = function() {
	// Reset
	Session.set('layout',{ hide_footer: true, hide_header: true })
	Session.set('popup', false)
}
