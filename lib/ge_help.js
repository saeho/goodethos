/*
 * Uncategorized and unorganized collection of helpful functions
 * For both Client & Server
*/
GE_Help = {
	serializeForm: function(form){
		var formData = _.map(form.serializeArray(), function(data) {
			return [data.name, data.value]
		})
		return _.object(formData)
	},
	is_hex: function(color){
		return /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(color)
	},
	/*
	 * Strip CSS from Background-Image URL
	*/
	css_to_url: function(el) {
		if( _.isString(el)){
			if(!_.contains(['#','.'], el[0]))
				el = '#'+el
			el = $(el)
		}

		if(!el.length)
			return null // Exit if el doesn't exist
		var url = el.css('background-image')

		url = url.replace('url(','').trim()
		if(url.charAt(url.length-1)==')')
			url = url.substr(0, url.length-1) // This makes sure brackets are allowed in strings

		// Cross Browser Issue fix for Firefox
		var first_char = url[0]
		var last_char = url.slice(-1)
		if(_.contains(['"',"'"], first_char) && _.contains(['"',"'"], last_char))
			url = url.substring(1, url.length-1)

		// Sometimes, URL will return as "undefined", this is because SRC is non existent while file is still being uploaded.
		// If that is the case, return "none" instead, which is the proper CSS term.
		return url.substr(url.length - 9)=='undefined' ? 'none' : url
	},
	/*
		Author: Bobinice
		http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript/3561711
	*/
	regexEsc: function(s){
		return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')
	},
	/*
	 * Find the shorter of the two strings
	*/
	return_shorter: function(str1, str2) {
		var str1_len = str1==null ? 0 : str1.length
		var str2_len = str2==null ? 0 : str2.length

		return (str2_len>0 && str1_len > str2_len)
			? str2 : str1
	},
	/*
	 * Shorten string with option to end at space, strip tags, ending text, etc
	*/
	shorten: function(str, args) {
		var defaults = {
			len: 100,
			end_at_space: true,
			strip_tags: true,
			trail: '...'
		}
		args = _.isObject(args) ? _.defaults(args, defaults) : defaults

		// &hellip; is for consistency
		var str = str.trim().replace(/&hellip;/, '...')
		if(args.strip_tags) str = this.strip_tags(str)
		var original = str
		if(str==null) str = '' // This is needed so you can do .length check

		if (args.end_at_space && str.length>args.len) {
			str = str.substr(0, args.len)
			str = str.substr(0, Math.min( str.length, str.lastIndexOf(" ")))
		} else
			str = str.substring( 0, args.len)

		if (str!=original && args.trail && str.slice(-args.trail.length)!=args.trail)
			str = str.trim() + args.trail
		return str
	},
	/*
	 * Capitalize first letter of string and lowercase the rest
	*/
	capitalize: function(string, every_word) {
		if(!_.isString(string)) return null

		if(every_word && string.indexOf(' ')>0) {
			return _.map( string.split(' '), function( word){
				return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase()
			}).join(' ')
		} else
			return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase()
	},
	strip_tags: function(text) {
		if (text) {
			text = text.replace(/(<([^>]+)>)/ig,"").replace(/&nbsp;/g,'').replace(/ +(?= )/g,'').trim()
			return text
		}
		return null
	},
	/*
	 * Pad with String (Useful for time & numbers)
	 * i.e. 00001
	*/
	str_pad: function(str, pad_str, length) {
		if (_.isUndefined(length)) length = 2
		if (_.isUndefined(pad_str)) pad_str = '0'

		var str = str.toString() // convert because str could be a number
    while (str.length < length){
			str = pad_str + str
    }
    return str
	},
	/*
	 * Check if string is URL and from Vimeo or YouTube
	*/
	is_video_url: function( str) {
		str = str.toLowerCase().trim()

		if (str.indexOf("http://")<0 && str.indexOf("https://")<0 && str.indexOf("//")<0)
			str = '//'+str

		if (str.indexOf("youtube.c")>=2 || str.indexOf("vimeo.c")>=2)
			return str.indexOf("youtube.c")>4 ? 'youtube' : 'vimeo'
		return false // Not a Video URL
	},
	/*
	 * Checks if its a valid social media URL. If it is, return the social media name
	*/
	is_social_media_url: function(url, reformat, no_urls) {
		if (!url) return null // No need to check, it's not a social media url
		var url = url.toLowerCase()

		// Check if there's a URL query, if so, truncate it
		var query_pos = url.indexOf('?') || url.indexOf('&')
		if(query_pos>=0) url = url.substring(0, query_pos)

		// Check if there's no protocol
		var noProto = _.every(['https://','http://','//'], function(http){
			return url.indexOf(http)!==0
		})

		var social_media = [
			{ name: 'facebook', pattern: this.regexEsc('facebook.com') },
			{ name: 'twitter', pattern: this.regexEsc('twitter.com') },
			{ name: 'linkedin', pattern: this.regexEsc('linkedin.com') },
			{ name: 'instagram', pattern: this.regexEsc('instagram.com') },
			{ name: 'gplus', pattern: this.regexEsc('plus.google.com') }
		]

		// Check if URL is a Social Media URL or a Web URL
		var sm_cat = 'web'
		var isWeb = _.every(social_media, function(sm){
			var re = new RegExp('.*'+sm.pattern+'.*')
			var check = re.test(url)

			if(check)
				sm_cat = sm.name

			return !check
		})

		// Social Media URLs must have at least 2 url parameters
		var url_parts = _.filter(url.split('/'), function(part){
			return !_.contains(['https:','http:',''], part)
		})
		if(isWeb && url_parts.length<2)
			return null

		// Return reformatted URL
		if(reformat){
			if(noProto)
				return sm_cat=='web' ? 'http://'+url : 'https://'+url
			return url
		}

		// Return name of social media
		return sm_cat
	},
	/*
	 * Break down the URL into parameters
	*/
	url_params: function(url) {
		// Find position of query in URL
		var query_pos = url.indexOf('?') || url.indexOf('&')
		var base = query_pos>0 ? url.substr(0, query_pos) : url
		var query = url.substr(query_pos+1)
		var paramObj = {}

		if (query!=base) {
			var params = query.split("&")
			paramObj = _.object(_.map(params, function(p){
				return p.split('=')
			}))
		}
		paramObj.base_url = base
		return paramObj
	},
	/*
	 * Translate bytes to a more human number (KB, MB, GB, etc)
	*/
	file_size: function(bytes){
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
   if (bytes == 0)
		return '0 Bytes'

   var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
   return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i]
	},
	/*
	 * Check if nested object key exists
	 * i.e. GE_Help.key_exists(object_variable, 'key1.key2.key3.key4')
	*/
	key_exists: function(obj, prop){
		var parts = prop.split('.')
		for( var i = 0; i<parts.length; i++ ){
		  var part = parts[i]
		  if(obj !== null && typeof obj === "object" && part in obj)
	      obj = obj[part]
		  else
	      return false
		}
		return true
	},
	/**
	 * Find the last occurence of a letter and insert text before it
	 */
	insert_at_end: function( str, find_letter, insert_text){
		var pos = str.lastIndexOf(find_letter)
	 	return [str.slice(0, pos), insert_text, str.slice(pos)].join('')
	},
	/**
	 * Filter an object
	 */
	filterObj: function(obj, filter){
		var fObj = {}
		_.each(obj, function(v,k){
			if (filter(v,k)) fObj[k] = v
		})
		return fObj
	},
	/*
	 * Assign a nested key with value
	*/
	assign_nk: function(obj, key, value) {
		check(obj, Match.OneOf(Object, Array))
		check(key, String)

		var key = key.split('.')
		var recursive = function( this_obj, this_key, this_value){
			if (this_key.length > 1) {
		    var e = this_key.shift()
	      recursive( this_obj[e] =
					(_.isObject(this_obj[e]) || _.isArray(this_obj[e]))
					? this_obj[e] : {},
				this_key,
				this_value)
		  } else
				this_obj[ this_key[0]] = this_value
			return this_obj
		}
		return recursive(obj, key, value)
	},
	/*
	 * Get Object reference by string that contains a nested key
	*/
	nk: function(object, key) {
		if( !_.isString(key)) return false

		var key = key.replace(/\[(\w+)\]/g, '.$1') // convert indexes to properties
		key = key.replace(/^\./, '') // strip a leading dot

		if (key.indexOf('.')<=0)
			return object[ key] || null

		var split = key.split('.')
		while (split.length) {
			var n = split.shift()
			if (object && n in object)
				object = object[n]
			else
				return null
		}
    return object
	},
	/*
	 * Create a random string
	*/
	random_string: function(len){
		var do_rand = function(){
			return (0|Math.random()*9e6).toString(36)
		}

		if(isNaN(len))
			return do_rand()

		var rand = ''
		for( var i = Math.floor(len/4); i>=0; i-- ){
			rand += do_rand()
		}
		return rand.substr(0,len)
	},
	/*
	 * Create a Slug for URL use
	*/
	create_slug: function(title, min) {
		var min = isNaN(min) ? 2 : Math.max(min, 2) // Not allowing any slugs below 2 characters length

		var regEx = /^[0-9a-zA-Z\-_]+$/
		var slug = title.replace(/[^a-zA-Z0-9\- ]/g, "").toLowerCase() // No special characters

		slug =
			slug.replace(/\s+/, " ") // Middle Trim multiple spaces
			.trim().replace(/ /g, "-") // Convert Space to Dash

		while(slug.length < min){
			slug = slug+this.random_string()
		}

		return slug
	},
	/*
	 * Returns one of the three possibilities: "mobile", "tablet", "desktop"
	*/
	get_device: function() {
		if (Meteor.Device.isPhone()) return 'mobile'
		if (Meteor.Device.isTablet()) return 'tablet'
		return 'desktop'
	},
	/*
	 * Set caret to end
	*/
	cursor_to_end: function(el) {
		el.focus()
		if (typeof window.getSelection != "undefined" && typeof document.createRange != "undefined") {
			var range = document.createRange()
			range.selectNodeContents(el)
			range.collapse(false)
			var sel = window.getSelection()
			sel.removeAllRanges()
			sel.addRange(range)

		} else if (typeof document.body.createTextRange != "undefined") {
			var textRange = document.body.createTextRange()
			textRange.moveToElementText(el)
			textRange.collapse(false)
			textRange.select()
		}
	},
	/*
	 * Author: StackOverflow : Gert Grenander
	 * http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript
	*/
	deselect: function(){
		if (window.getSelection) {
			if (window.getSelection().empty) // Chrome
				window.getSelection().empty()
			else if (window.getSelection().removeAllRanges) // Firefox
				window.getSelection().removeAllRanges()
		} else if (document.selection) // IE?
			document.selection.empty()
	},
}
