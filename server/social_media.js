Meteor.methods({
	instagram_search: function( args, token) {

		if ( _.isObject(args) && !_.isUndefined( args.query) && !_.isUndefined( args.type) ) {

			//if( !token && args.use_defaults) token = Meteor.settings.defaults.is_token
			var token = token || Meteor.settings.defaults.is_token

			var search_instagram = function( args, cb) {
				var error_msg = '<p class="pm-guide-text silver center"><strong class="block bigger-title">Sorry, we couldn\'t find anything.</strong>%error_msg%</p>'

				switch( args.type){
					case 'Tags':
						args.query = args.query.trim().replace(/[^a-z0-9]+/i, '').replace(/#/g, '').replace(/ /g, '')
						var request_url = 'https://api.instagram.com/v1/tags/'+args.query+'/media/recent?count=100&access_token='+token
						error_msg = error_msg.replace('%error_msg%','Remember, #tags are not keywords. Spaces are removed when you search.')

						Meteor.http.call("GET", request_url, function(err, res){
							if( err || !res.data.data.length) {
								cb && cb (null, { error_msg: error_msg })
							} else {
								cb && cb (null, res.data.data)
							}
						})
					break
					case 'Username':
						args.query = args.query.trim().replace(/[^a-z0-9]+/i, '').replace(/#/g, '').replace(/ /g, '')
						var request_url = 'https://api.instagram.com/v1/users/search?q='+args.query+'&access_token='+token
						error_msg = error_msg.replace('%error_msg%','Instagram account '+args.query+' doesn\'t exist or the account is private.')

						// First, get ID of User from Username
						Meteor.http.call("GET", request_url, function(err, res){
							if( res.statusCode==200 && res.data.data[0].username && res.data.data[0].username==args.query) {
								request_url = 'https://api.instagram.com/v1/users/'+res.data.data[0].id+'/media/recent/?count=100&access_token='+token
								// Next, if user exists, use the ID to get recent posts
								Meteor.http.call("GET", request_url, function(err, res){
									if( err || !res.data.data.length) {
										cb && cb (null, { error_msg: error_msg })
									} else {
										cb && cb (null, res.data.data)
									}
								}) // END : Call
							} else {
								cb && cb (null, { error_msg: error_msg })
							}
						})
					break
					case 'Instagram URL':
						var url_params = GE_Help.url_params(args.query)
						error_msg = error_msg.replace('%error_msg%','Instagram URL: '+args.query+' is not valid.')
						args.query = url_params.base_url.replace('https://instagram.com/p/','').replace('https://instagram.com/p/','').replace(/\//g,'')
						// If you want to URL ID, do args.query right here.
						var request_url = 'https://api.instagram.com/oembed?url=https://instagram.com/p/'+args.query

						// First, get ID of User from Username
						Meteor.http.call("GET", request_url, function(err, res){

							if( res.statusCode==200 && res.data.media_id) {
								request_url = 'https://api.instagram.com/v1/media/'+res.data.media_id+'?access_token='+token
								// Next, if post ID exists, fetch it
								Meteor.http.call("GET", request_url, function(err, res){
									if( err || !res.data.data) {
										cb && cb (null, { error_msg: error_msg })
									} else {
										cb && cb (null, [res.data.data]) // Make sure this is in an array here
									}
								}) // END : Call
							} else {
								cb && cb (null, { error_msg: error_msg })
							}
						})
					break
					case 'id':
						var media_id = args.query

						request_url = 'https://api.instagram.com/v1/media/'+media_id+'?access_token='+token
						// Next, if post ID exists, fetch it
						Meteor.http.call("GET", request_url, function(err, res){
							if( err || !res.data.data) {
								cb && cb (null, { error_msg: error_msg })
							} else {
								cb && cb (null, res.data.data) // Make sure this is in an array here
							}
						}) // END : Call
					break
				}
			} // END : Func

			var search_instagram_sync = Meteor.wrapAsync( search_instagram )
			return search_instagram_sync( args)
		} // END : If args sent

		return false // Invalid args
	},
	twitter_search: function( args, token, secret) {

		if (_.isObject(args) && !_.isUndefined( args.query) && !_.isUndefined( args.type) ) {
			if( !token || token.length<5) token = Meteor.settings.defaults.tw_token
			if( !secret || secret.length<5) secret = Meteor.settings.defaults.tw_secret
//console.log(token)
//console.log(secret)
//console.log('##########################')
			var Twitter = new TwitMaker({
				consumer_key: Meteor.settings.Twitter.consumerKey,
				consumer_secret: Meteor.settings.Twitter.secret,
				access_token: token,
				access_token_secret: secret
			})
			var search_tweets = function( args, cb) {

				var params = {
					count: 100,
					exclude_replies: true,
				}

				switch( args.type){
					case 'Username':
						var get_url = 'statuses/user_timeline'
						args.query = args.query.replace(/ /g, '')
						params.screen_name = args.query
					break
					case 'id':
						var get_url = 'statuses/show/'+args.query
					break
					case 'Tweet URL':
						var get_url = 'statuses/show/'+args.query.split('/').pop()
					break
					default: // Keywords
						var get_url = 'search/tweets'
						var date_since = moment().subtract(1, 'year').format('YYYY-MM-DD')
						params.q = args.query+' -filter:retweets since:'+date_since
						if (args.entities) { params.q += ' filter:media'}
				}

				Twitter.get( get_url, params, function(err, data, response) {
					if ( err || !data ||
						( args.type=='Tweet URL' && !_.isObject(data)) ||
						( args.type=='Keywords' && !data.statuses.length)
					) {
						if ( err) { console.warn(err) }
						var possible_error_msgs = {
							Username: '@'+args.query.replace('@','')+' doesn\'t exist or the tweets are private.',
							Keywords: 'If you are looking for an old tweet, try search by URL.',
							'Tweet URL': args.query+' is not valid.'
						}
						var msg = '<strong class="block bigger-title">Sorry, we couldn\'t find anything.</strong>'
						if( _.has( possible_error_msgs, args.type)) { msg += possible_error_msgs[args.type] }
						cb && cb ( null, { error: true, message: '<p class="pm-guide-text silver center">'+msg+'</span>' })
						// END : Error
					} else {
						// DO : No Errors
						switch( args.type) {
							case 'Username':
								cb && cb (null, data)
								break
							case 'id':
								cb && cb (null, (_.isEmpty(data) ? false : data))
								break
							case 'Tweet URL':
								cb && cb (null, (_.isEmpty(data) ? false : [data]))
								break
							default: // Keywords'
								cb && cb (null, data.statuses)
						}
					} // END : No Errors
				}) // END : Twitter Get Request
			}
			var search_tweets_sync = Meteor.wrapAsync( search_tweets )

			return search_tweets_sync( args)
		}

		return false // Invalid args
	}
})
