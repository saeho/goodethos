

// Helpers for Service Icon
Template.commenting_service.helpers({
	serviceIs: function( val){
		var service = Session.get('account')
		return service==val || this.notFaded
	},
})

// Helpers
Template.commenting.helpers({
	animate: function(){
		return this.page_type!='blog'
	},
	user: function(){
		var user = Meteor.user()
		if( !user) return false

		var isImg = true
		var account = Template.instance().getService( Session.get('account'), user)
		Session.set('account', account)

		switch( account){
			case 'facebook':
				var img = 'http://graph.facebook.com/'+GE_Help.nk( user, 'services.facebook.id')+'/picture'
				var name = GE_Help.nk( user, 'services.facebook.name')
				break
			case 'instagram':
				var img = GE_Help.nk( user, 'services.instagram.profile_picture')
				var name = GE_Help.nk( user, 'services.instagram.full_name')
				break
			case 'twitter':
				var img = GE_Help.nk( user, 'services.twitter.profile_image_url_https')
				var name = '@'+GE_Help.nk( user, 'services.twitter.screenName')
				break
			case 'good ethos':
				var o = Organizations.findOne( user.organization) || {}
				if( !o || o._id!=this.o_id) Session.set('account', false) // Only allow organization commenting if this is their own page
				else {
	        var img = ge.responsive_img( GE_Help.nk( o, 'brand.logo'), 'thumb')
	        var img = img ? 'background-image: url(\''+img+'\');' : ''
				}
				isImg = false
				var name = GE_Help.return_shorter( GE_Help.nk( o, 'name.full'), GE_Help.nk( o, 'name.short'))
		}

		return {
			isAccepted: (account && account!='good ethos') || this.o_id==user.organization,
			isOwner: this.o_id==user.organization,

			isImg: isImg,
			img: img,
			name: name,

			service: GE_Help.capitalize( account, true)
		}
	},
	comments: function(){
		if( Template.instance().subscription && !Template.instance().subscription.ready()) return false
		return GE_Comments.find({}, { sort: { 'date.commented': -1 }}).fetch()
	},
	enabled: function(){
		var parent = Template.parentData()

		if( this.page_type!='blog' && GE_Help.nk( parent, 'page.info.comment')===false )
			return false

		return true
	},
})

// Events
Template.commenting.events({
	'submit #new-comment': function(e,t){
		e.preventDefault()

		var message = t.$('textarea#comment-message').val()
		var user = Meteor.user()
		var account = Template.instance().getService( Session.get('account'), user)

		if( _.has( t.data, '_id') && account && user && message.length){
			var ts = new Date().getTime()
			if( _.isUndefined( t.timestamp) || (ts-t.timestamp)>20000) {
				GE_Comments.insert({
					user: user._id,
					organization: user.organization,

					page_id: t.data._id,
					page_type: t.data.page_type,
					o_id: t.data.o_id,

					message: message,
					account: account,
					date: {
						commented: new Date(),
						edited: new Date(),
					},
				})
				t.$('textarea#comment-message').val('')
				t.timestamp = ts
			} else {
				alert("You are commenting too fast, please wait a little bit.")
			}
		}
	},
	'click .switch-social': function(e,t){
		var user = Meteor.user()
		var cur_acc = Session.get('account')
		var social = $(e.currentTarget).data('social')

		if( cur_acc!=social && _.contains( ['instagram','twitter','facebook','good ethos'], social)){
			if( GE_Help.nk( user, 'services.'+social+'.id')) Session.set('account', social)
			else {

				if( user && cur_acc=='good ethos') var proceed = confirm("By proceeding, you will be logged out of your current account.");
				else var proceed = true

				if( proceed){
					switch (social){
						case 'twitter':
							Meteor.loginWithTwitter( function(err){
								if( !err) Session.set('account', social)
							})
							break
						case 'instagram':
							Meteor.loginWithInstagram( function(err){
								if( !err) Session.set('account', social)
							})
							break
						case 'facebook':
							Meteor.loginWithFacebook( function(err){
								if( !err) Session.set('account', social)
							})
							break
						case 'good ethos':
							if( user.organization==t.data.o_id){
								Session.set('account', social)
							}
							break
					} // END : Switch
				} // END : JS Confirm
			}
		}
	},
})

Template.commenting.created = function(){
	if( !this.data.overlay) this.subscribe('comments', this.data || {} )
	var o_id = this.data.o_id
	this.getService = function( session, user){
		if( !session && user){
			if( user.organization==o_id) return 'good ethos'
			_.every( user.services, function( service, name){
				if( _.contains( ['instagram','twitter','facebook'], name)){
					session = name
					return false
				} else return true
			})
		}
		return session
	}
}

Template.commenting.rendered = function(){
	$('#comment-message').autosize()
}

Template.commenting.destroyed = function(){
	$('#comment-message').remove() // Manually destroy all autosize
	delete Session.keys['account']
}
