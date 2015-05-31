
// Meteor Collections
Pages = new Meteor.Collection('pages')
Organizations = new Meteor.Collection('organizations')
Comments = new Meteor.Collection('comments')
Topics = new Meteor.Collection('topics')

Meteor.startup(function() {
	// Client Side Code
	if (Meteor.isClient) {

		// Google Analytics
		if (Meteor.settings.public.gaId) {
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','//www.google-analytics.com/analytics.js','ga')
		}

		// Common Subscriptions
		Meteor.subscribe('all-topics')
		Meteor.autorun( (function(){
			Meteor.subscribe('user-o') // Subscribe to user data and their organization
			var user = Meteor.user()
			var o_id = user ? user.organization : false

			// Subscribe to all information related to user's organization.
			// If user doesn't belong to an organization, then subscribe to nothing.
			Meteor.subscribe('o-pubs', o_id)
		}))

		// ESC for closing popups
		$(document).on( 'keyup', function(e){
			// #popup-media has its own close function
			if(e.which==27){
				// If ESC Key was pressed
				if( !$('#popup-media').length && $('#master-popup').length)
					ge.close_popup()
			}
		})
	} // END : isClient

	// Server Side Code
	if (Meteor.isServer) {

		// Register SMTP
		smtp = {
			username: Meteor.settings.smtp.username,
			password: Meteor.settings.smtp.password,
			server: Meteor.settings.smtp.server,
			port: Meteor.settings.smtp.port
		}
		process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;

		// Register Twitter Configurations
		if (Meteor.settings.Twitter) {
			Accounts.loginServiceConfiguration.remove({
				service : 'twitter'
			})
			Accounts.loginServiceConfiguration.insert({
				service     : 'twitter',
				consumerKey : Meteor.settings.Twitter.consumerKey,
				secret      : Meteor.settings.Twitter.secret
			})
		}

		// Register Instagram Configurations
		if (Meteor.settings.Instagram) {
			Accounts.loginServiceConfiguration.remove({
				service: "instagram"
			})
			Accounts.loginServiceConfiguration.insert({
				service: "instagram",
				clientId: Meteor.settings.Instagram.clientId,
				scope:'basic',
				secret: Meteor.settings.Instagram.clientSecret
			})
		}

		// Register Facebook Configurations
		if (Meteor.settings.Facebook) {
			Accounts.loginServiceConfiguration.remove({
				service: "facebook"
			})
			Accounts.loginServiceConfiguration.insert({
				service: "facebook",
				appId: Meteor.settings.Facebook.appId,
				secret: Meteor.settings.Facebook.secret,
			})
		}
	} // END : isServer
})
