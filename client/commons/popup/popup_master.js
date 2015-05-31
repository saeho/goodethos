
Template.popup_master.helpers({
	popup: function() {
		var popup = Session.get('popup')

		if ( popup && (popup.html || popup.template)){
			if(!popup.ok) popup.ok = 'green'
			popup.attr = {
				id: 'master-popup',
				class: popup.class || 'bg-alt fade-in fixed-full', // Default setups
			}
			// Setup Popup Style (only applicable if popup is a template)
			if( !popup.style || !_.contains( ['middle','left','right'], popup.style))
				popup.wrapper = null
			else {
				// Default chained wrapper classes so I don't have to repeat it every time
				popup.wrapper = 'bg-white pop-in-soft relative arroww-up mini-popup'

				// Currently, style only controls the added CSS class. But later I may need to write
				// extra code for every popup style, so I'm keeping this as a switch for now.
				switch( popup.style){
					case 'right':
						popup.wrapper += ' mp-right'
						break
					case 'left':
						popup.wrapper += ' mp-left'
						break
					case 'middle':
						popup.wrapper += ' center'
						break
				}
			}
			// Setup Popup Template
			if (popup.template && Template[popup.template]){
				popup.html = false
				popup.tmpl = Template[popup.template]
				/*
					For all popups rendered by means of a Template,
					Set data variable "popup" to be true so that the template always knows that it was rendered via popup and not a direct route.
					i.e. SignIn popup vs SignIn route
				*/
				if(_.isObject(popup.data))
					popup.data.popup = true
				else
		 			popup.data = { popup: true }
			} else if (!popup.id)
				popup.id = 'popup-html'

			return popup
		} else
			return false
	}
})

Template.popup_master.rendered = function(){
	// Always lock <BODY> with overflow when a popup is displayed
	$('body').addClass('overflow')
}

Template.popup_master.destroyed = function(){
	// Unlock <BODY> after popup is destroyed
	$('body').removeClass('overflow')
}
