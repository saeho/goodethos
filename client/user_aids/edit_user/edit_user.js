var prev_state = {}
var cur_obj = {}

Template.edit_user.helpers({
	tmpl: function(){
		switch( this.cur){
			case 'profile': return 'eu_profile'
			case 'organization': return 'eu_homepage'
			case 'social': return 'eu_social'
			case 'brand': return 'eu_brand'
			default: return null
		}
	},
	form_data: function(){
		var user = Meteor.user()
		if (!user) return false
		var o = GE_Settings.findOne({ type: 'site_info' })

		var disabled = !ge.user_can('control_profile', (user.level || 0))

		if( this.cur=='profile')
			var show_button = GE_Help.nk( user, 'services.password') ? true : false
		else
			var show_button = user.isStaff

		var isProfile = GE_Help.nk( user, 'services.password') ? true : false
		var form_data = {
			has_o: user.isStaff,
			input_class: 're-wrapper',
			label_class: 'small-label',
			disabled: disabled,
			show_button: show_button && (!disabled || this.cur=='profile')
		}

		switch(this.cur){
			case 'profile':
				// # # # #
				// Profile
				var name = [{
					allow_edit: isProfile,
					value: ge.get_name(user, 'first'),
					key: 'name.first',
					placeholder: 'First Name'
				},{
					allow_edit: isProfile,
					value: ge.get_name(user, 'last'),
					key: 'name.last',
					placeholder: 'Last Name',
				}]
				var emails = []
				_.each( user.emails, function( email, index){
					emails.push({
						value: email.address,
						verified: email.verified,
						name: 'emails.'+index+'.address',
					})
				})

				return _.extend(form_data, {
					name: name,
					emails: emails
				})
			case 'social':
				// # # # #
				// Social
				if(o){
					var social_media = ['facebook','twitter','instagram','linkedin','gplus','web']
					social_media = _.map( social_media, function( sm){

						var sm_attr = {
							class: 'sm-input '+sm+(disabled ? ' stripes' : ''),
							'data-type': sm,
							value: GE_Help.nk(o, 'social_media.'+sm),
							type: 'text',
							name: 'social_media.'+sm,
							placeholder: (sm!='gplus' ? GE_Help.capitalize( sm) : 'Google+ ')+' URL'
						}
						if( disabled) sm_attr.disabled = disabled

						return {
							icon: 'eu-icon-'+sm,
							attr: sm_attr
						}
					})
					return _.extend( form_data, { social_media: social_media })
				} else return false // New user, no organization found
		case 'organization':
			// # # # #
			// Organization
			if (o && user.isStaff){
				var name = [{
					label: 'App or Site Name',
					label_class: form_data.label_class,
					value: o.site_name,
					key: 'site_name',
					placeholder: 'Full Publication Name',
					disabled: disabled
				},{
					value: o.site_shortname,
					key: 'site_shortname',
					placeholder: 'Short Name',
					class: 'input-small',
					disabled: disabled
				}]
				return _.extend( form_data, {
					name: name,
					description: o.description
				})
			} else return false // New user, no organization found
			case 'brand':
				// # # # #
				// Brand
				if(o){
					var logo_url = ge.responsive_img( GE_Help.nk(o, 'brand.logo'), 'small')
					var logo_style = logo_url!=null ? 'background-image: url(\''+logo_url+'\');' : ''

					var photo_url = ge.responsive_img(user.profile_img, 'small')
					var photo_style = photo_url!=null ? 'background-image: url(\''+photo_url+'\');' : ''

					return _.extend( form_data, {

						logo_key: GE_Help.nk(o, 'brand.logo.key'),
						logo_style: logo_style,

						photo_key: GE_Help.nk(user, 'photo.key'),
						photo_style: photo_style,

						isProfile: isProfile,
						showButton: !disabled || isProfile,
					})
				} else return false
		}
	},
})


// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
// Events
// # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
Template.edit_user.events({
	'input #name\\.full': function(e,t){
		var val = $(e.currentTarget).val()

		if( val.length>=4) t.$('#create-button').removeClass('invis-50').find('button').addClass('perm')
		else t.$('#create-button').addClass('invis-50').find('button').removeClass('perm')
	},
	'submit': function(e,t){
		e.preventDefault()
	}
})

Template.edit_user.created = function(){
	var user = Meteor.user() || {}
	if (user.isStaff) this.subscribe('futureImages', true)

	this.autorun( (function(){
		var newLogo = Session.get('new_logo_img')
		var newPhoto = Session.get('new_photo_img')

		if (newLogo || newPhoto){
			var o = GE_Settings.findOne({ type: 'site_info' })
			var future_images = sImages.find().fetch()

			_.each( future_images, function(img){

				if (img.hasStored('smedium') && img.hasStored('ssmall') && img.hasStored('sthumb')) {
					if (img._id==GE_Help.nk( newLogo, 'key')) {
						if (GE_Help.nk(o, 'logo.key')) sImages.remove( o.logo.key)
						Meteor.call('update_site_info', { 'brand.logo': newLogo })

						Session.set('saving',false)
						Session.set('new_logo_img', false)

					} else if (img._id==newPhoto.key) {
						var user = Meteor.user() || {}
						if (GE_Help.nk(user, 'profile_img.key')) sImages.remove(user.profile_img.key)
						Meteor.call('update_profile_img', newPhoto)

						Session.set('saving',false)
						Session.set('new_photo_img',false)
					}

					var session = Session.get('popup')
					session.data.pip = true
					Session.set('popup', session)
				} // END : If this was the uploaded logo
			})
		}
	}).bind(this))

	this.autorun( function(){
		var user = Meteor.user()
		if( !user) Session.set('popup', false)
	})
}

Template.edit_user.rendered = function(){
	Session.set('saving',false)
	Session.set('new_logo_img',false)
	Session.set('new_photo_img',false)
}

Template.edit_user.destroyed = function(){
	delete Session.keys['new_logo_img']
}
