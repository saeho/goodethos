
Template.author_pic.helpers({
	author: function(){
		var user = this._id ? this : Meteor.user()
		var img = ge.get_photo(user)
		var service = ge.get_service(user, true)

		return {
			exists: service=='blog' || img,
			url: img,
			service: 'ss-'+service,
			service_raw: service
		}
	},
})
