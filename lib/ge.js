/**
 * Collection of useful functions for Good Ethos app.
 */
ge = {
	/**
	 * Create Empty Text Block - Useful for collection updates
	 */
	empty_text_block: function(text, key){
		var text = !_.isString(text) ? '<br />' : text
		return {
			key: (key || GE_Help.random_string(12)),
			type: 'text',
			value: text
		}
	},
	/**
	 * Find position of Object with matching key inside [Object]
	 */
	find_pos: function(content, key){
		var loc = false
    _.every (content, function (block, index) {
      var found = block.key==key
      if (found) loc = index
      return !found
    })
		return loc
	},
	/**
	 * Check if user is allowed to do certain actions.
	 * Currently the user role system is not very sophisticated.
	 * This function should one day be gone and the roles should be moved to a Mongo collection.
	 */
	user_can: function(action, level){
    if (!level || level<0 || level>10) {
			var user = Meteor.user()
	    if (!user || !user.level) return false
			level = user.level
		}
	  var role = {
			control_users: 8, // Allows you to add/remove users
			control_profile: 8, // Allows you to update organization information such as mission statement and social media
			control_all: 5, // Allows you to control anybody's pages even if it isn't your own content
			publish_or_draft: 3, // Allows you to publish or draft your own content
			// write: 1, // Not needed, just check if level is true
	  }
	  var req = role[action] || 99 // If role is not found, return false
	  return req<=level
	},
	/**
	 * Return the role name, required level and description.
	 * Currently the user role system is not very sophisticated.
	 * This function should one day be gone and the roles should be moved to a Mongo collection.
	 */
	get_role: function( level){
		if (_.isUndefined(level)) level = 0
		// TODO : Put this information inside DB
		var roles = [{
			//0
			level: 10,
			name: 'Administrator',
			desc: 'has all priviledges.'
		},{
			//1
			level: 8,
			name: 'Manager',
			desc: 'can control everything and also add/remove users.'
		},{
			//2
			level: 5,
			name: 'Editor',
			desc: 'can control everything except adding/removing users.'
		},{
			//3
			level: 3,
			name: 'Writer',
			desc: 'can write and also edit/delete their own content.'
		},{
			//4
			level: 1,
			name: 'Staff',
			desc: 'can write but cannot publish or delete.'
		},{
			//5
			level: 0,
			name: 'Assistant',
			desc: 'can only read other people\'s content.'
		}]

		if (level=='*') return roles

		var userRole = undefined
		_.every(roles, function(r){
			var test = level>=r.level || !r.level
			if (test) userRole = r
			return !test
		})
		return userRole
	},
	/**
	 * Get the user's ervice that he/she registered with.
	 */
	get_service: function (user, short){
		if (!user) return false
		var services = [{
			nk: 'services.facebook',
			short: 'fb',
			full: 'facebook'
		},{
			nk: 'services.twitter',
			short: 'tw',
			full: 'twitter'
		},{
			nk: 'services.instagram',
			short: 'is',
			full: 'instagram'
		},{
			nk: 'services.linkedin',
			short: 'li',
			full: 'linkedin'
		}]

		var userService = undefined
		var loop = _.every( services, function(s){
			var test = GE_Help.nk(user, s.nk)
			if (test) userService = s
			return test===null || test===false
		})

		if (loop) return 'profile'
		else return short ? userService.short : userService.full
	},
	/**
	 * Get user photo from service
	 */
	get_photo: function(user){
		if(!user) return false
		if (GE_Help.nk(user,'services.facebook'))
			return 'https://graph.facebook.com/'+user.services.facebook.id+'/picture'
		else if (GE_Help.nk(user,'services.twitter.profile_image_url_https'))
			return user.services.twitter.profile_image_url_https
		else if (GE_Help.nk(user,'services.instagram.profile_picture'))
			return user.services.instagram.profile_picture
		return false // Else
	},
	/**
	 * Get name of user
	 */
	get_name: function(user, get){
		var services = ['services.password','services.facebook','services.twitter','services.instagram']
		services = _.filter( services, function(s){
			return GE_Help.nk(user, s)
		})
		if (!services.length) return 'Unknown'

		var name = {}
		switch(services[0]){
			case 'services.password':
				name.first = GE_Help.nk(user, 'name.first') || ''
				name.last = GE_Help.nk(user, 'name.last') || ''
				break
			case 'services.facebook':
				name.first = GE_Help.nk(user, 'services.facebook.first_name') || ''
				name.last = GE_Help.nk(user, 'services.facebook.last_name') || ''
				break
			case 'services.twitter':
				// Using screenname for Twitter
				name.first = '@'+GE_Help.nk(user, 'services.twitter.screenName') || '@Unknown'
				name.last = ''
				break
			case 'services.instagram':
				var fullName = GE_Help.nk(user, 'services.instagram.full_name')
				fullName = fullName.split(' ')
				name.first = fullName[0] || ''
				name.last = fullName[1] || ''
				break
		}

		return name[get] || name.first+' '+name.last
	},
	/**
	 * This function waits until the session "saving" is false.
	 * The "saving" session is not turned off automatically.
	 * You have to make sure to turn the session off yourself inside your own callback.
	 */
	wait_for_save: function(cb, save_val) {
		if (_.isUndefined(save_val)) save_val = true
		if (!Session.get('saving')) {
			Session.set('saving', save_val) // Set session before callback
			cb()
		} else {
			var wfs_interval = Meteor.setInterval(function(){
				if (!Session.get('saving')) {
					Meteor.clearInterval(wfs_interval)
					Session.set('saving', save_val) // Set session before callback
					cb()
				}
			}, 500)
		}
	},
	/*
	 * Wait until a condition returns true before doing a function.
	 * Created for the purposes of doing a DOM check inside wait condition.
	 * @check = A function that determines whether the check interval should continue
	 * @completeFunc = Function to run after check is true
	 * @delay = Delay between each check interval
	 * @timeout = Give up after this timeout duration if check still fails
	 */
	wait_for_dom: function(check, completeFunc, delay, timeout) {

		// if the check returns true, execute onComplete immediately
		if (check()) {
		  completeFunc()
		  return
		}
		var onComplete = function(){
			Meteor.setTimeout( function(){
				completeFunc()
			},100)
		}
		if (!delay) delay=100
		var count = 1 // This incremends every loop, creating a longer interval periods in case something went wrong
		var intervalPointer = null

		// if after timeout milliseconds function doesn't return true, abort
		var timeoutPointer = timeout ?
			Meteor.setTimeout(function() {
			  Meteor.clearTimeout(intervalPointer)
			},timeout) : null

		var interval_func = function() {
			if (!check()) {

				// Is the extended delay really necessary?
				// Come back later and judge whether or not this should still exist.
				if (count++>10 && delay<250) delay = 250
				else if (count>15 && delay<500) delay = 500
				else if (count>20 && delay<1000) delay = 1000

				intervalPointer = Meteor.setTimeout(interval_func, delay)
			} else {
				// if the check returned true, means we're done here. clear the interval and the timeout and execute onComplete
				if (timeoutPointer) Meteor.clearTimeout(timeoutPointer)
				onComplete()
			}
		}
		intervalPointer = Meteor.setTimeout(interval_func, delay)
	},
	/**
	 * Change to blob url, either set SRC or background-image
	 * Also used to set img according to its tagname (if img_url is given)
	*/
	blob_url: function (file_input, elem_id, img_url, value_elem, cb) {
		if (!img_url)
			img_url = (window.URL || window.webkitURL).createObjectURL(file_input)

		var $elem = $(elem_id+','+elem_id+'-thumb')
		if (img_url && !$elem.hasClass('no-pic-page')) {
			var img = new Image()
			img.src = img_url

			img.onload = function(){
				if ($elem.prop('tagName')=='IMG') $elem.attr('src', img_url)
				else $elem.css('background-image', 'url('+img_url+')')

				$elem.removeClass('is-loading')
				img = null

				if (cb) cb()
			}
		} else if ($elem.hasClass('no-pic-page'))
			$elem.removeClass('is-loading')
	},
	color_choices: function( page_num, per_page){
		if (isNaN(per_page)) per_page = 50
		if (isNaN(page_num) || page_num<0) page_num = 0

		var all = ['#DDD','#EEE','#FFF','#333','#222','#000',
		'#B0171F','#DC143C','#FFB6C1','#FFAEB9','#EEA2AD','#CD8C95','#8B5F65','#FFC0CB','#FFB5C5','#EEA9B8','#CD919E','#8B636C','#DB7093','#FF82AB','#EE799F','#CD6889','#8B475D','#FFF0F5','#EEE0E5','#CDC1C5','#8B8386','#FF3E96','#EE3A8C','#CD3278','#8B2252','#FF69B4','#FF6EB4','#EE6AA7','#CD6090','#8B3A62','#872657','#FF1493','#EE1289','#CD1076','#8B0A50','#FF34B3','#EE30A7','#CD2990','#8B1C62','#C71585','#D02090','#DA70D6','#FF83FA','#EE7AE9','#CD69C9','#8B4789','#D8BFD8','#FFE1FF','#EED2EE','#CDB5CD','#8B7B8B','#FFBBFF','#EEAEEE','#CD96CD','#8B668B','#DDA0DD','#EE82EE','#FF00FF','#EE00EE','#CD00CD','#8B008B','#800080','#BA55D3','#E066FF','#D15FEE','#B452CD','#7A378B','#9400D3','#9932CC','#BF3EFF','#B23AEE','#9A32CD','#68228B','#4B0082','#8A2BE2','#9B30FF','#912CEE','#7D26CD','#551A8B','#9370DB','#AB82FF','#9F79EE','#8968CD','#5D478B','#483D8B','#8470FF','#7B68EE','#6A5ACD','#836FFF','#7A67EE','#6959CD','#473C8B','#F8F8FF','#E6E6FA','#0000FF','#0000EE','#0000CD','#00008B','#000080','#191970','#3D59AB','#4169E1','#4876FF','#436EEE','#3A5FCD','#27408B','#6495ED','#B0C4DE','#CAE1FF','#BCD2EE','#A2B5CD','#6E7B8B','#778899','#708090','#C6E2FF','#B9D3EE','#9FB6CD','#6C7B8B','#1E90FF','#1C86EE','#1874CD','#104E8B','#F0F8FF','#4682B4','#63B8FF','#5CACEE','#4F94CD','#36648B','#87CEFA','#B0E2FF','#A4D3EE','#8DB6CD','#607B8B','#87CEFF','#7EC0EE','#6CA6CD','#4A708B','#87CEEB','#00BFFF','#00B2EE','#009ACD','#00688B','#33A1C9','#ADD8E6','#BFEFFF','#B2DFEE','#9AC0CD','#68838B','#B0E0E6','#98F5FF','#8EE5EE','#7AC5CD','#53868B','#00F5FF','#00E5EE','#00C5CD','#00868B','#5F9EA0','#00CED1','#F0FFFF','#E0EEEE','#C1CDCD','#838B8B','#E0FFFF','#D1EEEE','#B4CDCD','#7A8B8B','#BBFFFF','#AEEEEE','#96CDCD','#668B8B','#2F4F4F','#97FFFF','#8DEEEE','#79CDCD','#528B8B','#00FFFF','#00EEEE','#00CDCD','#008B8B','#008080','#48D1CC','#20B2AA','#03A89E','#40E0D0','#808A87','#00C78C','#7FFFD4','#76EEC6','#66CDAA','#458B74','#00FA9A','#F5FFFA','#00FF7F','#00EE76','#00CD66','#008B45','#3CB371','#54FF9F','#4EEE94','#43CD80','#2E8B57','#00C957','#BDFCC9','#3D9140','#F0FFF0','#E0EEE0','#C1CDC1','#838B83','#8FBC8F','#C1FFC1','#B4EEB4','#9BCD9B','#698B69','#98FB98','#9AFF9A','#90EE90','#7CCD7C','#548B54','#32CD32','#228B22','#00FF00','#00EE00','#00CD00','#008B00','#008000','#006400','#308014','#7CFC00','#7FFF00','#76EE00','#66CD00','#458B00','#ADFF2F','#CAFF70','#BCEE68','#A2CD5A','#6E8B3D','#556B2F','#6B8E23','#C0FF3E','#B3EE3A','#9ACD32','#698B22','#FFFFF0','#EEEEE0','#CDCDC1','#8B8B83','#F5F5DC','#FFFFE0','#EEEED1','#CDCDB4','#8B8B7A','#FAFAD2','#FFFF00','#EEEE00','#CDCD00','#8B8B00','#808069','#808000','#BDB76B','#FFF68F','#EEE685','#CDC673','#8B864E','#F0E68C','#EEE8AA','#FFFACD','#EEE9BF','#CDC9A5','#8B8970','#FFEC8B','#EEDC82','#CDBE70','#8B814C','#E3CF57','#FFD700','#EEC900','#CDAD00','#8B7500','#FFF8DC','#EEE8CD','#CDC8B1','#8B8878','#DAA520','#FFC125','#EEB422','#CD9B1D','#8B6914','#B8860B','#FFB90F','#EEAD0E','#CD950C','#8B6508','#FFA500','#EE9A00','#CD8500','#8B5A00','#FFFAF0','#FDF5E6','#F5DEB3','#FFE7BA','#EED8AE','#CDBA96','#8B7E66','#FFE4B5','#FFEFD5','#FFEBCD','#FFDEAD','#EECFA1','#CDB38B','#8B795E','#FCE6C9','#D2B48C','#9C661F','#FF9912','#FAEBD7','#FFEFDB','#EEDFCC','#CDC0B0','#8B8378','#DEB887','#FFD39B','#EEC591','#CDAA7D','#8B7355','#FFE4C4','#EED5B7','#CDB79E','#8B7D6B','#E3A869','#ED9121','#FF8C00','#FF7F00','#EE7600','#CD6600','#8B4500','#FF8000','#FFA54F','#EE9A49','#CD853F','#8B5A2B','#FAF0E6','#FFDAB9','#EECBAD','#CDAF95','#8B7765','#FFF5EE','#EEE5DE','#CDC5BF','#8B8682','#F4A460','#C76114','#D2691E','#FF7F24','#EE7621','#CD661D','#8B4513','#292421','#FF7D40','#FF6103','#8A360F','#A0522D','#FF8247','#EE7942','#CD6839','#8B4726','#FFA07A','#EE9572','#CD8162','#8B5742','#FF7F50','#FF4500','#EE4000','#CD3700','#8B2500','#5E2612','#E9967A','#FF8C69','#EE8262','#CD7054','#8B4C39','#FF7256','#EE6A50','#CD5B45','#8B3E2F','#8A3324','#FF6347','#EE5C42','#CD4F39','#8B3626','#FA8072','#FFE4E1','#EED5D2','#CDB7B5','#8B7D7B','#FFFAFA','#EEE9E9','#CDC9C9','#8B8989','#BC8F8F','#FFC1C1','#EEB4B4','#CD9B9B','#8B6969','#F08080','#CD5C5C','#FF6A6A','#EE6363','#8B3A3A','#CD5555','#A52A2A','#FF4040','#EE3B3B','#CD3333','#8B2323','#B22222','#FF3030','#EE2C2C','#CD2626','#8B1A1A','#FF0000','#EE0000','#CD0000','#8B0000','#800000','#8E388E','#7171C6','#7D9EC0','#388E8E','#71C671','#8E8E38','#C5C1AA','#C67171','#555555','#1E1E1E','#282828','#515151','#5B5B5B','#848484','#8E8E8E','#AAAAAA','#B7B7B7','#C1C1C1','#EAEAEA','#F4F4F4','#FFFFFF','#F5F5F5','#DCDCDC','#D3D3D3','#C0C0C0','#A9A9A9','#808080','#696969','#000000','#FCFCFC','#FAFAFA','#F7F7F7','#F5F5F5','#F2F2F2','#F0F0F0','#EDEDED','#EBEBEB','#E8E8E8','#E5E5E5','#E3E3E3','#E0E0E0','#DEDEDE','#DBDBDB','#D9D9D9','#D6D6D6','#D4D4D4','#D1D1D1','#CFCFCF','#CCCCCC','#C9C9C9','#C7C7C7','#C4C4C4','#C2C2C2','#BFBFBF','#BDBDBD','#BABABA','#B8B8B8','#B5B5B5','#B3B3B3','#B0B0B0','#ADADAD','#ABABAB','#A8A8A8','#A6A6A6','#A3A3A3','#A1A1A1','#9E9E9E','#9C9C9C','#999999','#969696','#949494','#919191','#8F8F8F','#8C8C8C','#8A8A8A','#878787','#858585','#828282','#7F7F7F','#7D7D7D','#7A7A7A','#787878','#757575','#737373','#707070','#6E6E6E','#6B6B6B','#696969','#666666','#636363','#616161','#5E5E5E','#5C5C5C','#595959','#575757','#545454','#525252','#4F4F4F','#4D4D4D','#4A4A4A','#474747','#454545','#424242','#404040','#3D3D3D','#3B3B3B','#383838','#363636','#333333','#303030','#2E2E2E','#2B2B2B','#292929','#262626','#242424','#212121','#1F1F1F','#1C1C1C','#1A1A1A','#171717','#141414','#121212','#0F0F0F','#0D0D0D','#0A0A0A','#080808','#050505','#030303']

		return all.slice(page_num*per_page, (page_num+1)*per_page)
	},
	status: function( status ) {
		var status_name = {
			0 : 'In Trash',
			1 : 'Draft',
			// 2 : '??' // Unused
			// 3 : '??' // Unused
			4 : 'Published'
		}
		return status_name[status] || 'Unknown'
	},
	/**
	 * Get first-most image from the page
	 * Orders:
	 * 1. content.featured : Every PUBLISHED page SHOULD have this. This is the picture user chose.
	 * 2. content.img : Big image that's usually the title page picture (some templates skip this)
	 * 3. ## Not Done/Not Needed ## content.body : In order, scan through the page to get first-used picture
	 * 4. ## Not Done/Not Needed ## content.gallery : If gallery, scan through the gallery items
	 */
	featured_img: function(content, size) {
		var size = size || 'small'
		var featured = null

		// ##### 1. Get content.featured
		if ( _.has( content, 'featured')){
			featured = ge.responsive_img(content.featured, size)
			if (featured)
				return featured
		}

		// ##### 2. Get content.img
		if ( _.has(content, 'img') && content.img.length) {
			// Loop and return on the first valid image URL
			_.every(content.img, function(img){
				featured = ge.responsive_img(img, size)
				return featured==null
			})
		}
		return featured
	},
	/**
	 * Extract all images from page
	 * Orders
	 * 1. content.img : Big image that's usually the title page picture (some templates skip this)
	 * 2. content.body : In order, scan through the page to get first-used picture
	 * 3. content.gallery : If gallery, scan through the gallery items
	 */
	extract_imgs: function( content, num) {
		var extracted_imgs = []
		var num = num || 25
		var test = true

		var src_check = function( item){
			var src = item.src || {}
			if( item.type=='img' && src.key && src.medium)
				extracted_imgs.push(item.src)
			return extracted_imgs.length<num
		}

		// ##### 1. Get content.img
		if (_.has(content, 'img') && content.img.length>0) {
			// Loop and return on the first valid image URL
			test = _.every( content.img, function(img){
				if( _.isObject( img) && img.key && img.medium)
					extracted_imgs.push(img)
				return extracted_imgs.length<num
			})
		}

		// Exit if we have enough
		if (!test) return extracted_imgs

		// ##### 2. Get content.body
		if (_.has(content, 'body') && content.body.length>0) {
			test = _.every( content.body, function(img){
				// Push img content types
				if(img.type=='gallery' && _.isArray(img.group)) {
					var inner_every = _.every(img.group, function(group_item){
						return src_check( group_item)
					})
					return inner_every
				} else
					return src_check(img)
			})
		}

		// Exit if we have enough
		if (!test) return extracted_imgs

		// ##### 3. Get content.gallery
		if ( _.has(content, 'gallery') && content.gallery.length>0) {
			test = _.every( content.gallery, function( img){
				// Push img content types
				switch (img.type){
					case 'instagram':
					case 'twitter':
						if (GE_Help.nk( img, 'value.embed'))
							extracted_imgs.push({
								key: img.value.id,
								big: img.value.embed,
								medium: img.value.embed,
								small: img.value.embed,
								thumb: img.value.embed,
							})
						break
					case 'img':
						if (img.key && img.medium) extracted_imgs.push(img)
						break
					case 'vimeo':
					case 'youtube':
						extracted_imgs.push(img)
						break
				}
				return extracted_imgs.length<num
			})
		}
		return extracted_imgs
	},
	/**
	 * Close a Popup
	 */
	close_popup: function() {
		var popup = Session.get('popup')
		if (popup && !popup.persist) {
			var wait_spd = 250
			var $master = $('#master-popup')

			if (!$('#master').hasClass('saving')) {
				if ($master.hasClass('pop-in'))
					$master.addClass('pop-out').removeClass('pop-in')
				else if ( $master.hasClass('fade-in'))
					$master.addClass('fade-out').removeClass('fade-in')
				else if ( $master.hasClass('card-in')) {
					$master.addClass('card-out').removeClass('card-in')
					wait_spd = 700
				} else
					wait_spd = 0

				Meteor.setTimeout(function() {
					Session.set('popup', false)
				}, wait_spd)
			}
		} else if (popup) {
			// Has Persist
			popup.persist = false
			Session.set('popup', popup)
		}
	},
	/**
	 * Clean up the text
	 */
	clean_text: function( text) {
		// If Text, remove empty DOM elems
		var $cloned = $(document.createElement('div'))
		$cloned.html( text)
		// After cloning elements, loop and delete empty elements and elements with only spaces
		$cloned.find('*').each( function(i){
			var null_test = $(this).html().replace(/&nbsp;/gi, '').trim()
			if( ($(this).is(':empty') && $(this).prop('tagName')!='BR') || null_test.length<=0 || _.contains( ['<br>','<br/>','<br />'], null_test))
				$(this).remove()
		})
		return $cloned.html()
	},
	/**
	 * Get Excerpt from GE Object
	 */
	excerpt: function(body, length) {
		if (isNaN(length)) length = 150
		var text = ''
		_.every( body, function(obj, index) {
			if (obj.type=='text' && obj.value)
				text += GE_Help.strip_tags(obj.value)+' '
			return text.length<length
		})

		if (text.length) {
			var excerpt = text.trim().substr(0, length)
			// If in middle of word, trim again
			return excerpt.substr(0, Math.min(excerpt.length, excerpt.lastIndexOf(" ")))+'...'
		}
	},
	/**
	 * Choose the correct image size based on device detection
	 */
	responsive_img: function(img, size) {
		if (_.isObject(img)) {
			var allowed_sizes = ['full','big','medium','small','thumb']
			// TODO: What's 'medium-desktop' for? Check if its still needed or if it was a temporary variable for bug tracking.
			var size = allowed_sizes.indexOf(size)>=0 || size=='medium-desktop' ? size : 'big'
			var img_url = undefined

			// If img object is incomplete, back up with what actually does exist
			var backup_url = img.big || img.medium
			_.each(allowed_sizes, function(as){
				if (img.hasOwnProperty(as) )
					backup_url = img[as]
				else
					img[as] = backup_url
			})

			switch (size) {
				/*
					This is no longer in use
				case 'full' :
					if (Meteor.Device.isPhone()) { img_url = img.small }
					else if (Meteor.Device.isTablet()) { img_url = img.medium }
					else { img_url = img.full }
				break
				*/
				case 'full' :
				case 'big' :
					// Small size is too small even for phones
					if (Meteor.Device.isPhone() || Meteor.Device.isTablet()) img_url = img.medium
					else img_url = img.big
				break
				case 'medium-desktop':
					if (Meteor.Device.isPhone() || Meteor.Device.isTablet()) img_url = img.small
					else img_url = img.medium
					break
				case 'medium' :
					if (Meteor.Device.isPhone()) img_url = img.small
					else img_url = img.medium
				break
				case 'small' :
					img_url = img.small
				break
				case 'thumb' :
					img_url = img.thumb
				break
			}
			return _.isUndefined(img_url) ? null : encodeURI(img_url)
		}
		return null
	},
	/**
	 * Check string against illegal words (bad words) and reserved words
	 */
	dictionary_check: function(text) {
		var partial = ['fuck', 'suck', 'shit', 'fag', 'cunt ', 'pussy', 'vagina', 'bitch', 'whore']
		var exact = ['xhr', 'about', 'user', 'topic', 'faq']

		// This is used for organization slugs. So you may want to remove any reserved words for routes you need
		if (_.contains(exact, text))
			return GE_Help.random_string()

		_.each(partial, function(word) {
			var regex = new RegExp(word, 'ig')
			text = text.replace(reg, '')
		})

		if (!text.length)
			return GE_Help.random_string()
		return text
	},
	/**
	 * Make non-reactive elements, reactive.
	 */
	non_reactive: function(content) {
		var nr = [
			{ id: '#page-title', nk: 'title'},
			{ id: '#page-summary', nk: 'summary'}]

		_.each(nr, function(obj){
			var val = obj.data || GE_Help.nk(content, obj.nk)
			var $elem = $(obj.id)

			if ($elem.length && val && val.trim()!=$elem.html().trim())
				$elem.html(val)
		})

		var now = Date.now()
		var update_elem = function(obj) {
			var $elem = $('#'+obj.key)
			switch (obj.type) {
				case 'text':
					var ts = Number($elem.data('ts'))
					var time_check = isNaN(ts) || (now-ts)>1500

					if(obj.value && obj.value.trim().length && time_check){
						var html = /<|>/.test(obj.value) && obj.value!='<br>' ? obj.value : '<p>'+obj.value+'</p>'
						if($elem.html()!=html)
							$elem.html(html)
					}
					break
				case 'gallery':
					// var big_url = this.responsive_img (item.src, 'big')
					// var src_url = this.responsive_img (item.src, 'medium')
					if (_.has(obj, 'group') && obj.group.length) {
						var check = true
						var test = _.every (obj.group, function(img){
							var img_key = GE_Help.nk (img, 'src.key')
							var $img = $('#'+img_key)
							return img_key && $img.length && $img.hasClass('loaded') && $img.attr('src')
						})
						if (test)
							Meteor.setTimeout( function(){
								GE_Gallery()
							}, 250)
					}
					break
			} // END : Switch
		}

		_.each (content.body, function(block, index) {
			var $body = $('.page-body .content-block')

			if ($('#'+block.key).length && index==$body.index($('#'+block.key)))
				update_elem( block)
			else {
				ge.wait_for_dom( function(){
					var $waitFor = $('.page-body .content-block')
					var new_elem = document.getElementById( block.key)
					return !(new_elem==null || index!=$waitFor.index( $('#'+block.key)))
				}, function() {
					update_elem( block)
				}, 100, 2000)
			}
		}) // END : Each
	},
	/*


		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED
		THIS IS WHERE WE STOPPED



	*

	/*
		Check for every image on page and wait up to ## seconds to see if they are available.
		** This function is used to refresh images if someone attempts to view a page while an image is being uploaded.
	*/
	check_imgs: function( selector, uploader, args) {
		if( !_.isObject( args)) var args = {}

		var wait_time = args.wait_time || 30000
		var closest_elem = args.closest || false

		if( _.isUndefined(uploader)) var uploader = new ge_uploader()

		$( selector).each( function(){
			var elem = $(this)
			var id = elem.attr('id')
			var url = elem.attr('src')

			var target_elem = _.isString( closest_elem) && closest_elem.length
				? elem.closest( closest_elem)
				: elem

			if( !url && id) url = GE_Help.css_to_url( id)
			if( url && id && url!='none') {
				target_elem.addClass('is-loading') // This will get turned off inside the callback

				uploader.wait_for_img( id, url, wait_time, function(){
					target_elem.removeClass('is-loading')
					if( args.class) elem.addClass( args.class)
				})
			}
		})
	},
	/**
	 * Get size class of text based on its string length.
	 */
	title_size: function(title, tolerance, class_names) {
		var length = title.replace(/&nbsp;/g,'').replace(/ +(?= )/g,'').trim().length
		if(!_.isArray(tolerance)) tolerance = [58,28,15,11,7]
		if(!_.isArray(class_names)) class_names = ['master-tiny','master-small','master-normal','master-middle','master-big']

		var size = null
		_.every( tolerance, function(n, i){
			size = class_names[i]
			return length<n
		})

		return size
	},
	/**
	 * Change the size based on length
	 */
	title_size_change: function(elem) {
		// This should match the default class names in the title_size() function
		var $elem = $(elem)
		var class_names = 'master-tiny master-small master-normal master-middle master-big'
		var this_value = $elem.prop("tagName")=='INPUT' || $elem.prop("tagName")=='TEXTAREA' ? $elem.val() : $elem.text()
		var new_class = this.title_size(this_value)
		var remove_classes = class_names.replace(new_class, '')

		$elem.removeClass(remove_classes).addClass(new_class)
	},
	set_meta: function(meta) {
		meta.title = _.isUndefined(meta.title) ? 'Good Ethos' : meta.title
		meta.desc = _.isUndefined(meta.desc) ? 'Good Ethos' : meta.desc
		meta.image_src = _.isUndefined(meta.image_src) ? '' : meta.image_src

		document.title = meta.title
		$('meta[name=description]').attr('content', meta.desc)
		$('link[rel=image_src]').attr('href', meta.image_src)
	},
	nl2p: function(text, args) {

		var args = args || {}
		var allow_brs = _.has( args, 'allow_brs') ? args.allow_brs : true
		var allow_ps = _.has( args, 'allow_ps') ? args.allow_ps : true

		var line_break = '<br />'
		var nl2p_text = text

		nl2p_text = nl2p_text.replace(/(\r\n|\n|\r)/gm,"%line_break%")
		nl2p_text = nl2p_text.replace(/\s+/g," ")
		nl2p_text = nl2p_text.trim()

		if (allow_brs)
			nl2p_text = nl2p_text.replace(/%line_break%%line_break%/gi, line_break+"\r\n"+line_break+"\r\n")
		else
			nl2p_text = nl2p_text.replace(/%line_break%%line_break%/gi,"</p><p>")

		if (allow_ps)
			nl2p_text = nl2p_text.replace(/%line_break%/gi," ")
		else
			nl2p_text = nl2p_text.replace(/%line_break%/gi, line_break+"\r\n")

		if (!allow_ps)
			return nl2p_text
		else {
			nl2p_text = nl2p_text.replace(/(\r\n|\n|\r)/gm,"")

			var regex = new RegExp(line_break+line_break, 'g');
			nl2p_text =nl2p_text.replace(regex, '</p><p>')
			nl2p_text =  nl2p_text.indexOf('<p>')>0 || nl2p_text.indexOf('<p>')<0 ? '<p>'+nl2p_text+'</p>' : nl2p_text

			if( _.has( args, 'class')) nl2p_text = nl2p_text.replace(/<p>/g, '<p class="'+args.class+'">')
			return nl2p_text
		}
	},

	// Important variables and options
	// *
	// *
	layout_options: function( class_template, return_choices, unique_id, area_id ){

		// Change to space so that .replace() will work
		if ( !class_template || class_template==null ) { class_template = ' ' }

		// Example of a sample class template for layout option buttons
		// var class_template = 'round ltc-%id% ctrl-%id% tooltip down transition-none'
		var layout_controls = {
			master: {
				attr: {
					class: class_template.replace(/%id%/g, 'master'),
					'data-tooltip': 'Choose a new page layout',
				}
			},
			img: {
				attr: {
					class: class_template.replace(/%id%/g, 'img'),
					'data-tooltip': 'Change the image',
				}
			},
			on_top_true: {
				attr: {
					class: class_template.replace(/%id%/g, 'on_top_true'),
					'data-tooltip': 'Put title on top of picture',
					'data-area': unique_id,
				}
			},
			on_top_false: {
				attr: {
					class: class_template.replace(/%id%/g, 'on_top_false'),
					'data-tooltip': 'Put title above picture',
					'data-area': unique_id,
				}
			},
			// Remove is used for deleting the entire area. For multi-image blocks, don't use this.
			remove: {
				attr: {
					class: class_template.replace(/%id%/g, 'remove'),
					'data-tooltip': 'Delete',
					'data-delete': unique_id,
				}
			},
			img_big: {
				attr: {
					class: class_template.replace(/%id%/g, 'img_big'),
					'data-tooltip': 'Make image full size',
					'data-target': unique_id,
				}
			},
			img_medium: {
				attr: {
					class: class_template.replace(/%id%/g, 'img_medium'),
					'data-tooltip': 'Make image fit within the body of text',
					'data-target': unique_id,
				}
			},
			v_align_true: {
				attr: {
					class: class_template.replace(/%id%/g, 'va_true'),
					'data-tooltip': 'Align text to middle',
					'data-area': unique_id,
				}
			},
			v_align_false: {
				attr: {
					class: class_template.replace(/%id%/g, 'va_false'),
					'data-tooltip': 'Align text to bottom',
					'data-area': unique_id,
				}
			},
			c_align_true: {
				attr: {
					class: class_template.replace(/%id%/g, 'ca_true'),
					'data-tooltip': 'Align text to center',
					'data-area': unique_id,
				}
			},
			c_align_false: {
				attr: {
					class: class_template.replace(/%id%/g, 'ca_false'),
					'data-tooltip': 'Align text to left',
					'data-area': unique_id,
				}
			},
		}

		if(_.isUndefined(return_choices) || !return_choices ) { return layout_controls }

		// Else return choices
		var return_array = []
		return_choices.forEach( function( item ){
			if ( GE_Help.key_exists( layout_controls, item) ) {
				return_array.push( layout_controls[ item ] )
			}
		})

		return return_array
	},

	// TODO: Delete this function and find another way to do this
	// Remove this function below and use simple-schema
	validate_collection: function(form, validation, check_blanks) {

		var check_blanks = _.isUndefined(check_blanks) ? 1 : check_blanks
		var results = {}

		// Run through entire submitted form data and check against Validation conditions
		form.forEach(function(data) {
			var this_name = data.name
			var this_val = data.value
			var this_validation = validation[this_name]

			var this_result = {}
			if (this_name=='password') {
				password = this_val
			}

			// If check_blanks is false, below won't run
			if (check_blanks || (!check_blanks && this_val)) {
				for (var key in this_validation) {
					var check_key = 1 // Reset each time

					switch(key){
						case 'regEx':
							var check_key = this_validation[key].test(this_val)
						break

						case 'alphanumeric':
							// This isn't really alphanumeric, but this function is depreciated soon anyways so it don't matter.
							if (this_validation[key]) {
								//regEx = /^[0-9a-zA-Z]+$/
								regEx = /^[0-9a-zA-Z\-_]+$/
								var check_key = regEx.test(this_val.trim())
							}
						break

						case 'email':
							if (this_validation[key]) {
								regEx = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
								var check_key = regEx.test(this_val)
							}
						break

						case 'min':
							var check_key = this_val.length >= this_validation[key]
						break

						case 'max':
							var check_key = this_val.length <= this_validation[key]
						break

						case 'must_match':
							// Used only for #confirm field
							// serializeArray() returns an array without a key so I can't figure out a way to grab the password field by reference
							var check_key = this_val == password
						break
					} // END: Switch

					if (!check_key){
						// If you want to alert() if this specific key failed or not
						// alert(check)
						this_result[key] = check_key
					}
				} // END: #Foreach data field
			} // END: #If check_blanks

			// If any of the validation fails, add to return Object
			if (!jQuery.isEmptyObject(this_result)) {
				this_result.error_msg = _.isUndefined(this_validation.error_msg) ? false : this_validation.error_msg
				results[this_name] = this_result
			} else {
				results[this_name] = true
			}
		}) // END: Check through all Validation conditions and return a results Object

		/*
		If you want to alert() the whole thing
		for (var key in results) {
			alert(key + ' and ' + results[key])
			for (var this_key in results[key]) {
					alert('INNER: ' + this_key + ' and ' + results[key][this_key])
			}
		}
		*/

		return results
	},
	/*
		Registers standalone contenteditable elements
		Used when the content editable is NOT part of an editor
	*/
	contenteditable_events: {
		// Upon blur, inner trim the text and set the placeholder
		'blur .editable, blur .no-enter:not(.editable)': function(e,t) {
			// Do /&nbsp;/g first before doing the (?= )
			var editable = $(e.currentTarget)
			var placeholder = editable.data( 'placeholder')
			if( placeholder) { editable.attr('placeholder', placeholder) }

			if( !editable.hasClass('no-p'))
				editable.html( editable.text().trim() )
		},
		// Upon focus, inner trim the text and hide the placeholder
		'focus .editable': function(e) {
			var editable = $(e.currentTarget)

			// Register placeholder data
			if( !editable.data('placeholder') && editable.attr('placeholder')) { editable.data('placeholder', editable.attr('placeholder')) }
			e.currentTarget.removeAttribute('placeholder')

			if( !editable.html().length) { editable.html('&nbsp;') }
		},
		'paste .editable-paste': function(e) {
			e.preventDefault()

			var clipboard = (e.originalEvent || e).clipboardData
			var text = clipboard.getData('text/plain')
			text = text.replace(/(\r\n|\n|\r)/gm,' ')

			document.execCommand("insertText", false, text)
			document.execCommand("removeFormat")
		},
		// If empty upon keyup, set it to &nbsp; (For centered contenteditables)
		'keyup .editable': function(e) {
			var elem = $(e.currentTarget)
			var cur_length = elem.text().trim().length
			var max_length = elem.data('max')

			// Max length check
			if ( max_length && cur_length > max_length) {
				var new_val = $(e.currentTarget).hasClass('no-p') ? elem.html() : elem.text()
				elem.html( new_val.trim().substring(0, max_length))
 				GE_Help.cursor_to_end( e.currentTarget)
			}

			// This centers empty centered .editable's
			if ( elem.text().trim().length<=0){
				e.currentTarget.innerHTML = '&nbsp;'
			}
			/*
			Do not use this below, it will cause cursor to move to the front in Firefox, it's a pain.
			else {
				elem.html( elem.text())
			}
			*/
		},
		// No Paragraphs Allowed
		'keyup .no-p': function(e) {
			// Using keyup instead of "input" because I need the e.which info
			var elem = $(e.currentTarget)
			if( !e.metaKey && !e.ctrlKey && !e.shiftKey && !_.contains([13,91,16,18,17,93,37,38,39,40], e.which)) {
				elem.children().filter( function(){
					return $(this).prop('tagName')!='BR' && $(this).text().trim().length<=0
				}).remove()
			}
			elem.find(':not(DIV):not(BR)').each( function(){
				$(this).replaceWith( $(this).text())
			})
		},
		'blur .no-p': function(e) {
			var elem = $(e.currentTarget)
			elem.find(':not(BR)').filter( function(){
				return $(this).text().trim().length<=0
			}).remove()
		},
		// No Enters Allowed
		'keydown .no-enter': function(e) {
			if( e.keyCode==13) {
				e.preventDefault()
			}
		},
		'keyup .no-enter:not(.editable)': function(e) {
			var elem = $(e.currentTarget)
			var cur_length = elem.text().trim().length
			var max_length = elem.data('max')

			// Max length check
			if ( max_length && cur_length > max_length) {
				elem.text( elem.text().substring(0, max_length))
				GE_Help.cursor_to_end( e.currentTarget)
			}
		},
	},
}
