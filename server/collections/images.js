// Image Stores Options
var get_img_obj = function(key, name) {
  var sizes = ['big','medium','small','thumb']
  var url_obj = {key: key}
  _.each( sizes, function( size){
    url_obj[ size] = Meteor.settings.AWS.root+Meteor.settings.AWS.folder+'/'+size+'/images/'+key+'-'+name
  })
  return url_obj
}

// Allow & Deny
Images.allow({
  insert: function(userId, document) {
    return userId==document.owner
  },
  update: function(userId, document) {
    return userId==document.owner
  },
  remove: function(userId, document) {
    return false // No deletes without calls
  }
})

// Methods
Meteor.methods({
  upload_img: function(args) {
    var user = Meteor.user()
    if ( !user._id || !user.isStaff ) { throw new Meteor.Error("not-authorized") }
    if ( !args.id || _.isUndefined(args.page_type) ) { throw new Meteor.Error("Invalid args") }

    // Defaults
    args.order = args.order || 0 // Push to front if not set
    args.page_field = args.page_field || 'content.body'
    args.img_type = args.img_type || 'src'
    args.func = args.func && _.contains(['split','update','push','replace'], args.func) ? args.func : 'update'

    // Find appropriate collection
    switch( args.page_type) {
        case 'article': // Unused
        case 'story':
        case 'event':
        case 'blog':
            var collection = Posts
            collection.attachSchema(PostsSchema)
            var cond = { _id: args.id }
            break
        default:
            return false // Match not found, exit
    }

    // Proceed with function
    if( _.has( args, 'file')) var img_obj = get_img_obj( args.file._id, args.file.name) // New Placeholder Data
    else var img_obj = { key: GE_Help.random_string(12) }

    switch( args.img_type) {
        case 'src':
            img_obj = do_src( collection, cond, img_obj, args)
        break
        case 'src_array':
            img_obj = do_src_array( collection, cond, img_obj, args)
        break
        case 'group':
            img_obj = do_group( collection, cond, img_obj, args)
        break
    }
    return img_obj
  },
})

var do_group = function( collection, cond, img_obj, args) {
    // Do Checks
    if( args.index) args.index = Number(args.index)
    if( args.order) args.order = Number(args.order)
    check( args.index, Number)
    check( args.order, Number)

    // Find Existing
    var nested_key = args.page_field+'.'+args.index+'.group'
    var cur_data = collection.findOne( cond, { field : nested_key })
    var setObj = {}

    switch( args.func) {
        case 'push':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Push img_obj to position of img group    # # # # # # # # # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            var cur_img_obj = GE_Help.nk( cur_data, nested_key)
            if( cur_img_obj)
                cur_img_obj = _.filter( cur_img_obj, function(img){
                    return GE_Help.nk( img, 'src.key')
                })

            if(cur_img_obj) {
                // This is the default value for new img objects
                var new_obj = {
                    key : GE_Help.random_string(12),
                    src : img_obj,
                    style : "normal",
                    type : "img"
                }
                cur_img_obj.splice( args.order, 0, new_obj)

                setObj[ nested_key] = cur_img_obj
                collection.update( cond, { $set: setObj })

                return img_obj
            } else return false
        case 'replace':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Replace a non-existant img object with a real img    # # # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            check( args.replace, String)

            var cur_data = collection.findOne( cond, { field : args.page_field })
            var loc = false

            if( !cur_data) return false

            _.every( GE_Help.nk( cur_data, args.page_field), function( content, index) {
                if( _.has( content, 'group')){
                    _.every( content.group, function( media, inner_index){
                        if( media.type=='img' && GE_Help.nk( media, 'src.key')==args.replace){
                            loc = args.page_field+'.'+index+'.group.'+inner_index+'.src'
                            return false
                        } else return true
                    })
                    return loc ? false : true
                } else return true
            })

            if( loc){
                var setObj = {}
                setObj[ loc] = img_obj
                //console.log( setObj)
                collection.update( cond, { $set: setObj })
            }


            return false
        case 'update':
                // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
                // Update img_obj at position and delete old    # # # # # # # # #
                // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
                nested_key += '.'+args.order
                var cur_img_obj = GE_Help.nk( cur_data, nested_key)

                if(cur_img_obj) {
                    Images.remove( cur_img_obj.src.key) // Delete Old
                    var new_img_obj = { src : img_obj }
                    new_img_obj = _.isObject(args.extras) ? _.defaults(new_img_obj, args.extras) : new_img_obj
                    new_img_obj = _.extend(cur_img_obj, new_img_obj)

                    setObj[ nested_key] = new_img_obj
                    collection.update( cond, { $set: setObj })

                    return img_obj
                } else return false
        break
    }
}
var do_src = function( collection, cond, img_obj, args) {
    switch( args.func) {
        case 'push':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Update existing img with new img and delete old img    # # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            if( args.index) args.index = Number(args.index)
            check( args.index, Number)

            args.index++
            var nested_key = args.page_field
            if( args.page_field=='content.body') nested_key += '.'+args.index+'.src'

            var cur_data = collection.findOne( cond, { field : nested_key })
            var cur_img_obj = GE_Help.nk( cur_data, nested_key) // Old data

            // This is the default value for new img objects
            var new_obj = _.extend({
                key : GE_Help.random_string(12),
                style : "normal"
            }, img_obj)
            if(_.isObject(args.extras)) new_obj = _.extend(new_obj, args.extras)

            if(cur_img_obj) {
                // Push item to position
                cur_img_obj.splice( args.index, 0, new_obj)

                var setObj = {}
                setObj[ nested_key] = cur_img_obj
                collection.update( cond, { $set: setObj })
                return img_obj

            } else {
                // Create array with single image item
                var setObj = {}
                setObj[ nested_key] = [new_obj]
                collection.update( cond, { $set: setObj })
                return img_obj

            }
        case 'replace':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Replace a non-existant img object with a real img    # # # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            check( args.replace, String)

            var cur_data = collection.findOne( cond, { field : args.page_field })
            var loc = false
            var replace_img = img_obj

            if( !cur_data) return false

            _.every( GE_Help.nk( cur_data, args.page_field), function(content, index) {
                var src_key = GE_Help.nk( content,'src.key')
                if( src_key==args.replace){
                    loc = args.page_field+'.'+index+'.src'
                    return false
                } else if( content.key==args.replace) {
                    loc = args.page_field+'.'+index
                    replace_img = _.extend(content, replace_img)
                    return false
                } else return true
            })

            if( loc){
                var setObj = {}
                setObj[ loc] = replace_img
                collection.update( cond, { $set: setObj })
            }
            return false
        case 'update':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Update existing img with new img and delete old img    # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            args.index = Number(args.index) || 0
            check( args.index, Number)

            var setObj = {}
            var nested_key = args.page_field+'.'+args.index
            var cur_data = collection.findOne( cond, { field : nested_key })
            if(!cur_data) return false

            var old_img = GE_Help.nk( cur_data, nested_key) // Old data
            if( old_img && old_img.key && old_img.key!=img_obj.key ) Images.remove( old_img.key) // Delete all old data

            if(args.page_field=='content.body') {
                // # # # #
                // This is part of the content body
                // # # # #
                nested_key += '.src'
                // content.body SRC images don't accept args.extras
                setObj[ nested_key] = img_obj
            } else {
                // # # # #
                // This is a standalone
                // # # # #
                if(_.isObject(args.extras)) img_obj = _.extend(img_obj, args.extras)
                var new_img_obj = _.extend(old_img, img_obj)
                setObj[nested_key] = new_img_obj
            }

            collection.update( cond, { $set: setObj })
            return img_obj
        case 'split':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Split the text block in two and push a new img object   # # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            var split = args.insert.split
            check( split, Object)

            // This is the what a default img block looks like
            var insert = {
                key : GE_Help.random_string(12),
                src: img_obj,
                style : "medium",
                type : "img"
            }

            Meteor.call('splitPageBlock', args.id, insert, split )
            return img_obj
            break
    }
}
var do_src_array = function( collection, cond, img_obj, args) {

    switch( args.func) {
        /*
        You don't need this function.
        src_array() is used for single img SRC arrays only.
        Unless you want to support multiple (i.e. admin specified) images for single images, "push" func shouldn't happen.
        case 'push':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Push item to position of array  # # # # # # # # # # # # # # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            args.index = Number(args.index) || 0
            check( args.index, Number)

            var nested_key = args.page_field
            if( args.index>=0) nested_key += '.'+args.index+'.src'

            var cur_data = collection.findOne( cond )
            if(!cur_data) return false

            var cur_array = cur_data[ nested_key]
            var setObj = {}

            var new_obj = _.extend({
                key : GE_Help.random_string(12),
            }, img_obj)

            if( !cur_array || !cur_array.length){
                // First image
                setObj[ nested_key] = [new_obj]
                collection.update( cond, { $set: setObj })
                return img_obj
            } else {
                // Push
                cur_array.splice( args.index, 0, new_obj)

                var setObj = {}
                setObj[ nested_key] = cur_array
                collection.update( cond, { $set: setObj })
                return img_obj

            }
            return false
        */
        case 'update':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Update existing array with new img and delete old imgs   #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            var nested_key = args.page_field
            if( args.index>=0) nested_key += '.'+args.index+'.src'
            // If there is no index, then it's a naked key, i.e. "content.img"

            var cur_data = collection.findOne( cond, { field : nested_key })
            if(!cur_data) return false

            var old_img = GE_Help.nk( cur_data, nested_key) // Old data
            _.each( old_img, function( item){
                if( item.key && item.key!=img_obj.key ) Images.remove( item.key) // Delete all old data
            })

            var setObj = {}
            setObj[ nested_key] = [img_obj]

            collection.update( cond, { $set: setObj })
            return img_obj
        case 'replace':
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            // Replace a non-existant img object with a real img    # # # #
            // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
            check( args.replace, String)

            var cur_data = collection.findOne( cond, { field : args.page_field })
            var loc = false
            var replace_img = img_obj

            if( !cur_data) return false

            _.every( GE_Help.nk( cur_data, args.page_field), function( content, index) {
                var src_key = GE_Help.nk( content,'src.key')
                if( src_key==args.replace){
                    loc = args.page_field+'.'+index+'.src'
                    return false
                } else if( content.key==args.replace) {
                    loc = args.page_field+'.'+index
                    replace_img = _.extend(content, replace_img)
                    return false
                } else return true
            })

            if( loc){
                var setObj = {}
                setObj[ loc] = replace_img
                collection.update( cond, { $set: setObj })
            }
            return false
    }
}



/**
 * Future Images Publication
 */
Meteor.publish("futureImages", function(small) {
  // Only return images uploaded in the future from the moment of subscription
  var cond = { owner: this.userId }

  var date = new Date()
  var date_minus = new Date()
  date_minus.setHours( date.getHours()-1)
  cond.uploadedAt = { $gte: date_minus }

  var coll = small ? sImages : Images

  return coll.find( cond, {
    sort: { 'uploadedAt': -1 },
    fields: { 'copies': 1, },
    limit: 10, // 10 should be more than enough, but if you need more increase the value
  })
})
