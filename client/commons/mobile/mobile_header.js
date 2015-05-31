
Template.mobile_header.helpers({
	no_page: function(){
		return !_.has( this, 'page')
	},
	logged_user: function(){
		var user = Meteor.user()
		if( !user || _.isUndefined( user.services)) return false

		// Later when we allow multi-accounts and organizations, we need to disable this
		var brand = Session.get('brand')
		if( !brand || brand._id==user.organization) return { show: false, isReader: true }

		var service = false
		var type = false

		_.every( user.services, function( data, key){
			if( _.contains( ['twitter','instagram','facebook','password'], key) ){
				service = data
				type = key
				return false
			}
			return true
		})

		switch( type){
			case 'twitter':
				var img = service.profile_image_url_https
				break
			case 'facebook':
				var img = 'https://graph.facebook.com/'+service.id+'/picture'
				break
			case 'instagram':
				var img = service.profile_picture
				break
			case 'password':
				var o = Organizations.findOne( user.organization) || {}
        var img = ge.responsive_img( GE_Help.nk( o, 'brand.logo'), 'thumb')
				break
			default:
				var img = false // Technically, nothing should reach this
		}

		var isO = type=='password'
		var img = img ? "background-image: url('"+img+"')" : ''

		return {
			show: true,
			isO: isO,
			pic: img,
			isReader: brand._id!=user.organization,

			attr: {
				//class: (isO ? 'background user-photo overflow' : 'lmi-icon')+' inline-block round',
				class: 'background user-photo overflow inline-block round',
				style: img,
			}
		}
	},
})
