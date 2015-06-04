
PostsSchema = new SimpleSchema({
  user: { type: String,
    autoValue: function(){
      if(this.isInsert)
        return Meteor.userId()
      else
        this.unset()
    }},
  slug: { type: String, optional: true, // Unpublished posts may not have slugs
    autoValue: function() {
      var status = this.field('status').value
      if(_.isUndefined(status))
        this.unset()
      else if(this.isInsert || status<4)
        return null
      else {
        var title = this.field('content.title').value
        var slug = GE_Help.create_slug(title, 2)
        var new_slug = slug
        var slug_condition = { slug: new_slug } // Always make sure this is the first item so the while() condition can match

        // Loop DB check until an empty slug is found.
        while(Posts.findOne(slug_condition)) {
          new_slug = slug+GE_Help.random_string()
          slug_condition.$and[0] = { slug: new_slug }
        }
        return new_slug
      }
    }},
  status: { type: Number, defaultValue: 1 }, // 1: Draft -- 2: ???? -- 3: ???? -- 4: Published

  content: { type: Object, defaultValue: {} },
  "content.title": { type: String, max: 100, optional: true, // Make titles optional so that new blog post creations by URL is possible
    autoValue: function() {
      if (this.value)
        return GE_Help.strip_tags( this.value)
      else
        return this.unset()
    }},
  "content.summary": { type: String, max: 255, optional: true },

  "content.body": { type: [Object], defaultValue: [{ type: 'text', value: '' }] },
  "content.body.$.key": { type: String, max: 50,
    autoValue: function() {
      if (!this.isSet)
        return GE_Help.random_string(12)
    }},
  "content.body.$.type": { type: String, max: 20, allowedValues: ['text','img','gallery','youtube','vimeo'] },
  "content.body.$.style": { type: String, max: 20, optional: true },
  "content.body.$.value": { type: String, optional: true },
  "content.body.$.date": { type: Date, optional: true },

  "content.body.$.src": { type: Object, optional: true },
  "content.body.$.src.key": { type: String, optional: true },
  "content.body.$.src.title": { type: String, optional: true, max: 100 },
  "content.body.$.src.desc": { type: String, optional: true, max: 255 },
  "content.body.$.src.size": { type: String, optional: true, max: 20 },
  "content.body.$.src.full": { type: String, optional: true },
  "content.body.$.src.big": { type: String, optional: true },
  "content.body.$.src.medium": { type: String, optional: true },
  "content.body.$.src.small": { type: String, optional: true },
  "content.body.$.src.thumb": { type: String, optional: true },

  "content.body.$.group.$.key": { type: String, max: 50,
    autoValue: function() {
      if ( !this.isSet)
        return GE_Help.random_string(12)
    }},
  "content.body.$.group.$.type": { type: String, max: 20, optional: true },
  "content.body.$.group.$.style": { type: String, max: 20, optional: true },
  "content.body.$.group.$.value": { type: Object, optional: true, blackbox: true }, // Used for Social Media items to store its data
  "content.body.$.group.$.src": { type: Object, optional: true },
  "content.body.$.group.$.src.key": { type: String, optional: true },
  "content.body.$.group.$.src.full": { type: String, optional: true },
  "content.body.$.group.$.src.big": { type: String, optional: true },
  "content.body.$.group.$.src.medium": { type: String, optional: true },
  "content.body.$.group.$.src.small": { type: String, optional: true },
  "content.body.$.group.$.src.thumb": { type: String, optional: true },

  "content.img": { type: [Object], defaultValue: [] },
  "content.img.$.key": { type: String, optional: true },
  "content.img.$.style": { type: String, max: 20, optional: true },
  "content.img.$.value": { type: Object, optional: true, blackbox: true },
  "content.img.$.full": { type: String, optional: true },
  "content.img.$.big": { type: String, optional: true },
  "content.img.$.medium": { type: String, optional: true },
  "content.img.$.small": { type: String, optional: true },
  "content.img.$.thumb": { type: String, optional: true },

  /*
   * "content.gallery" is depreciated.
   * It will be removed later.
  */
  "content.gallery": { type: [Object], optional: true },
  "content.gallery.$.type": { type: String, max: 20, optional: true, allowedValues: ['empty','img','youtube','vimeo','twitter','instagram'] },
  "content.gallery.$.value": { type: Object, optional: true, blackbox: true },
  "content.gallery.$.key": { type: String, max: 50,
    autoValue: function() {
      if ( !this.isSet)
        return GE_Help.random_string(12)
    }},
  "content.gallery.$.style": { type: String, optional: true, max: 20 },
  "content.gallery.$.row": { type: Number, optional: true },
  "content.gallery.$.full": { type: String, optional: true },
  "content.gallery.$.big": { type: String, optional: true },
  "content.gallery.$.medium": { type: String, optional: true },
  "content.gallery.$.small": { type: String, optional: true },
  "content.gallery.$.thumb": { type: String, optional: true },

  /*
   * Published posts have "featured" object.
   * "content.featured" is the image that was chosen by the user to be the featured image.
  */
  "content.featured": { type: Object, optional: true },
  "content.featured.key": { type: String, optional: true },
  "content.featured.full": { type: String, optional: true },
  "content.featured.big": { type: String, optional: true },
  "content.featured.medium": { type: String, optional: true },
  "content.featured.small": { type: String, optional: true },
  "content.featured.thumb": { type: String, optional: true },

  layout: { type: Object, defaultValue: {} },
  "layout.style": { type: String, defaultValue: 'regular', max: 20 },
  "layout.v_align": { type: Boolean, defaultValue: true, },
  "layout.c_align": { type: Boolean, defaultValue: true },
  "layout.on_top": { type: Boolean, defaultValue: false },

  info: { type: Object, defaultValue: {} },
  "info.rel": { type: String, defaultValue: '', max: 20, optional: true },
  "info.topic": { type: String, defaultValue: '', max: 20, optional: true },
  "info.type": { type: String, defaultValue: 'unknown', allowedValues: ['unknown', 'story', 'blog', 'note'] },
  "info.featured": { type: Number, defaultValue: 0, max: 10 }, // Currently Unused
  "info.comment": { type: Boolean, defaultValue: true },

  date: { type: Object, defaultValue: {} },
  "date.created": { type: Date, denyUpdate:true,
    autoValue: function() {
      if (this.isInsert) return new Date()
      else if (this.isUpsert) { return { $setOnInsert: new Date() } }
      else { this.unset() } // Created date update() will always fail. Only insert() is allowed.
    }},
  "date.published": { type: Date, optional: true },
  "date.edited": { type: Date,
    autoValue: function() {
      return new Date()
    }},
})

Posts.allow({
  insert: function(userId, doc) {
    return userId.length>2
  },
  update: function(userId, doc, fields, modifier) {
    if (!doc.user || doc.status<=0) return false // Must be logged in; the post must not be in trash.
    else if (doc.user !== userId) {
      var user = Meteor.user()
      if (!user.isStaff) return false
    }
    var modifierTest = _.every(modifier, function(op){
      var test = _.map(op, function(val, key){
          // If in the future more fields are needed, just add it to this array
          if( _.contains( ['date.edited','date.published','info.topic','info.comment'], key) ||
              _.contains( ['.type','style','break'], key.substr( key.length - 5)) ) return true
          return false // else
      })
      return !_.contains(test, false)
    })
    return modifierTest
  },
  remove: function(userId, doc) {
    // Check if delete is allowed
    if (!userId || !doc.user || !_.contains(['blog','note'], doc.info.type)) return false
    else if (doc.user!==userId){
      var user = Meteor.user()
      if(!user.isStaff && user.level) return false
    }
    if(doc.info.type=='blog'){
      // Check if page is empty before deleting
      var has_title = GE_Help.nk(doc, 'content.title')
      var has_summary = GE_Help.nk(doc, 'content.summary')
      var has_img = GE_Help.nk(doc, 'content.img.0.key')
      var has_content = GE_Help.nk(doc, 'content.body')
        ? _.every( doc.content.body, function(block){
      		var type = block.type || 'text'
      		var val = (block.value || '').trim()
          return type!='text' || (val && val!='<p></p>')
      	})
        : false
      return (!has_title && !has_summary && !has_content && !has_img)
    } else
      return true // This is a note, allow delete.
    return false // If not an empty blog, always return false. Use a method to delete all associated images before deleting the page.
  }
})

Posts.deny({
  remove: function(userId, doc) {
    return doc.locked // can't remove locked documents
  },
  fetch: ['locked'] // no need to fetch
})

// Methods
Meteor.methods({
  /**
   * Create a Post
   * @data
   */
  createPost: function(data) {
    var user = Meteor.user()
    if(!user || !user.isStaff) throw new Meteor.Error("not-authorized") // Exit if user doesn't belong to any organization

    if (!ge.user_can('write', user.level)) throw new Meteor.Error("not-authorized") // Exit if user is not part of this organization

    Posts.attachSchema(PostsSchema)

    data.user = user._id
    if (!_.has(data,'status'))
      data.status = 1
    else if (data.status==4) {
      // If published, it must have content.
      data.date = { published: new Date() }
      if (!_.isString(data['content.body']) || !data['content.body'].trim().length)
        throw new Meteor.Error("empty", "You must write something.")
    }

    // Used for Notes: If content.body is string, convert to Object format
    if (_.isString(data['content.body'])){
      data.content = { body: [ge.empty_text_block(data['content.body'])] }
      delete data['content.body']
    }

    var created_id = Posts.insert(data)
    return created_id
  },
  /**
   * Split the content (text) block at position and insert new content in between them.
   */
  splitPageBlock: function (page_id, insert, split, field) {
    check (page_id, String)
    check (insert, Object)
    check (split, Object)

    var user = Meteor.user()
    if (!field) field = 'content.body'

    if (!user || !user.isStaff) throw new Meteor.Error("not-authorized")

    Posts.attachSchema (PostsSchema)

    var update_data = {}
    var cur_data = Posts.findOne (page_id, { field : field })
    cur_data = GE_Help.nk (cur_data, field)
    if (!_.isArray(cur_data)) throw new Meteor.Error("not_found", "Could not find the post data.")

    var loc = ge.find_pos (cur_data, split.key)
    var before = ge.empty_text_block (split.before, split.before.key)
    var after = ge.empty_text_block (split.after, split.after.key)

    cur_data.splice (loc, 1, before, insert, after)
    update_data[field] = cur_data
    Posts.update (page_id, { $set: update_data })

    return {
      before: before,
      after: after
    }
  },
  /**
   * Remove content block at #th position with matching key.
   */
  popPageBlock: function (page_id, key, field) {
    check (key, String)
    check (page_id, String)

    var user = Meteor.user()
    var field = field || 'content.body'

    if (!user || !user.isStaff)
      throw new Meteor.Error("not-authorized")

    var cond = { $and: [
      { _id: page_id },
      { status: { $lt: 4 } }
    ]}

    Posts.attachSchema (PostsSchema)
    var content = Posts.findOne (cond)
    content = GE_Help.nk (content, field)
    if (!content) throw new Meteor.Error("not_found", "Could not find the post data.")

    var loc = ge.find_pos(content, key)
    if (!loc) return false // Not Found

    // If the deleted content block is an image, also remove it from Images collection.
    if (GE_Help.nk(content[loc], 'src.key'))
      Images.remove(content[loc].src.key)
    else if (field=='content.img' && content[loc].key)
      Images.remove(content[loc].key)

    // Remove item at position
    content.splice(loc,1)

    if (GE_Help.nk(content, (loc-1)+'.type')=='text' && GE_Help.nk(content, loc+'.type')=='text'){
      content[loc-1].value = content[loc-1].value + content[loc].value
      content.splice(loc,1)
    }

    var update = {}
    update[field] = content
    return Posts.update( cond, { $set: update })
  },
  /**
   * Remove item from Gallery
   */
  popGalleryItem: function(page_id, deleteKeys, blockIndex, field) {
    check (page_id, String)
    check (deleteKeys, Match.OneOf(String, Array))

    var user = Meteor.user()
    if (!user || !user.isStaff) throw new Meteor.Error("not-authorized")

    var field = field || 'content.body'
    if (blockIndex!==false) field += '.'+blockIndex+'.group'

    Posts.attachSchema (PostsSchema)

    var data = Posts.findOne (page_id, { field: field })
    data = GE_Help.nk (data, field)
    if (!data) return false

    if (!_.isArray(deleteKeys)) deleteKeys = [deleteKeys]

    var deleteArray = _.map( _.filter (data, function(item) {
      return _.contains(deleteKeys, item.key)
    }), function(filtered){
      if (filtered.src && filtered.src.key) return filtered.src.key
      else if (!filtered.type || filtered.type=='img') return filtered.key
    })

    var pullObj = {}
    pullObj[ field] = { key: { $in: deleteKeys } }

    return Posts.update (page_id, { $pull: pullObj }, function(err,res){
      if (!err)
        _.each (deleteArray, function( key){
          Images.remove(key)
        })
    })
  },
  updatePageBlock: function(field, page_id, updateObj) {
    check (field, String)
    check (page_id, String)
    check (updateObj, Object)

    var user = Meteor.user()
    if (!user || !user.isStaff) throw new Meteor.Error("not-authorized")

    var cond = { $and: [{ _id: page_id }] }
    var cond_pf = {}; cond_pf[field] = { $exists: true }
    cond.$and.push(cond_pf)

    Posts.attachSchema (PostsSchema)
		Posts.update (cond, { $set: updateObj })
  },
  /**
   * DEPRECIATED
   * Was originally used for Event Posts
   * Kept here for reference, needs to be removed later.
   */
  pushPageBlock: function(field, page_id, updateObj) {
    check (field, Match.OneOf(String, [String]))
    check (updateObj, Match.OneOf(Object, [Object]))
    check (page_id, String)

    if (!_.isArray(field)) field = [field]
    if (!_.isArray(updateObj)) updateObj = [updateObj]

      // #### IMPORTANT NOTE
      // #### At the time of writing this function, Meteor.JS does NOT support Mongo 2.6.5
      // #### Which means Mongo $push/$position operator is NOT available.
      // #### i.e. { $push: { 'content.gallery': { $each: [extra], $position: index }}}

    var user = Meteor.user()
    if (!user || !user.isStaff) throw new Meteor.Error("not-authorized")

    // Find Order and Field Name
    var field = _.map( field, function(field) {
      var fieldArr = field.split('.')
      var position = Number(fieldArr[fieldArr.length-1]) + 1
      fieldArr.pop()

      return {
        name: fieldArr.join('.'),
        pos: position
      }
    })

    var getJ = _.object( _.map( field, function(f){
      return [f.name, 1]
    }))

    // Get cur data and push
    var data = Posts.findOne(page_id, { field : get })
    var return_obj = []
    var update_data = { $set: {} }
    var return_check = false

    // Loop through each push request and push it to position
    _.each( field, function( f, index){
      var cur_data = data ? GE_Help.nk( data, f.name) : false
      var push_obj = updateObj[ index] || false

      if( push_obj){
        if( !_.has( push_obj, 'key')) push_obj.key = GE_Help.random_string(12)
        return_obj.push( push_obj.key)
        return_check = true

        if( cur_data) {
          // # # # # If field exists, splice it into position
          cur_data.splice( f.pos, 0, push_obj)
          update_data.$set[ f.name] = cur_data
        } else if( f.pos===1) {
          // # # # # If field doesn't exist and , replace the entire group
          update_data.$set[ field.name] = [push_obj]
        }
      }
    })

    // Update
    if( return_check){
      Posts.update(page_id, update_data)
      return return_obj.length>1 ? return_obj : return_obj[0]
    }
    return false
  },
  /**
   * Update the Page
   */
  updatePage: function( page_id, data ) {
    var user = Meteor.user()
    if (!user || !user.isStaff) throw new Meteor.Error("not-authorized")

    Posts.attachSchema (PostsSchema)
    Posts.update(page_id, { $set: data })
  },
  /**
   * Publish or Draft Page (POD)
   * @args (Object)
   */
  podPost: function(args) {
    check (args, Object)
    var defaults = {
      // These values are expected in args variable
      // If any of these values are not set, the function won't proceed.
      _id: false,
      status: false,
      type: false,
      content: false
  	}
  	args = _.defaults(args, defaults)

    var user = Meteor.user()

    var test = _.every(args, function(v,k){
      return !_.has(defaults, k) || v!==false
    })
    if (!test || args.status<=0 || user.level<3) return false // Not allowed

    var cond = [
      { 'info.type': args.type },
      { _id: args._id }]

    // If level is 3 or 4, then the page in question MUST be owned by the user
    if (user.level<5) cond.push({ user: user._id })

    var cond = { $and: cond }
    var set = {
      status: args.status,
      'content.body': args.content,
      slug: 1 // Slug is auto calculated, you just need to set it to whatever
    }

    if (args.status>=4 && args.title) {
      set['content.title'] = args.title
      if (args.publish_date) set['date.published'] = new Date()
      if (args.img) set['content.featured'] = args.img
    } else if (args.status>=4)
      return false // If publishing with no content, do not proceed

    var pod_func = function(cb) {
      Posts.attachSchema(PostsSchema)
      Posts.update( cond, { $set: set }, function(err,res){
        if(err) {
          console.warn(err)
          var result = false
          cb && cb (null, result)
        } else {
          var new_page = Posts.findOne( args._id, {content: 1, status: 1, slug: 1})
          // Return new page data (you need to return it because Meteor reactivity & contenteditables don't play well together.)
          cb && cb (null, new_page)
        }
      }) // END : Update Page
    } // END : POD Func

    var pod_func_async = Meteor.wrapAsync( pod_func )
    return pod_func_async()
  },
})
/**
 * Publish a single page.
 * @args = Find a single page by ID or by Slug
 */
Meteor.publish('single-page', function(args) {
  check(args, Object)

  if (args.p_id)
    var p_cond = args.p_id // Find Single Page by ID
  else if (args.p_slug)
    var p_cond = { slug: args.p_slug } // Find Single Page by Slug
  else
    return this.ready()

  return Posts.find( p_cond, {
    fields: {
      'info.featured': 0,
    } })
})

/**
 * Publish all written publications.
 */
Meteor.publish('o-pubs', function() {
  var cond = {
    $query: {
      // user: this.userId, // If you want to disallow shared company-wide publications
    },
    $orderby: { 'date.published': -1, 'date.edited': -1 }}
  var o_pubs = Posts.find( cond, { fields: {
    'info.featured': 0,
    'layout': 0,
  }})

  // Return all team info
  var team = Meteor.users.find({
      isTeam: true
    },{
    fields: {
      'level': 1,
      'isStaff': 1,
      'emails': 1,
      'services': 1,
      'name': 1,
    }})
  return [o_pubs, team]
})
