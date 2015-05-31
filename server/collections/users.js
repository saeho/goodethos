
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
  return Meteor.users.find({ isTeam: true }, {
    fields: {
      'level': 1,
      'emails': 1,
      'organization': 1,
      'services': 1,
      'name': 1,
      'isTeam': 1
    }})
})


Meteor.methods({
  'change-role': function(user_id, changeLevel){
    check (user_id, String)
    check (changeLevel, Number)

    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)
    if (user.level<8 || !user.organization || changeLevel>8 || changeLevel<0) return false

    Meteor.users.update({
      _id: user_id,
      organization: user.organization
    },{
      $set: { level: changeLevel }
    })
    return true
  },
  'user-invite': function( o_id, user_id, assignLevel ){
    check (o_id, String)
    check (user_id, String)
    check (assignLevel, Number)

    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)
    if (user.level<8 || user.organization!=o_id || assignLevel>8 || assignLevel<0) return false

    Meteor.users.update( user_id, { $set: {
      invited: o_id,
      level: assignLevel
    }})
    Organizations.update({ _id: o_id,
      users: { $nin: [ user_id ] }
    }, {
      $push: { users: user_id }
    })
  },
  'remove-invite': function( o_id, user_id ){
    check (o_id, String)
    check (user_id, String)

    if (!this.userId) return false
    var user = Meteor.users.findOne( this.userId)
    if (user.level<8 || user.organization!=o_id) return false

    Meteor.users.update({ _id: user_id }, {
      $unset: { level: "", invited: "", organization: "" }
    })
    Organizations.update( o_id, {
      $pull: { users: user_id }
    })
  },
  'join-organization': function(){
    if (!this.userId) return false
    var user = Meteor.users.findOne(this.userId)
    var o = Organizations.findOne({ users: { $in: [this.userId] }})
    if (!o || !user || user.organization) return false // Exit if already in an organization

    Meteor.users.update( this.userId, {
      $set: { organization: o._id },
      $unset: { invited: '' }
    })
  },
  'decline-organization': function(){
    if( !this.userId) return false
    var user = Meteor.users.findOne( this.userId)
    var o = Organizations.findOne({ users: { $in: [this.userId] }})
    if (!o || !user) return false

    Meteor.users.update( this.userId, {
      $unset: { level: "" }
    })
    Organizations.update( o._id, {
      $pull: { users: this.userId }
    })
  },
})
