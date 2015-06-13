
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
  "description": { type: String, max: 170, optional: true },

  // Amazon s3
  "accessKeyId": { type: String, max: 350, optional: true },
  "bucket": { type: String, max: 125, optional: true },
  "folder": { type: String, max: 125, optional: true },
  "root": { type: String, max: 125, optional: true },
  "region": { type: String, max: 125, optional: true },

  // Social Media
  "social_media": { type: Object, optional: true },
  "social_media.web": { type: String, optional: true, max: 255 },
  "social_media.gplus": { type: String, optional: true, max: 255 },
  "social_media.facebook": { type: String, optional: true, max: 255 },
  "social_media.twitter": { type: String, optional: true, max: 255 },
  "social_media.instagram": { type: String, optional: true, max: 255 },
  "social_media.linkedin": { type: String, optional: true, max: 255 },

  // Brand
  "brand": { type: Object, optional: true },
  "brand.logo": { type: Object, optional: true },
    "brand.logo.key": { type: String, max: 50, optional: true },
    "brand.logo.medium": { type: String, optional: true },
    "brand.logo.small": { type: String, optional: true },
    "brand.logo.thumb": { type: String, optional: true },
  "brand.bg": { type: String, optional: true },
  "brand.bg_second": { type: String, optional: true },
  "brand.color": { type: String, optional: true },
  "brand.text": { type: String, defaultValue: 'brand-light', allowedValues: ['brand-dark','brand-light'], optional: true },

})

Meteor.publish('user-o', function() {
  return [
    Meteor.users.find({
        $or: [
          { _id: this.userId },
          { isStaff: false },
          { isStaff: { $exists: false }}
        ]
      },{
      fields: {
        'level': 1,
        'isStaff': 1,
        'invited': 1,
        'services': 1,
        'name': 1,
        'profile_img': 1
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
    // var awsInput = ['accessKeyId','secretAccessKey','bucket','folder','root','region']

    // if (_.intersection(awsInput, keys).length==awsInput.length) {
    //   var col = { type: 'aws' }
    //   _.extend(col, GE_Help.filterObj(data, function(v,k){
    //     return _.contains(awsInput, k)
    //   }))
    //   GE_Settings.insert(col)
    // }

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
  update_site_info: function(data) {
    var user = Meteor.user()
    if (user.isStaff && ge.user_can('control_profile',user.level)) {
      GE_Settings.attachSchema(GE_Settings_Schema)
      GE_Settings.update({ type: 'site_info' }, {
        $set: data
      })
    }
  },
  check_aws: function() {
    return Meteor.settings && Meteor.settings.AWS
  }
})
