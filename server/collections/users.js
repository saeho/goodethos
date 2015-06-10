
Meteor.users.allow({
  update: function(userId, doc, fields, modifier) {
    return doc._id===userId
  },
  remove: function(userId, document) {
    return false
  }
})

Meteor.users.deny({
  update: function(userId, docs, fields, modifier) {
    var test = _.intersection(['organization', 'username', '_id', 'createdAt'], fields)
    return !_.isEmpty(test)
  }
})

Meteor.publish('team', function(){
  return Meteor.users.find({ isStaff: true }, {
    fields: {
      'level': 1,
      'isStaff': 1,
      'emails': 1,
      'services': 1,
      'name': 1,
      'profile_img': 1
    }})
})


Meteor.methods({
  'change-role': function(user_id, changeLevel){
    check (user_id, String)
    check (changeLevel, Number)

    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)
    if (user.level<8 || !user.isStaff || changeLevel>8 || changeLevel<0) return false

    Meteor.users.update({
      _id: user_id,
    },{
      $set: { level: changeLevel }
    })
    return true
  },
  'user-invite': function(user_id, assignLevel){
    check (user_id, String)
    check (assignLevel, Number)

    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)
    if (user.level<8 || assignLevel>8 || assignLevel<0) return false

    Meteor.users.update( user_id, { $set: {
      invited: true,
      level: assignLevel
    }})
  },
  'remove-invite': function(user_id){
    check (user_id, String)

    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)
    if (!(user.level>=8 || (user._id==user_id && user.invited))) return false

    Meteor.users.update({ _id: user_id }, {
      $unset: { level: "", invited: "" }
    })
  },
  'join-organization': function(){
    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)
    if (user.invited)
      Meteor.users.update( this.userId, {
        $set: { isStaff: true },
        $unset: { invited: '' }
      })
  },
  'update_profile_img': function(img){
    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)

    if (GE_Help.nk(user, 'services.password')) {
      console.log(img)
      Meteor.users.update( this.userId, {
        $set: { profile_img: img }
      })
    }
  },
})
