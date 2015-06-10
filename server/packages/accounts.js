
Accounts.emailTemplates.from = 'Good Ethos <hello@goodethos.com>';
Accounts.emailTemplates.siteName = 'Good Ethos';
Accounts.emailTemplates.verifyEmail.subject = function(user) {
	return 'Please Confirm Your E-Mail Address'
}

// A Function that takes a user object and a url, and returns the body text for the email.
// Note: if you need to return HTML instead, use Accounts.emailTemplates.verifyEmail.html
Accounts.emailTemplates.verifyEmail.html = function(user, url) {
	return '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">\
	<html xmlns="http://www.w3.org/1999/xhtml">\
	    <head>\
	        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />\
	        <title>Please Verify Your E-Mail Address</title>\
	        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\
	        <style>\
	            body, table {\
	                font: 15px/23px "Helvetica Neue", "Lucida Grande", "Lucida Sans Unicode", Helvetica, Arial, Verdana, sans-serif;\
	                color: #555; font-weight: 400; }\
				table { max-width: 640px; width: 100%; padding: 20px 20px 40px; }\
	            a { color: #2e9b3d; }\
	            a:hover { color: #2e9b3d; text-decoration: underline; }\
\
	            td { display: block; }\
	        </style>\
	    </head>\
\
	    <body style="margin: 0; padding: 0;">\
	        <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">\
	            <tr>\
	                <td style="border-bottom: solid 1px #ccc; padding: 0 0 10px; margin: 0 0 20px;">\
	                    <img src="https://goodethos.com/assets/logos/black.png" width="125" height="41" />\
	                </td>\
	                <td>\
	                    <p>\
	                        Hello, welcome to Good Ethos!\
	                    </p>\
	                    <p>\
	                        Please confirm your e-mail address by clicking the link below:<br />\
	                        '+url.replace('http://','https://')+'\
	                    </p>\
	                    </p>\
	                        If you have any questions, feedback, or need assistance, please e-mail us at <a href="mailto:hello@goodethos.com">hello@goodethos.com</a>.\
	                    </p>\
	                </td>\
	            </tr>\
	        </table>\
	    </body>\
\
	</html>'
}

Accounts.onCreateUser(function(options, user) {
	// This function is also triggered even if the user registration fails
	// Wait for Meteor to create the user before sending an email
	if( user && _.has( user, 'emails')){
		Meteor.setTimeout(function() {
			var check = Meteor.users.findOne( user._id)
			if (check){
				Accounts.sendVerificationEmail( check._id)

				// Notification
				Email.send({
					from: 'notifier@goodethos.com',
					to: 'hello@goodethos.com',
					subject: check.username+' Registered',
					text: 'User ID is '+check._id+ ' email is '+GE_Help.nk( check, 'emails.0.address')
				})
			}
		}, 2000)
	}
	return user
})

Meteor.methods({
	send_email_verification: function(user_id){
		var user = Meteor.users.findOne(user_id)
		if (user && _.has(user, 'emails')){
			Meteor.setTimeout(function() {
				Accounts.sendVerificationEmail(user_id)
			}, 2000)
		}
	},
})
