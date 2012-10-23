/**
 * Client-side JavaScript, bundled and sent to client.
 *
 * @author Marcio Ribeiro < mmr (at) b1n org >
 * @created Sun Oct 21 06:48:08 BRST 2012
 */

Cards = new Meteor.Collection("cards");
Pools = new Meteor.Collection("pools");
PoolCards = new Meteor.Collection("poolcards");

CARDS = {};
Meteor.subscribe('cards', function () {
    var cards = Cards.find().fetch();
    for (var i = 0; i < cards.length; i++) {
        var c = cards[i];
        CARDS[c._id] = c;
    }
});

Meteor.subscribe('pools', function () {
    if (!Session.get('pool_id')) {
        var pool = Pools.findOne({}, {sort: {name: 1}});
        if (pool) {
            Router.setPool(pool._id);
        }
    }
});

Meteor.autosubscribe(function () {
    var pool_id = Session.get('pool_id');
    if (pool_id) {
        Meteor.subscribe('poolcards', pool_id);
    }
});

////////// Pools //////////
Template.pools.pools = function () {
  return Pools.find({}, {sort: {name: 1}});
};

Template.pools.events({
    'mousedown .list': function (evt) { // select list
        Router.setPool(this._id);
    },
    'click .list': function (evt) {
        // prevent clicks on <a> from refreshing the page.
        evt.preventDefault();
    },
});

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.pools.selected = function () {
    return Session.equals('pool_id', this._id) ? 'selected' : '';
};

Template.pools.name_class = function () {
    return this.name ? '' : 'empty';
};

////////// Pool Cards //////////
Template.poolcards.show_img = function () {
    return Session.equals('show_img', true);
};

Template.poolcards.show_price = function () {
    return Session.equals('show_price', true);
};

Template.poolcards.any_pool_selected = function () {
    return !Session.equals('pool_id', null);
};

Template.poolcards.cards = function () {
    var pool_id = Session.get('pool_id');
    if (!pool_id) {
        return {};
    }

    var cards = [];
    var types = Session.get("types");
    var colors = Session.get("colors");
    var rarities = Session.get("rarities");
    types = types ? types.split(",") : null;
    colors = colors ? colors.split(",") : null;
    rarities = rarities ? rarities.split(",") : null;

    PoolCards.find({pool_id: pool_id}).forEach(function (ref) {
        var c = CARDS[ref.card_id];

        if ((!types || (types && _.intersection(types, c.types).length > 0)) && 
                (!colors || (colors && _.intersection(colors, c.colors).length > 0)) && 
                (!rarities || (rarities && _.contains(rarities, c.rarity)))) {
            cards.push({card: c, amount: ref.amount});
        }
    });

    var sort = Session.get("sort");

    inv = "";
    if (sort && sort[0] === "-") {
        sort = sort.substring(1);
        inv = "-";
    }

    var func = function (x) { return x.card.name; };
    if (sort === "Tipo") {
        func = function (x) { return parseInt(inv + x.card.types[0].charCodeAt(0)); };
    } else if (sort === "Cor") {
        func = function (x) {
            var vs = [ "W", "U", "B", "R", "G", "I" ];
            var ini = 0;
            if (x.card.colors.length > 1) {
                ini = 100;
            }
            for (var i = 0; i < vs.length; i++) {
                if (vs[i] === x.card.colors[0]) {
                    return parseInt(inv + (ini + i));
                }
            }
            return 0;
        };
    } else if (sort === "Raridade") {
        func = function (x) {
            var vs = [ "Common", "Uncommon", "Rare", "Mythic Rare" ];
            for (var i = 0; i < vs.length; i++) {
                if (vs[i] === x.card.rarity) {
                    return parseInt(inv + i);
                }
            }
            return 0;
        };
    } else if (sort === "Preço") {
        func = function (x) { return parseFloat(inv + x.card.price); };
    } else if (sort === "Custo") {
        func = function (x) { return parseInt(inv + x.card.cmc); };
    }
    cards = _.sortBy(cards, func);

/*
    total_price = 0;
    total_amount = 0;
    cards.forEach(function (x) {
        total_price += x.card.price * x.amount;
        total_amount += x.amount;
    });
    total_price = total_price.toFixed(2);
*/

    cards.price = 0;
    cards.amount = 0;
    var i = 0;
    cards.forEach(function (x) {
        cards.price += x.card.price * x.amount;
        cards.amount += x.amount;
        x.i = i++;
    });
    cards.price = cards.price.toFixed(2);

    return cards;
};

////////// Filters //////////
Template.card.odd = function () {
    return this.i % 2 === 1 ?"odd":"even";
};
Template.card.show_price = function () {
    return Session.equals('show_price', true);
};

Template.card.show_img = function () {
    return Session.equals('show_img', true);
};
Template.filter.types = function () {
    var types = [];
    var total_count = 0;

    PoolCards.find({pool_id: Session.get('pool_id')}).forEach(function (ref) {
        var card = CARDS[ref.card_id];
        _.each(card.types, function(v) {
            var o = _.find(types, function (x) { return x.n === v });
            var type = _.find(types, function (x) { return x.n === v });
            if (type) {
                type.count += ref.amount;
            } else {
                types.push({n: v, count: 1});
            }
        });
        total_count++;
    });

    types = _.sortBy(types, function (x) { return x.n; });
    return types;
};

Template.filter.colors = function () {
    var colors = [];
    var total_count = 0;

    PoolCards.find({pool_id: Session.get('pool_id')}).forEach(function (ref) {
        var card = CARDS[ref.card_id];
        _.each(card.colors, function(v) {
            var o = _.find(colors, function (x) { return x.n === v });
            var type = _.find(colors, function (x) { return x.n === v });
            if (type) {
                type.count += ref.amount;
            } else {
                colors.push({n: v, count: 1});
            }
        });
        total_count++;
    });

    var vs = [ "W", "U", "B", "R", "G", "I" ];
    colors = _.sortBy(colors, function (x) {
        for (var i = 0; i < vs.length; i++) {
            if (vs[i] === x.n) {
                return i;
            }
        }
        return 0;
    });
    return colors;
};

Template.filter.rarities = function () {
    var rarities = [];
    var total_count = 0;

    PoolCards.find({pool_id: Session.get('pool_id')}).forEach(function (ref) {
        var card = CARDS[ref.card_id];
        var rarity = _.find(rarities, function (x) { return x.n === card.rarity });
        if (rarity) {
            rarity.count += ref.amount;
        } else {
            rarities.push({n: card.rarity, count: 1});
        }
        total_count++;
    });

    var vs = [ "Common", "Uncommon", "Rare", "Mythic Rare" ];
    rarities = _.sortBy(rarities, function (x) {
        for (var i = 0; i < vs.length; i++) {
            if (vs[i] === x.n) {
                return i;
            }
        }
        return 0;
    });
    return rarities;
};

Template.filter.sorts = function () {
    return [
        {n: "Tipo"},
        {n: "Cor"},
        {n: "Custo"},
        {n: "Raridade"},
        {n: "Preço"}];
};

Template.filter.checked_show_price = function () {
    return Session.get("show_price") ? 'checked="checked"' : '';
};

Template.filter.checked_show_img = function () {
    return Session.get("show_img") ? 'checked="checked"' : '';
};

Template.filter.events({
    'click #show_price': function (evt, tmpl) {
        Session.set("show_price", tmpl.find("#show_price").checked);
    },

    'click #show_img': function (evt, tmpl) {
        Session.set("show_img", tmpl.find("#show_img").checked);
    },
});

Template.filter.text = function () {
    return this.n;
};

Template.filter.selected_type = function () {
    var vs = Session.get("types");
    if (!vs) {
        if (!this.n) {
            return 'selected';
        } else {
            return '';
        }
    }
    return _.contains(vs.split(","), this.n) ? 'selected' : '';
};

Template.filter.selected_color = function () {
    var vs = Session.get("colors");
    if (!vs) {
        return '';
    }
    return _.contains(vs.split(","), this.n) ? 'selected' : '';
};

Template.filter.selected_rarity = function () {
    var vs = Session.get("rarities");
    if (!vs) {
        return '';
    }
    return _.contains(vs.split(","), this.n) ? 'selected' : '';
};

Template.filter.selected_sort = function () {
    var s = Session.get('sort');
    if (s === this.n) {
        return 'selected';
    } else if (s === "-" + this.n) {
        return 'inv_selected';
    } else {
        return '';
    }
};

Template.filter.events({
    "mousedown .type": function () {
        if (!this.n) {
            Session.set("types", null);
            Session.set("colors", null);
            Session.set("rarities", null);
            return;
        }
        var types = Session.get("types");
        if (!types) {
            Session.set("types", this.n);
            return;
        }
        var vs = types.split(",");
        var should_add = true;
        for (var i = vs.length - 1; i >= 0; i--) {
            if (vs[i] === this.n) {
                vs.splice(i, 1);
                should_add = false;
                break;
            }
        }
        if (should_add) {
            vs.push(this.n);
        }
        if (vs.length === 0) {
            Session.set("types", null);
        } else {
            Session.set("types", vs.join(","));
        }
    },

    "mousedown .color": function () {
        var colors = Session.get("colors");
        if (!colors) {
            Session.set("colors", this.n);
            return;
        }
        var vs = colors.split(",");
        var should_add = true;
        for (var i = vs.length - 1; i >= 0; i--) {
            if (vs[i] === this.n) {
                vs.splice(i, 1);
                should_add = false;
                break;
            }
        }
        if (should_add) {
            vs.push(this.n);
        }
        if (vs.length === 0) {
            Session.set("colors", null);
        } else {
            Session.set("colors", vs.join(","));
        }
    },

    "mousedown .rarity": function () {
        if (!this.n) {
            Session.set("rarities", null);
            return;
        }
        var vs = Session.get("rarities");
        if (!vs) {
            Session.set("rarities", this.n);
            return;
        }
        vs = vs.split(",");
        var should_add = true;
        for (var i = vs.length - 1; i >= 0; i--) {
            if (vs[i] === this.n) {
                vs.splice(i, 1);
                should_add = false;
                break;
            }
        }
        if (should_add) {
            vs.push(this.n);
        }
        if (vs.length === 0) {
            Session.set("rarities", null);
        } else {
            Session.set("rarities", vs.join(","));
        }
    },

    "mousedown .sort": function () {
        var s = Session.get("sort");
        if (s === this.n) {
            Session.set("sort", "-" + this.n);
        } else if (s === "-" + this.n) {
            Session.set("sort", null);
        } else {
            Session.set("sort", this.n);
        }
    },
});

////////// Tracking selected pool in URL //////////

var PoolsRouter = Backbone.Router.extend({
    routes: {
        ":pool_id": "main"
    },
    main: function (pool_id) {
        Session.set("pool_id", pool_id);
        Session.set("show_price", Session.get("show_price"));
        Session.set("show_img", Session.get("show_img"));
        Session.set("types", Session.get("types"));
        Session.set("colors", Session.get("colors"));
        Session.set("rarities", Session.get("rarities"));
        Session.set("sort", Session.get("sort"));
    },
    setPool: function (pool_id) {
        this.navigate(pool_id, true);
    }
});

Router = new PoolsRouter;

Meteor.startup(function () {
    Backbone.history.start({pushState: true});
});
