/*
 * Good Ethos editor
 */
ge_editor = function(args) {
	var defaults = {
		page_id: null,
		page_type: 'story',
		page_status: 0,
		toolbar_buttons: [
			'bold', 'i', 'u', // Inline Formatting
			'a', // Anchor Formatting
			'break', // Does nothing, just adds a thin line as a separator
			'h2', 'h3', // Heading Formatting
			'h5', 'blockquote', 'h6' // Pullquote Formatting
		]
	}
	var args = _.isObject(args) ? _.defaults(args, defaults) : defaults
	_.extend(this, args)

	// Variables not defined by parameter
	this.save_state = false // Used for timing out the global intervals or global img.onloads
	this.autosave_timeout = false
	this.saved_selection = false
}

ge_editor.prototype = {
	/*
	 * Call a save function but check if save is already in progress
	*/
	save_func: function() {
		if(!Session.get('popup')){ // Only save if popup isn't active
			var self = this
			var recursive = function(){
				if(!Session.get('saving'))
					self.save_state = self.save()
				else {
					Meteor.clearTimeout(self.autosave_timeout)
					self.autosave_timeout = Meteor.setTimeout(recursive, 7000)
				}
			} // END : Recursive Function
			recursive()
		}
	},
	/*
	 * Get the element that's wrapping the location of text cursor.
	 * Has cross-browser support up to IE8.
	 * I think it works on IE9 but I'm not 100% sure.
	*/
	wrapper: function() {
		var parentEl = null, sel

		if (window.getSelection) {
			sel = window.getSelection()
			if (sel.rangeCount) {
				parentEl = sel.getRangeAt(0).commonAncestorContainer
				if (parentEl.nodeType!=1)
					parentEl = parentEl.parentNode
			}
		} else if ((sel = document.selection) && sel.type!="Control")
			parentEl = sel.createRange().parentElement()

		if (parentEl!=null && $(parentEl).prop('tagName')!=null) {
			// Find Parent element that matches one of these main wrappers
			// Ignore other elements
			var find_tag = ['H1','H2','H3','H4','H5','H6','BLOCKQUOTE','P','A','DIV','SECTION'] // <DIV> and <SECTION> are only in there as a fallback, in case nothing matches
			var tag = $(parentEl).prop('tagName')

			while ( tag!=null && !_.contains(find_tag, tag) ) {
				parentEl = parentEl.parentNode
				tag = $(parentEl).prop('tagName')
			}
		}
		return parentEl ? $(parentEl) : false
	},
	/*
	 * Take the entered Video URL and grab the Video ID from the URL Query.
	 * Then insert it into the position in question.
	*/
	insert_video: function($wrapper, video_url) {
		if (!$wrapper) return false
		var url = video_url || $wrapper.text().trim()
		var video_type = GE_Help.is_video_url(url)
		var video_params = GE_Help.url_params(url)

		var self = this

		if ( video_type=='youtube') {
			// If Video is YouTube
			var video_id = video_params.v
			var req_url = 'https://gdata.youtube.com/feeds/api/videos/'+video_id
		} else {
			// If Video is Vimeo
			var video_id = video_params.base_url.split('/').pop()
			var req_url = 'https://vimeo.com/api/v2/video/'+video_id+'.json'
		}

		HTTP.get (req_url, function(err,res){
			if (err) console.warn(err)
			else if (res.statusCode==200){
				// Render new stuff
				var insert = {
					key: GE_Help.random_string(12),
					value: video_id,
					type : video_type
				}
				var split_elems = self.split_in_two(true)

				ge.wait_for_save( function(){
					Meteor.call('splitPageBlock', self.page_id, insert, split_elems, function(err,res){
						if (err) console.warn(err)
						else {
							self.restructure(true)
							self.new_block_hide()

							// non_reactive() will take care of this, but do it once manually before so stutter can be avoided
							var target_elem = $('#'+split_elems.key)
							if( target_elem.length)
								target_elem.html( split_elems.before)
						}
						Session.set('saving',false)
					})
				})
			}
		})
	},
	/*
	 * Switch on/off the New Block insert form
	*/
	new_block_switch: function() {
		var $wrapper = this.wrapper()

		if ($wrapper && !_.contains( ['MAIN','DIV', 'SECTION'], $wrapper.prop('tagName'))
			&& !$wrapper.text()
			&& !$('#ge-editor').is(':visible')
			&& $wrapper.parents('#page-'+this.page_type+'-body').length) {

			// Move Insert Form to Position
			var nbb = $('#if-form')
			if(nbb.length){
				var offset_pos = $wrapper.offset()
				nbb.addClass('on').css({
					display: 'block',
					top: offset_pos.top+'px',
					left: offset_pos.left+'px',
				})
			}
			// Save Selection
			this.saved_selection = this.save_sel()
		} else
			this.new_block_hide()

		if ($wrapper && ($wrapper.prop('tagName')=='DIV' || $wrapper.prop('tagName')=='SPAN'))
			this.restructure()
	},
	/*
	 * Hide the New Block insert form
	*/
	new_block_hide: function(){
		var $nbb = $('#if-form')
		$nbb.removeClass('on').removeAttr('style')
		$('#tooltip-info').removeClass('on')
	},
	/*
	 * Switch on/off the Toolbar
	 * @param {Boolean} forced = force the Toolbar to appear even if the selected area is null.
	*/
	toolbar_switch: function(forced) {
		var $wrapper = this.wrapper()
		var toolbar = $('#ge-editor')

		if (!$wrapper || _.contains(['a-helper','a-input'], $wrapper.attr('id'))) return false
		var tagName = $wrapper.prop('tagName')

		_.defer((function(){
			if(forced){
				var null_test = $wrapper.text().trim()
				if (null_test.length<=0) {
					$wrapper.html('&nbsp;')
					if (document.body.createTextRange) {
						var range = document.body.createTextRange()
						range.moveToElementText($wrapper[0])
						range.select()
				  } else if (window.getSelection) {
						var selection = window.getSelection()
						var range = document.createRange()
						range.selectNodeContents($wrapper[0])
						selection.removeAllRanges()
						selection.addRange(range)
					}
				} else
					forced = false // Element was not null
			} // END : Forced (This is used when trying to load the toolbar on an empty element)

			if (tagName!='DIV' && $wrapper.closest('.content-wrapper').length) {
			// If Mouse Click -- Only pass through if user isn't selecting too much
				var selection = this.get_sel()
				var $a_helper = $('#a-helper')

				if ($a_helper.length && $a_helper.hasClass('prep'))
					$a_helper.removeClass('on prep')

				this.toolbar_button() // Before popping in/out the toolbar, turn on the enabled tags

				// Get selected text
				if (document.getSelection)
					var text = selection.toString()
				else if (document.selection && document.selection.type != "Control")
					var text = selection.createRange().text
				else
					return false // Really Old Browser or Incompatibility

				if (selection.rangeCount && text.length) {
					var pos = selection.getRangeAt(0).getClientRects()

					if (pos.length && toolbar.length) {
						var check_sel = pos["0"]
						check_sel = check_sel.width<=1 && !_.isUndefined(pos['1']) ? pos['1'] : check_sel

						// Toolbar must be popped in first, so that the correct offsetWidth/2 can be calculated
						var scrollTop = $(window).scrollTop()
						var top = scrollTop+check_sel.top
						var left = check_sel.width/2 + check_sel.left - toolbar.outerWidth()/2

						toolbar.attr('class', 'pop-in').css({
							top: top+'px',
							left: left+'px'
						})
					}

				} else if (document.activeElement.id=='a-input' && $a_helper.hasClass('on'))
					$a_helper.addClass('prep')
				else {
					$a_helper.removeClass('prep on')
					toolbar.removeAttr('class style')
				}
			} else {
				// User selected too much (i.e. wrapper matched DIV)
				toolbar.removeAttr('class style')
			}
		}).bind(this))
	},
	/*
	 * Turn on/off the buttons inside Toolbar and hide buttons that aren't needed.
	*/
	toolbar_button: function() {
		var $wrapper = this.wrapper()
		if ($wrapper) {
			var tagName = $wrapper.prop('tagName').toUpperCase()
			var deny = ['H1','H2','H3','BLOCKQUOTE','H5','H6']

			_.each( this.toolbar_buttons, function(format){
				var $button = $('#ge-editor .geeb-'+format)

				if ($button.length){
					var check_tb = false, hide_tb = false // Assume false
					var format = format.toUpperCase()

					switch (format){
						case 'BOLD':
							if (_.contains(deny, tagName)) hide_tb = true
							check_tb = document.queryCommandState("bold")
						break
						case 'I':
							if (_.contains(deny, tagName)) hide_tb = true
							check_tb = document.queryCommandState("italic")
						break
						case 'U':
							check_tb = document.queryCommandState("underline")
						break
						case 'A':
						case 'H1':
						case 'H2':
						case 'H3':
						case 'H4':
						case 'H5':
						case 'H6':
						case 'BLOCKQUOTE':
							check_tb = tagName==format
						break
					} // END: Switch

					// If check succeeds, turn it on, otherwise remove on class
					if (check_tb)
						$button.addClass('geeb-on')
					else
						$button.removeClass('geeb-on')

					if (hide_tb)
						$button.addClass('hide')
					else
						$button.removeClass('hide')
				} // END: IF Button exists
			}) // END: LOOP through every button
		}
	},
	/*
	 * Clean up the DOM
	 * @param clean = If true, remove all empty elements
	 * @param !clean = If false, remove all inline styles automatically created by vanilla JS contenteditable functionality
	 * @param !clean = If false and there's only one block (i.e. new page), add a placeholder message (i.e. "Click here to write")
	*/
	restructure: function(clean) {
		var selector = '.content-wrapper'
		var $body = $('#page-'+this.page_type+'-body')
		var denied = ['B','I','SPAN','EM','BOLD','STRONG, FONT']

		if (clean) {
			$(selector+' p:empty').remove()
			$(selector+':empty').html('<p></p>')
		} else if ($body.find('.content-block').length>1 || $body.text().trim().length) {
			$(selector).contents().filter(function(){
			    return this.nodeType===3 || (this.tagName && _.contains(denied, this.tagName))
			}).wrap('<p></p>')
			$(selector+' span, '+selector+' font, '+selector+' h1, '+selector+' h4, '+selector+' h2 *, '+selector+' h3 *, '+selector+' h5 *, '+selector+' h6 *, '+selector+' blockquote *').contents().unwrap()
			$(selector+' [style]').removeAttr('style') // No inline styles
			$(selector+' div:not([class])').contents().unwrap().wrap('<p></p>') // No DIVs
			$(selector+' p').removeAttr('class placeholder') // No placeholder elems, those are only used temporary at times
		} else if ($body.find('.content-block').length==1)
			$body.find('.content-block').addClass('area-placeholder').html('<p></p>')
	},
	/*
	 * Add <BOLD> on click
	*/
	bold: function(){
		document.execCommand('bold')
		return
	},
	/*
	 * Add <I> on click
	*/
	italic: function(){
		document.execCommand('italic')
		return
	},
	/*
	 * Create Anchors
	*/
	a: function(){
		var $a_helper = $('#a-helper')
		var $a_input = $('#a-input')
		var $wrapper = this.wrapper()

		if ($wrapper.prop('tagName')=='A' && $wrapper.attr('href').length)
			$a_input.value = $wrapper.href
		else
			$a_input.value = ''

		$a_helper.addClass('on')
		this.saved_selection = this.save_sel()

		$a_input.focus()
	},
	/*
	 * Save Selection
	 * by Tim Down
	 * http://stackoverflow.com/questions/5605401/insert-link-in-contenteditable-element
	*/
	save_sel: function() {
		var i, len, ranges, sel = this.get_sel()
		if (sel.getRangeAt && sel.rangeCount){
			ranges = []
			for (i = 0, len = sel.rangeCount; i < len; i += 1){
				ranges.push(sel.getRangeAt(i))
			}
			return ranges
		}
		return null
	},
	/*
	 * Restore Selection
	*/
	restore_sel: function() {
		var i, len, sel = this.get_sel(), saved_sel = this.saved_selection
		if ( saved_sel) {
			sel.removeAllRanges()
			for (i = 0, len = saved_sel.length; i < len; i += 1){
				sel.addRange( saved_sel[i])
			}
		}
	},
	get_sel: function() {
		return (document.selection && document.selection.type != "Control")
		? document.selection
		: document.getSelection()
	},
	get_range: function( sel ) {
		var sel = !_.isUndefined(sel) ? sel : this.get_sel()
		if (typeof sel === 'object') {
			return sel.rangeCount
				? sel.getRangeAt(0)
				: sel.createRange()
		}
		return false
	},

	/*
	 * Split the content block into two.
	 * Used to insert a new content block into the position of split.
	*/
	split_in_two: function(ignore_focused) {
		var $container, $wrapper = this.wrapper()

		if ($wrapper.prop('tagName')=='SECTION' && $wrapper.find('.add-video').length)
			$wrapper = $wrapper.find('.add-video')
		else if ($wrapper.prop('tagName')=='SECTION')
			return false // Video insert error

		do $container = $wrapper.parent()
		while ($container && !$container.hasClass('content-block'))

		if (!$container.text().trim().length) $container.html('<p></p>')

		if ($container.hasClass('content-block')) {
			var $before = $('<div>')
			var $after = $('<div>')
			var elem_pos =  $container.children().index($wrapper)

			$container.children().each( function(i){
				if (i<elem_pos)
					$(this).clone().appendTo($before)
				else if (i>elem_pos) // If equal, omit
					$(this).clone().appendTo($after)
			})

			return {
				key: $container.attr('id'),
				before: $before.text().length<=0 ? '<p></p>' : $before.html(),
				after: $after.text().length<=0 ? '<p></p>' : $after.html(),
			}
		}
		return false
	},
	isDraft: function(){
		return this.page_status>0 && this.page_status<4
	},
	save: function(cb){
		this.restructure()
		var data = this.page_body()

		if (this.isDraft() && data && !_.isEqual(data, this.save_state)) {
			var save_status = Session.get('saving')
			var save_status = _.isUndefined( save_status) || _.isBoolean(save_status)
			if( save_status) Session.set('saving',true)

			Meteor.call('updatePage', this.page_id, data, function(err, res) {
				if (err) console.warn(err)
				if (save_status) Session.set('saving', false)
				if (cb) cb()
			})
			return data
		} else {
			if(cb) cb()
			return this.save_state
		} // END : Save
	},
	page_body: function (prepare_for_save) {
		var $title = $('#page-title')
		var $summary = $('#page-summary')
		var $header = $('#page-'+this.page_type+'-header')

		if ($title.length && $summary.length) {
			var page_title = $title.text() || ''
			var page_summary = $summary.text() || ''
			var data = {}

			if (!_.isUndefined($header.data('va'))) data['layout.v_align'] = $header.data('va')
			if (!_.isUndefined($header.data('ca'))) data['layout.c_align'] = $header.data('ca')
			if (!_.isUndefined($header.data('ot'))) data['layout.on_top'] = $header.data('ot')

			if (page_title.length)
				data["content.title"] = page_title // Do NOT allow null
			data["content.summary"] = page_summary // Allow null

			var body = {}
			var field = 'content.body'

			$('.content-block').each( function(index){
				var prefix = field+'.'+index+'.'
				var key = $(this).attr('id')
				var type = $(this).data('type') || 'text'
				var this_style = $(this).data('style')

				switch (type) {
					case 'text':
						body[prefix+'value'] = $(this).html().length>5 ? $(this).html() : '<p>'+$(this).html()+'</p>'
					break
					case 'img':
						body[prefix+'style'] = this_style || 'medium'
					break
					case 'gallery':
						body[prefix+'style'] = this_style || 'table'
						$(this).find('.gallery-item').each( function (item_i){
							body[prefix+'group.'+item_i+'.style'] = this_style || 'small'
						})
					break
				} // END : Switch
			})

			_.extend(data,body)

			if (prepare_for_save) {
				Meteor.clearTimeout(self.autosave_timeout)
				if (_.isEqual(data, self.save_state)) return false
			} else return data
		}
		return false
	},
	/*
	 * Use the layout style name to figure out the colour of header <nav>
	*/
	header_class: function(layout){
		var black = ['event-slideshow']
		var gray = []
		var white = ['event-timeline','event-quarters','no-pic']

		if( _.contains(black, layout))
			return 'nav-black-perm'
		if( _.contains(white, layout))
			return 'nav-white-perm'
		if( _.contains(gray, layout))
			return 'nav-gray-perm'
	},
}
