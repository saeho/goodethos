var prev_state = {}
var cur_obj = {}

Template.edit_user.helpers({
	is: function( menu){
		return this.cur==menu
	},
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
		if( !user) return false
		var o = Organizations.findOne( user.organization)

		var disabled = !ge.user_can('control_profile', (user.level || 0))

		if( this.cur=='profile')
			var show_button = GE_Help.nk( user, 'services.password') ? true : false
		else
			var show_button = !_.has(user, 'organization') && this.cur=='organization' ? false : true

		var form_data = {
			has_o: user.organization ? true : false,
			isDemo: user.username=='demo-public',
			input_class: 're-wrapper',
			label_class: 'small-label',
			disabled: disabled,
			show_button: show_button && (!disabled || this.cur=='profile')
		}

		switch( this.cur){
			case 'profile':
				// # # # #
				// Profile
				var allow_edit = GE_Help.nk( user, 'services.password') ? true : false
				var name = [{
					allow_edit: allow_edit,
					value: ge.get_name( user, 'first'),
					key: 'name.first',
					placeholder: 'First Name'
				},{
					allow_edit: allow_edit,
					value: ge.get_name( user, 'last'),
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
			if(o){
				var name = [{
					label: 'Publication Name',
					label_class: form_data.label_class,
					value: GE_Help.nk(o, 'name.full'),
					key: 'name.full',
					placeholder: 'Full Name',
					disabled: disabled
				},{
					value: GE_Help.nk(o, 'name.short'),
					key: 'name.short',
					placeholder: 'Short Name',
					class: 'input-small',
					disabled: disabled
				}]
				return _.extend( form_data, {
					name: name,
					mission: o.mission
				})
			} else return false // New user, no organization found
			case 'brand':
				// # # # #
				// Brand
				if(o){
					var logo_style = 'background-color: '+(GE_Help.nk(o, 'brand.logo_back') || '#333')+';'
					var logo_url = ge.responsive_img( o.brand.logo, 'small')
					var bg_style = GE_Help.nk(o, 'brand.bg') || '#333'
					var brand_text = GE_Help.nk(o, 'brand.text') || 'brand-light'

					if( logo_url!=null) logo_style += 'background-image: url(\''+logo_url+'\');'
					bg_style = 'background-color: '+bg_style+';'

					// Color Choices for Logo
					var cc_page = this.cc_page || 0
					var cc_cur_val = GE_Help.nk(o, 'brand.logo_back')

					// Color Choices for Text
					var ccb_page = this.ccb_page || 0
					var ccb_cur_val = GE_Help.nk(o, 'brand.bg')

					return _.extend( form_data, {
						bg_style: bg_style,
						text: brand_text,
						light_check: brand_text=='brand-light',
						dark_check: brand_text=='brand-dark',

						back: {
							type: 'text',
							id: 'eu-brand-back',
							class: 'eucc-input',
							name: 'brand.bg',
							'data-color': ccb_cur_val,
							value: ccb_cur_val,
							maxlength: 7
						},
						back_cc: ge.color_choices( ccb_page, 22),
						ccb_show_prev: ccb_page>0,
						ccb_show_next: ccb_page<25,

						logo_key: GE_Help.nk(o, 'brand.logo.key'),
						logo_style: logo_style,
						logo_back: {
							type: 'text',
							id: 'eu-logo-back',
							class: 'eucc-input',
							name: 'brand.logo_back',
							'data-color': cc_cur_val,
							value: cc_cur_val,
							maxlength: 7
						},
						logo_cc: ge.color_choices( cc_page, 22),
						cc_show_prev: cc_page>0,
						cc_show_next: cc_page<25,
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
	if( user.organization) this.subscribe('futureImages', user.organization, true)

	this.autorun( (function(){
		var new_logo_img = Session.get('new_logo_img')

		if( new_logo_img){
			var o = Organizations.findOne( user.organization)
			var future_images = sImages.find().fetch()

			_.each( future_images, function( img){
				if( img._id==GE_Help.nk( new_logo_img, 'key') && (img.hasStored('smedium') && img.hasStored('ssmall') && img.hasStored('sthumb'))) {
					if( GE_Help.nk( o, 'brand.logo.key')) sImages.remove( o.brand.logo.key)
					Organizations.update( o._id, {
						$set: { 'brand.logo' : new_logo_img }
					})
					Session.set('saving',false)
					Session.set('new_logo_img', false)

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
}

Template.edit_user.destroyed = function(){
	delete Session.keys['new_logo_img']
}
