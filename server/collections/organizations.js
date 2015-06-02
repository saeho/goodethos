
Organizations_Schema = new SimpleSchema({
  slug: { type: String, min: 2, unique: true,
    autoValue: function(){
      if(this.isInsert){
        var full_name = this.field('name.full').value || ''
        var short_name = this.field('name.short').value || ''

        var o_name = full_name.length > short_name.length
          ? short_name
          : full_name
        o_name = ge.dictionary_check(o_name)
        if (o_name.length < 2) { return 0 } // Will break if it goes in here

                // Get slug without a check
                var slug = GE_Help.create_slug( o_name, 2 )
                var new_slug = slug
                var temp = 0

                // Condition for Slug Check loop
                var slug_check

                // Loop DB check until an empty slug is found.
                while( slug_check = Organizations.findOne({ slug: new_slug }) ) {
                    new_slug = slug+temp
                    temp++
                }
                return new_slug

            } else {
                this.unset()
            }
        } },
    name: { type: Object },
    "name.full": { type: String, max: 40, min: 4 },
    "name.short": { type: String, max: 5 },
    "mission": { type: String, optional: true },

    "users": { type: [String], optional: true },

    info: { type: Object },
    "info.type": { type: String,
        autoValue: function(){
            if(this.isInsert){
                if( _.contains( ['Nonprofit', 'Company', 'School', 'Writer'], this.value))
                    return this.value
                else
                    return 'Company'
            }
        }},
    "info.level": { type: Number, defaultValue: 1, max: 10 },
    "info.featured": { type: Number, defaultValue: 1, max: 10 },

    brand: { type: Object, defaultValue: {} },
    "brand.logo": { type: Object, optional: true },
        "brand.logo.key": { type: String, max: 50, optional: true },
        "brand.logo.full": { type: String, optional: true },
        "brand.logo.big": { type: String, optional: true },
        "brand.logo.medium": { type: String, optional: true },
        "brand.logo.small": { type: String, optional: true },
        "brand.logo.thumb": { type: String, optional: true },
    "brand.bg": { type: String, defaultValue: '#333' },
    "brand.bg_second": { type: String, defaultValue: '#4a4a4a' },
    "brand.color": { type: String, defaultValue: '#fff' },
    "brand.text": { type: String, defaultValue: 'brand-light', allowedValues: ['brand-dark','brand-light'] },

    address: { type: Object, defaultValue: {}, blackbox: true },
    "address.country": { type: String },
    "address.city": { type: String },
    "address.address": { type: String },
    "address.unit": { type: String },
    "address.state": { type: String },
    "address.postal": { type: String },

    social_media: { type: Object, defaultValue: {} },
    "social_media.facebook": { type: String, optional: true },
    "social_media.twitter": { type: String, optional: true },
    "social_media.linkedin": { type: String, optional: true },
    "social_media.instagram": { type: String, optional: true },
    "social_media.gplus": { type: String, optional: true },
    "social_media.web": { type: String, optional: true },

    "img": { type: [Object], optional: true },
        "img.$.type": { type: String, max: 20, optional: true, allowedValues: ['img'] },
        "img.$.value": { type: Object, optional: true, blackbox: true },
        "img.$.key": { type: String, max: 50,
            autoValue: function() {
                if ( !this.isSet) {
                    return GE_Help.random_string(12)
                }
            }},
        "img.$.full": { type: String, optional: true },
        "img.$.big": { type: String, optional: true },
        "img.$.medium": { type: String, optional: true },
        "img.$.small": { type: String, optional: true },
        "img.$.thumb": { type: String, optional: true },

    date_joined: { type: Date,
        autoValue: function() {
            if (this.isInsert) { return new Date }
            else if (this.isUpsert) { return { $setOnInsert: new Date} }
            else { this.unset() } // Created date update() will always fail. Only insert() is allowed.
        } },
})

Organizations.allow({
    update: function(userId, document, fields, modifier) {
        if (
            !_.contains( document.users, userId)
            || !_.has( modifier, '$set')
            || _.difference( fields, ['img','name','mission','social_media','brand']).length) return false

        var test = _.map( modifier.$set, function( val, key){
            // If in the future more fields are needed, just add it to this array
            if( _.contains( ['name.full','name.short','mission','brand.text','brand.bg','brand.bg_second'], key) ||
                key.indexOf('social_media.')==0 ||
                (key=='brand.logo' && _.isObject( val) && _.has( val, 'key')) ||
                _.contains( ['value'], key.substr( key.length - 5)) ) return true
                return false // else
        })

        return !_.contains( test, false)
    },
})

Organizations.deny({
    update: function(userId, docs, fields, modifier) {
        return _.contains(fields, 'users') || _.contains(fields, 'info') || _.contains(fields, 'slug') || _.contains(fields, 'date_joined') || _.contains(fields, '_id' )
    }
})

Meteor.publish('user-o', function() {
    var subs = []
    subs.push(
      Meteor.users.find({_id: this.userId}, {
        fields: {
            'level': 1,
            'organization': 1,
            'invited': 1,
            'services': 1,
            'name': 1,
            }
        }))

    var user = Meteor.users.findOne( this.userId )
    if( user && user.organization) {
        subs.push( Organizations.find(
                user.organization,{
                fields: {
                    'address': 1,
                    'brand': 1,
                    'info.type': 1, // Only need certain fields from info, don't publish featured/level
                    'mission': 1,
                    'name': 1,
                    'slug': 1,
                    'social_media': 1,
                    'users': 1
                }
            }))
    }
    return subs
})

// Methods
Meteor.methods({
    createOrganization: function( data) {
        var user = Meteor.user()
        if( !user || user.organization) { throw new Meteor.Error("not-authorized") }

        // Convert nested keys into single object
        var insertObj = { users: [user._id] }
        _.each( data, function(item, key){
            GE_Help.assign_nk( insertObj, key, item)
        })

        // Insert Organization
        Organizations.attachSchema(Organizations_Schema)
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
            Organizations.attachSchema( Organizations_Schema)

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
        Organizations.attachSchema( Organizations_Schema)

        var cur_data = Organizations.findOne( cond, { field: page_field })
        if( !cur_data) return false

        var new_array = _.filter( cur_data[ page_field], function( img) {
            return img.key && img.key!=delete_key
        })

        var setObj = {}
        setObj[ page_field] = new_array

        Posts.update( cond, { $set: setObj }, function(){
            // Delete image after pulling from page
            Images.remove( delete_key)
        })
    }
},
})

*/
