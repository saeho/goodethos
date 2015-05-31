
// Globals
Template.registerHelper('brand', function( val, check){
    /*
        Get brand options for the company that created the viewing page.
        This is NOT the logged in user's brand.
    */
    var o = Session.get('brand')
    if( !o){
      var user = Meteor.user() || {}
      o = Organizations.findOne( user.organization) || {}
    }
    var brand = o.brand

    if( brand){
    	// Logos
        var logo_thumb = ge.responsive_img( brand.logo, 'thumb')
        var logo_thumb = logo_thumb ? 'background-image: url(\''+logo_thumb+'\');' : ''
        var logo_big = ge.responsive_img( brand.logo, 'small') // For logos, small is big
        var logo_big = logo_big ? 'background-image: url(\''+logo_big+'\');' : ''

        // Colors
        // First BG
    	var brand_color = brand.bg || false
    	var bg = brand_color ? 'background-color: '+brand_color+';' : ''
    	var border = brand_color ? 'border-color: '+brand_color+';' : ''

      // Second BG
      var bg_second = brand.bg_second ? 'background-color: '+brand.bg_second+';' : ''

      // Logo Images
      var text = brand.text || null
      var mission = o.mission || null

      // Get shorter name
      var full_name = GE_Help.nk(o, 'name.full')
      var short_name = GE_Help.nk(o, 'name.short')
      var o_name = GE_Help.return_shorter( full_name, short_name)

      var o_data = {
          slug: o.slug,
          o_name: o_name,
          ideal_name: full_name.length<15 && full_name.length>2 ? full_name : o_name,
          mission: mission,

          bg: bg,
          bg_second: bg_second,
          border: border,
          text: text,

          logo_thumb: logo_thumb,
          logo_big: logo_big,
      }

      var return_val = val && _.has( o_data, val) ? o_data[ val] : o_data
      return !_.isUndefined( check) && _.isString( check) && _.isString( return_val)
          ? check==return_val
          : return_val
    }
    // If you want to use conditions to do something, use val
    //return val?"checked":"";
    return false
})

Template.registerHelper('display_name', function(user){
  var user = user || Meteor.user()
	return ge.get_name(user)
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
        //return 'phone' // DEVELOPMENT MODE
        if( Meteor.Device.isPhone()) return 'phone'
        else if( Meteor.Device.isTablet()) return 'tablet'
        else return 'desktop'
    }

    //return true // DEVELOPMENT MODE

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
