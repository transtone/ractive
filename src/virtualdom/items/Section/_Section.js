import types from 'config/types';
import Mustache from 'virtualdom/items/shared/Mustache/_Mustache';

import bubble from 'virtualdom/items/Section/prototype/bubble';
import detach from 'virtualdom/items/Section/prototype/detach';
import find from 'virtualdom/items/Section/prototype/find';
import findAll from 'virtualdom/items/Section/prototype/findAll';
import findAllComponents from 'virtualdom/items/Section/prototype/findAllComponents';
import findComponent from 'virtualdom/items/Section/prototype/findComponent';
import findNextNode from 'virtualdom/items/Section/prototype/findNextNode';
import firstNode from 'virtualdom/items/Section/prototype/firstNode';
import merge from 'virtualdom/items/Section/prototype/merge';
import render from 'virtualdom/items/Section/prototype/render';
import setValue from 'virtualdom/items/Section/prototype/setValue';
import splice from 'virtualdom/items/Section/prototype/splice';
import teardown from 'virtualdom/items/Section/prototype/teardown';
import toString from 'virtualdom/items/Section/prototype/toString';
import unrender from 'virtualdom/items/Section/prototype/unrender';
import update from 'virtualdom/items/Section/prototype/update';

var Section = function ( options ) {
	this.type = types.SECTION;
	this.inverted = !!options.template.n;

	this.pElement = options.pElement;

	this.fragments = [];
	this.fragmentsToAdd = [];
	this.fragmentsToRemove = [];

	this.length = 0; // number of times this section is rendered

	Mustache.init( this, options );
};

Section.prototype = {
	bubble: bubble,
	detach: detach,
	find: find,
	findAll: findAll,
	findAllComponents: findAllComponents,
	findComponent: findComponent,
	findNextNode: findNextNode,
	firstNode: firstNode,
	merge: merge,
	rebind: Mustache.rebind,
	render: render,
	resolve: Mustache.resolve,
	setValue: setValue,
	splice: splice,
	teardown: teardown,
	toString: toString,
	unrender: unrender,
	update: update
};

export default Section;
