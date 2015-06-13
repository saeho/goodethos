
// Meteor Collections
GE_Posts = new Meteor.Collection('posts')
GE_Settings = new Meteor.Collection('GE_Settings')
GE_Comments = new Meteor.Collection('comments')
GE_Topics = new Meteor.Collection('topics')

// TEMPORARY
Organizations = new Meteor.Collection('organizations')

Meteor.startup(function() {
	// Client Side Code
	if (Meteor.isClient) {

		// Google Analytics
		if (GE_Help.nk(Meteor, 'settings.public.gaId')) {
			(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
			m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
			})(window,document,'script','//www.google-analytics.com/analytics.js','ga')
		}

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
		if (Meteor.settings.smtp) {
			smtp = {
				username: Meteor.settings.smtp.username,
				password: Meteor.settings.smtp.password,
				server: Meteor.settings.smtp.server,
				port: Meteor.settings.smtp.port
			}
			process.env.MAIL_URL = 'smtp://' + encodeURIComponent(smtp.username) + ':' + encodeURIComponent(smtp.password) + '@' + encodeURIComponent(smtp.server) + ':' + smtp.port;
		} else
			smtp = {}
	} // END : isServer
})
