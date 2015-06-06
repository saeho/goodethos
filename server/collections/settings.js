
GE_Settings_Schema = new SimpleSchema({
  type: { type: String, max: 40, unique: true },
  last_edited: {
    type: Date,
    autoValue: function() {
      return new Date()
    }
  },

  // Site Info
  "site_name": { type: String, max: 255, optional: true },
  "site_shortname": { type: String, max: 255, optional: true },

  // Amazon s3
  "accessKeyId": { type: String, max: 350, optional: true },
  "bucket": { type: String, max: 125, optional: true },
  "folder": { type: String, max: 125, optional: true },
  "root": { type: String, max: 125, optional: true },
  "region": { type: String, max: 125, optional: true },
})

Meteor.publish('user-o', function() {
  return [
    Meteor.users.find({_id: this.userId}, {
      fields: {
        'level': 1,
        'isStaff': 1,
        'invited': 1,
        'services': 1,
        'name': 1,
        }
      }),
    GE_Settings.find({ type: 'site_info' })
  ]
})

// Methods
Meteor.methods({
  /**
   * Install function is written pretty loosely. But I think its workign fine without any problems.
   */
  install_goodethos: function(data) {
    GE_Settings.attachSchema(GE_Settings_Schema)

    _.map( data, function(v,k){
      if (!v.length)
        delete data[k]
    })

    if (!_.has(data, 'site_name') || !_.has(data, 'site_shortname'))
      throw new Meteor.Error("Incomplete")

    GE_Settings.insert({
      type: 'site_info',
      site_name: data.site_name,
      site_shortname: data.site_shortname,
    })

    var keys = _.keys(data)
    var awsInput = ['accessKeyId','secretAccessKey','bucket','folder','root','region']

    if (_.intersection(awsInput, keys).length==awsInput.length) {
      var col = { type: 'aws' }
      _.extend(col, GE_Help.filterObj(data, function(v,k){
        return _.contains(awsInput, k)
      }))
      GE_Settings.insert(col)
    }

    // Create Admin
    if (data.username && data.email && data.password) {
      var userId = Accounts.createUser({
          username: data.username,
          email: data.email.toLowerCase(),
          password: data.password,
      })
      if (userId)
        Meteor.users.update(userId, { $set: { level: 10, isStaff: true }})
    }
  },


    createOrganization: function( data) {
        var user = Meteor.user()
        if( !user || user.organization) { throw new Meteor.Error("not-authorized") }

        // Convert nested keys into single object
        var insertObj = { users: [user._id] }
        _.each( data, function(item, key){
            GE_Help.assign_nk( insertObj, key, item)
        })

        // Insert Organization
        Organizations.attachSchema(GE_Settings_Schema)
        var o_id = Organizations.insert( insertObj)
        var update = Meteor.users.update( user._id, {
            $set: {
                organization: o_id,
                level: 10 // This person created the organization make him/her an admin
            }
        })

        if( update) return o_id
        else return false
    },
    /*
        Pop one image from the array.
    */
    popImg: function( id, delete_array, args) {
        check( id, String )
        check( delete_array, Match.OneOf(String, Array) )

        var user_id = Meteor.userId()
        if ( !user_id ) { throw new Meteor.Error("not-authorized") }
        else {
            var args = args || {}
            var page_field = args.page_field || 'img'

            var cond = id
            Organizations.attachSchema( GE_Settings_Schema)

            var cur_data = Organizations.findOne( cond, { field: page_field })
            if( !cur_data) return false
            if( !_.isArray( delete_array)) delete_array = [delete_array]

            var pullObj = {}
            pullObj[ page_field] = { key: { $in: delete_array } }

            Organizations.update( cond, { $pull: pullObj }, function(){
                // Delete images after pulling from page
                _.each( delete_array, function( key){
                    Images.remove(key)
                })
            })
        }
    },
})


/*

popImg: function( id, delete_key, args) {
    check( id, String )
    check( delete_key, String )

    var user_id = Meteor.userId()
    if ( !user_id ) { throw new Meteor.Error("not-authorized") }
    else {
        var args = args || {}
        var page_field = args.page_field || 'img'

        var cond = { _id: id }
        Organizations.attachSchema( GE_Settings_Schema)

        var cur_data = Organizations.findOne( cond, { field: page_field })
        if( !cur_data) return false

        var new_array = _.filter( cur_data[ page_field], function( img) {
            return img.key && img.key!=delete_key
        })

        var setObj = {}
        setObj[ page_field] = new_array

        GE_Posts.update( cond, { $set: setObj }, function(){
            // Delete image after pulling from page
            Images.remove( delete_key)
        })
    }
},
})

*/
