
var prev_state = {}
var cur_obj = {}
var state = function(){
	var form_data = $('form#edit-user').serializeArray()
	var new_cur = {}
	_.each( form_data, function( item){
		new_cur[ item.name] = item.value
	})
	return new_cur
}

Template.eu_profile.events({
	'click .verify-email': function(e,t){
		var user = Meteor.user() || {}
		var req_email = false
		_.each( user.emails, function(email){
			if( !email.verified) {
				// By default Meteor Accounts verify email method only attempt to verify the first unverified email
				req_email = '<u>'+email.address+'</u>'
				return true // Exit
			}
		})

		if (req_email) {
			$(e.currentTarget).removeClass('verify-email red')
			var popup = Session.get('popup')
			popup.data.pip = {
				msg: 'E-mail verification sent to '+req_email+'.'
			}
			Session.set('popup', popup)
			Meteor.call( 'send_email_verification', user._id)
		}
	},
	'input input': function(e,t){
		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var check = _.isEqual( prev_state, cur_obj)

		if( check) t.$('#save-button').removeClass('perm')
		else t.$('#save-button').addClass('perm')
	},
	// Don't use 'submit', because the <form> DOM is outside this Template, so it won't work
	'click #save-button': function(e,t){
		e.preventDefault()

		cur_obj = state()
		if( _.isEmpty(prev_state)) prev_state = cur_obj

		var user = Meteor.user() || {}
		var popup = Session.get('popup')

		var equal_check = _.isEqual( prev_state, cur_obj)
		if( equal_check) $(e.currentTarget).removeClass('perm')
		else $(e.currentTarget).addClass('perm')

		if( !cur_obj.cur_pwd && (cur_obj.pwd || cur_obj.pwd_repeat)) {
			// If user didn't put in their current password but tried to change the password
			popup.data.pip = { msg: 'You must enter your current password if you wish to change your password.' }
			Session.set('popup', popup)

		} else if ( cur_obj.cur_pwd && cur_obj.pwd!=cur_obj.pwd_repeat) {
			popup.data.pip = { msg: 'Your new passwords did not match.' }
			Session.set('popup', popup)

		} else if ( cur_obj.cur_pwd && cur_obj.pwd==cur_obj.pwd_repeat && cur_obj.pwd.length<5) {
			// TODO : Add a server side verification for passwords
			popup.data.pip = { msg: 'Your password must be at least 5 characters long.' }
			Session.set('popup', popup)

		} else if( !equal_check) {
			popup.data.pip = { loading: true }
			Session.set('popup', popup)

			var updateObj = cur_obj
			_.each( cur_obj, function( item, key){
				if( key.indexOf('emails.')===0 && item!=prev_state[ key])
					updateObj[ key.replace( '.address', '.verified')] = false
			})
			var updatePwd =
				cur_obj.pwd && cur_obj.pwd_repeat && cur_obj.cur_pwd
				&& cur_obj.pwd.length>=5
				&& cur_obj.pwd==cur_obj.pwd_repeat && cur_obj.cur_pwd

			Meteor.users.update( Meteor.userId(), {
				$set: updateObj
			}, function(err,res){
				prev_state = cur_obj
				// Set Popup In Popup msg
				if (!updatePwd) {
					popup.data.pip = { msg: (err && err.error==409 ? 'That email address already exists.' :  'Your profile was updated.') }
					Session.set('popup', popup)
				}
			})

			if( updatePwd){
				Accounts.changePassword( cur_obj.cur_pwd, cur_obj.pwd, function(err,res){
					if( err)
						popup.data.pip = { msg: err.reason }
					else
						popup.data.pip = { msg: 'Your password was updated.' }
					Session.set('popup', popup)
				})
			}
		}
	},
})

Template.eu_profile.rendered = function(){
	prev_state = state()
}
