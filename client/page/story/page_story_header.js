var init_elems = []

Template.page_story_header.helpers({
	lct: function() {
		var data = Template.parentData()
		if(!data || !data.page) return {}

		var edit_mode = data.page.status>0 && data.page.status<4
		if( edit_mode) {
			// Buttons inside LCT
			var button_choices = ['master','img']
			var layout = Session.get('layout') || data.page.layout

			// All classes use c_align right now, but when they don't, change this
			button_choices.push( (layout.c_align ? 'c_align_false' : 'c_align_true') )

			switch (layout.style) {
				case 'full-back':
					button_choices.push( (layout.v_align ? 'v_align_false' : 'v_align_true') )
					break
				case 'regular':
					// Nothing extra for regular
					break
				case 'no-pic':
					// Nothing extra for no-pic
					break
			}

			if( GE_Help.nk( data.page, 'content.img') && data.page.content.img.length )
				button_choices.push( 'remove' )

			return {
				buttons: button_choices,
				key: 'page-story-header',
				ltc_id: '#header-ltc',
				extra_html: '<input id="input-page-story-header" type="file" class="hide s3-img"\
					data-target="page-story-header" data-type="src_array" data-field="content.img" />',
			}
		} else return false
	},
	header: function() {
		var page = this.page
		if( !page) return {}

		var new_imgs = Session.get('new_imgs')
		var edit_mode = page.status>0 && page.status<4
		var editable = edit_mode ? ' editable no-enter' : ''
		var action = Router.current().params._action

		// WARNING
		// You have to do a Session.get('layout').style check, otherwise save() on destroyed() won't work
		var layout = Session.get('layout') && Session.get('layout').style ? Session.get('layout') : page.layout

		// # # # #
		// Create Header
		var header = {
			title: action=='edit' ? '' : page.content.title,
			summary: action=='edit' ? '' : GE_Help.nk( page, 'content.summary'),

			attr: {
				id: 'page-story-header',
				class: 'relative background '+layout.style+'-page ',
			},
			attr_title: {
				id: 'page-title',
				class: ge.title_size( page.content.title )+' text title '+editable,
				contenteditable: edit_mode,
			},
			attr_summary: {
				id: 'page-summary',
				class: 'summary text bigger-caption invis-85 serif '+editable,
				contenteditable: edit_mode,
			},
			attr_inside: {
				id: 'page-story-header-inside',
			}
		} // End Header

		if( edit_mode) {
			header.attr_title.placeholder = 'Title'
			header.attr_title['data-max'] = 100 // This must match collection title limit

			header.attr_summary.placeholder = 'Summary (Optional)'
			header.attr_summary['data-max'] = 255 // This must match collection title limit
		}

		var img = GE_Help.nk(page, 'content.img.0')
		var img_url = false

		if( img) {
			header.attr['data-key'] = img.key

			if( _.contains( init_elems, img.key)) {
				img_url = ge.responsive_img( img, layout.style=='no-pic' ? 'medium' : 'big')
				if( layout.style!='no-pic') header.attr.style = 'background-image: url(\''+img_url+'\');'
				else header.attr.style = 'background-image: none;'

			} else if ( _.contains( new_imgs, img.key)) {
				img_url = ge.responsive_img( img, 'big')
				var image = new Image()
				image.src = img_url

				image.onload = function(){
					init_elems.push( img.key)
					var layoutCheck = Session.get('layout') && Session.get('layout').style ? Session.get('layout') : page.layout
					if( layoutCheck.style!='no-pic')
						$('#page-story-header').css('background-image', 'url(\''+img_url+'\')')
				}
			}
		}

		header.attr.class += ' v_align_'+(layout.v_align ? 'true' : 'false')
		header.attr.class += ' c_align_'+(layout.c_align ? 'true' : 'false')+' '
		header.attr['data-va'] = layout.v_align
		header.attr['data-ca'] = layout.c_align

		// Layout Style
		switch ( layout.style) {
			case 'regular':
				// Main Element
				header.attr.class += 'bg-black white'
				break
			case 'full-back':
				// Main Element
				header.attr.class += 'bg-black white'

				// Inside Element
				header.attr_inside.class = 'abs-full dim table '
				header.attr_inside.class += (layout.v_align ? 'delay-fade-zoom' : 'delay-fade-in')
				break
			case 'no-pic':
				header.attr.class += ' bg-white'
				if( img){
					header.img = { key: img.key }
					if( img_url) header.img.src = img_url
				}
				break
		} // END : Switch

		return header
	},
	page_summary_visible: function(){
		var data = Template.parentData()
		if( !data.page) return {}

		var edit_mode = data.page.status>0 && data.page.status<4
		var summary = GE_Help.nk( data.page, 'content.summary') || ''

		return (edit_mode || summary.length ? true : false)
	},
})

Template.page_story_header.events( ge.contenteditable_events )

Template.page_story_header.created = function(){
	var imgs = GE_Help.nk( this.data, 'page.content.img')
	if( imgs && imgs.length)
		init_elems = _.map( imgs, function( img){
			return img.key || null
		})
}
