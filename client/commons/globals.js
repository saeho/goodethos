
// Globals
Template.registerHelper('brand', function( val, check){
    /**
     * Currently "brand" session is semi-pointless.
     * At a later time, each user/team member will be able to have their own blog, at which point they will have their own branding options.
     */
    var o = GE_Settings.findOne({ type: 'site_info' }) || {}

  	var defaults = {
  		logo_thumb: null,
  		logo_big: null,

      bg: '#2e9b3d',
      bg_second: '#2d2d2d',

      text: 'brand-light',

      site_name: 'Unknown',
      site_shortname: 'Unknown',
      description: null,
  	}
  	var brand = _.isObject(o.brand) ? _.defaults(o.brand, defaults) : defaults

  	// Logos
    var logo_thumb = ge.responsive_img( brand.logo, 'thumb')
    brand.logo_thumb = logo_thumb ? 'background-image: url(\''+logo_thumb+'\');' : ''
    var logo_big = ge.responsive_img( brand.logo, 'small') // For logos, small is big
    brand.logo_big = logo_big ? 'background-image: url(\''+logo_big+'\');' : ''

    // First BG
  	brand.bg = 'background-color: '+brand.bg+';'

    // Second BG
    brand.bg_second = 'background-color: '+brand.bg_second+';'

    // Get shorter name
    var site_name = o.site_name || ''
    var short_name = o.site_shortname || ''
    brand.o_name = GE_Help.return_shorter( site_name, short_name)
    brand.ideal_name = site_name.length<15 && site_name.length>2 ? site_name : brand.o_name

    var return_val = val && _.has(brand, val) ? brand[val] : brand
    return !_.isUndefined( check) && _.isString(check) && _.isString(return_val)
    ? check==return_val
    : return_val
})

Template.registerHelper('display_name', function(user){
  var user = user || Meteor.user()
	return ge.get_name(user) || 'Unknown'
})

Template.registerHelper('user_can', function(action){
    return ge.user_can( action)
})

Template.registerHelper('master_title_class', function(val){
    if( val && val.length) return ge.title_size( val)
    else return null
})

/*
    Check if device is mobile, tablet or phone
*/
Template.registerHelper('device_is', function(val){
    if( _.isUndefined(val)) {
        // return 'phone' // DEVELOPMENT MODE
        if( Meteor.Device.isPhone()) return 'phone'
        else if( Meteor.Device.isTablet()) return 'tablet'
        else return 'desktop'
    }

    // return true // DEVELOPMENT MODE

    switch( val){
        case 'mobile':
            return Meteor.Device.isPhone() || Meteor.Device.isTablet()
        case 'phone':
            return Meteor.Device.isPhone()
        case 'tablet':
            return Meteor.Device.isTablet()
        case 'desktop':
            return Meteor.Device.isDesktop()
        default:
            return false
    }
})

/*
    Take the img object and return the appropriate size (based on device)
*/
Template.registerHelper('responsive_img', function( obj, size){
    return ge.responsive_img( obj, (size || 'medium'))
})

Template.registerHelper('is', function(val, compare){
 return val==compare
})
