/**
 * Publish db collections.
 *
 * @author Marcio Ribeiro < mmr (at) b1n org >
 * @created Sun Oct 21 06:48:08 BRST 2012
 */

// Cards -- {name: String,
//           price: Number,
//           colors: [String, ...],
//           types: [String, ...],
//           cost: String,
//           rarity: String,
//           img: Number}
Cards = new Meteor.Collection("cards");

// Publish complete set of cards to all clients.
Meteor.publish("cards", function () {
    return Cards.find();
});

// Pools -- {name: String}
Pools = new Meteor.Collection("pools");

// Publish complete set of cards to all clients.
Meteor.publish("pools", function () {
    return Pools.find();
});

// PoolCards -- {pool_id: String,
//               card_id: String,
//               amount: Number}
PoolCards = new Meteor.Collection("poolcards");

// Publish all items for requested pool_id.
Meteor.publish("poolcards", function (pool_id) {
    return PoolCards.find({pool_id: pool_id});
});

