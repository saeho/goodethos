
Comments.allow({
    insert: function(userId, document) {
        if( userId!=document.user || !document.message.length) return false

        var test = _.map( document, function( val, key){
            // If in the future more fields are needed, just add it to this array
            if( _.contains( ['excerpt','edit_mode'], key)) return false
            return true // else
        })

        return !_.contains( test, false)
    },
    update: function(userId, document, fields, modifier) {
        var test = _.map( fields, function( key){
            // If in the future more fields are needed, just add it to this array
            if( _.contains( ['excerpt','edit_mode'], key)) return false
            return true // else
        })
        return !_.contains( test, false)
    },
})


Meteor.publish('comments', function (args) {

    // args Template
    // args._id
    // args.page_type

    var cond = {
      $query: { page_id: args._id },
      $orderby: { 'date.commented': -1, 'date.edited': -1 }}

    // args.page_type is usually used for Profile page commenting
    if( args.page_type)
      cond.$query.page_type = args.page_type

    var comments = Comments.find( cond)
    var users = comments.map( function(c) { return c.user })
    var organizations = comments.map( function(c) { return c.organization })

    return [
      comments,
      Meteor.users.find({_id: {$in: users }}),
      Organizations.find({_id: {$in: organizations }}),
    ]
})
