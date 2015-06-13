/*
 * Good Ethos image uploader
 * This class relies on the meteor package: CollectionFS
 */
ge_uploader = function(args) {
	var defaults = {
		container: false
	}
	var args = _.isObject(args) ? _.defaults(args, defaults) : defaults
	_.extend(this, args)

	this.timeout = {} // Used for timing out the global intervals or global img.onloads
}

ge_uploader.prototype = {
	/*
	 * Wait until the image exists and is loaded
	 * @param name = The ID of image
	 * @param img_url = Image URL
	 * @param max_timeout = Maximum wait time
	 * @param cb = Callback Function
	*/
	wait_for_img: function(name, img_url, max_timeout, cb) {
		// Reset any previous timeout
		if (this.timeout[name]) Meteor.clearTimeout(this.timeout[name])

		var self = this
		var img = new Image()
		var loop_timeout
		img.src = img_url

		var max_timeout_func = function(){
			Meteor.clearTimeout(loop_timeout)
			cb && cb(false)
		}

		var loop_func = function() {
			img.src = img_url
			img.onload = function(){
				ge.blob_url( false, '#'+name, img_url+'?rand='+GE_Help.random_string(5))
				Meteor.clearTimeout(self.timeout[ name])
				img = null
				cb && cb(true)
			}
			img.onerror = function() {
				// Keep looping as long as the <IMG> exists, stop if it doesn't
				if( $('#'+name).length) loop_timeout = Meteor.setTimeout(loop_func, 5000)
			}
		}

		img.onerror = function() {
			// If check never passes, the timeout ends the interval
			if( !self.timeout[ name]) self.timeout[ name] = Meteor.setTimeout( max_timeout_func, max_timeout)
			loop_timeout = Meteor.setTimeout( loop_func, 5000)
		}
		img.onload = function() {
			img = null
			cb && cb(true)
		}
	},
	/**
	 * Upload an image
	 */
	img: function (file_input, args, cb) {
		var self = this
		var files = file_input.files
		if (!files || !files[0]) return false // Exit

		var reset_func = function() {
			if (self.container && self.container.length)
				self.container.removeClass('working')
			$(file_input).val('')
		}

		if (!_.isObject(args)) args = {}
		var fsFile = new FS.File(files[0])
		fsFile.owner = Meteor.userId() // Set owner

		// Before upload, dim it and add working class
		if (self.container && self.container.length) self.container.addClass('working')
		if (args.target) $('#'+args.target).addClass('is-loading')

		var res = Images.insert( fsFile, function(err, img){
			if (err) {
				console.warn(err)
				reset_func()
				return false
			} else if (img._id) {
				Meteor.call('upload_img', args, function(err,res){
					if (err) {
						reset_func()
						if (cb) cb(false)
						return false // Exit
					} else {
						var new_elem = null
						var target_elem = null
						var container_id = args.value_elem || false

						GE_Help.deselect()

						// Wait until Meteor Reactivity finishes, when it does, change SRC with temp blob URL
						ge.wait_for_dom( function(){
							new_elem = document.getElementById(res.key) || document.getElementById(res.key+'-thumb')
							target_elem = args.target ? document.getElementById(args.target) : null

							if ((args.target && target_elem!=null) || new_elem!=null) return true
							return false
						}, function(){
							if (new_elem!=null)
								ge.blob_url( files[0], '#'+res.key, false) // Update with Blob URL

							if(target_elem!=null)
								ge.blob_url( files[0], '#'+args.target, false) // Update with Blob URL

							reset_func()
							if(cb) cb( true)

							// I added the check for save because uploading 3+ images at once caused my browser to crash.
							ge.wait_for_save( function(){
								// No errors, image upload is good to go
								args.func = 'replace'
								args.replace = res.key
								args.file = {
									_id: img._id,
									name: img.name(),
									url: img.url()
								}
								Meteor.call('upload_img', args)
							}, img._id)
						}, 100, 2500)
					}
				})
			}
		})
		return res
	},
	/**
	 * Upload Small Images
	 */
	sImg: function( file_input, cb) {
		var self = this
    var files = file_input.files

		if (files && files[0]) {
			var fsFile = new FS.File( files[0])
			fsFile.owner = Meteor.userId() // Set owner

			var img = sImages.insert( fsFile, function(err, fileObj) {
				if (err) {
					if (cb) cb( false)
					return false // Exit
				}
				var args = {
					key: fileObj._id,
					name: fileObj.name()
				}
				Meteor.call('sImage_obj', args, function(err,res){
					if (err) {
						if (cb) cb( false)
						throw err
					} else if (cb)
						cb( res)
				})
			})
			return true
		} else
			return false
	},
}
