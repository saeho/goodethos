
Template.all_loop.helpers({
	status_name: function(){
		var status = ge.status( this.status)
		var type = GE_Help.capitalize( this.info.type)
		return this.status<4 ? '<strong>'+status+' '+type+'</strong>' : '<strong class="charcoal">'+status+' '+type+'</strong>'
	},
	time_ago: function(){
		return moment( this.date.edited ).fromNow().replace('a few seconds', 'few seconds')
	},
	cur: function(){
		var query = Session.get('query') || {}
		return query._id==this._id
	},
})

Template.all_loop.events({
	'click .sa-loop': function(e,t){
		if( Meteor.Device.isPhone() || Meteor.Device.isTablet())
			Router.go(t.data.url || '/blog/'+t.data._id+'/edit')
		else {
			var data = t.data
			if( !data.content.title) data.content.title = 'Untitled'
			Session.set('query', data)
		}
	}
})

// # # # # # # # # # # # #
// Preview

Template.all_preview.helpers({
	// # # # # # # # # # # # #
	// Query was String but nothing was found
	no_result_msg: function(){
		return "We couldn't find anything that matches your search criteria."
	},
	search_query: function(){
		return _.isString( this) ? this : ''
	},
	isPreview: function(){
		return this._id ? true : false
	},
	// # # # # # # # # # # # #
	// Query was a preview
	first_img: function(){
		if( this.status>=4) return ge.featured_img( this.content, 'small')
		else {
			var img = ge.extract_imgs( this.content, 1)
			if( img.length)
				return ge.responsive_img( img[0], 'small')
			return false
		}
	},
	imgs: function(){
		var imgs = ge.extract_imgs( this.content)
		imgs = _.map( imgs, function( img){
			return ge.responsive_img( img, 'thumb')
		})

		var count = 0
		if( imgs.length){
			_.each( imgs, function( img){
				var loader = new Image()
				loader.src = img
				var img_checker = function(){
					if (++count == imgs.length){
						Meteor.setTimeout( function(){
							$('#user-page-desktop .loading-master').addClass('hide')
						},250)
					}
				}
				loader.onload = img_checker
				loader.onerror = img_checker
			})
		} else {
			Meteor.setTimeout( function(){
				$('#user-page-desktop .loading-master').addClass('hide')
			},100)
		}

		if( imgs.length>=2) {
			return imgs
		}
		return false
	},
	// # # # # # # # # # # # #
	// Query was a search
	search: function(){
		var query = this
		if( _.isString( query)){

			var query_array = query.split(' ').splice(0,3)
			var or = []
			_.each( query_array, function( q){
				var regex = new RegExp( '.*'+q+'.*', 'i' )
				or.push({ 'content.title': regex })
				or.push({ 'content.summary': regex })
			})

			var cond = { $or: or }

			var posts = Posts.find(cond).fetch()
			var count = posts.length
			if( !count) return false
			count = 'Found '+posts.length+' Match'+( posts.length==1 ? '' : 'es')

			var res = _.map( posts, function(p){
				var status = ge.status( p.status)
				var type = GE_Help.capitalize( p.info.type)
				var status_name = p.status<4 ? '<strong>'+status+' '+type+'</strong>' : '<strong class="charcoal">'+status+' '+type+'</strong>'
				var time_ago = moment( p.date.edited ).fromNow().replace('a few seconds', 'few seconds')
				var url = '/blog/'+p._id+'/edit'

				return {
					title: p.content.title,
					type: p.info.type,
					status_name: status_name,
					time_ago: time_ago,
					url: url
				}
			})

			return {
				result: res,
				count: count,
				query: query
			}
		}
	},
})

Template.all_preview.rendered = function(){
	Tracker.autorun( function(){
		var page = Session.get('query')
		$('#user-page-desktop .loading-master').removeClass('hide')

		Meteor.clearTimeout( this.timeout)
		this.timeout = Meteor.setTimeout( function(){
			$('#user-page-desktop .loading-master').addClass('hide')
		}, 10000)
	})
}
