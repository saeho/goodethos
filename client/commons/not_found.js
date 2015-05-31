
Template.not_found.created = function() {
	//Session.set('layout',{ hide_footer: true })

	// Popup must be manually disabled, if user logs out while a popup is present,
	// the popup will remain while the page changes to not_found template.
	// This is because Iron Router onBeforeAction() won't trigger
	// (technically the route hasn't changed therefore onBeforeAction is never triggered.)
	Session.set('popup', false)
}
