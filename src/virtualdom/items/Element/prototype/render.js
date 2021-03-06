import { namespaces } from 'config/environment';
import { isArray } from 'utils/is';
import { warn } from 'utils/log';
import { create, defineProperty } from 'utils/object';
import { createElement } from 'utils/dom';
import noop from 'utils/noop';
import runloop from 'global/runloop';
import getInnerContext from 'shared/getInnerContext';
import { render as renderImage } from '../special/img';
import { render as renderForm } from '../special/form';
import Transition from '../Transition/_Transition';

var updateCss, updateScript;

updateCss = function () {
	var node = this.node, content = this.fragment.toString( false );

	// IE8 has no styleSheet unless there's a type text/css
	if ( window && window.appearsToBeIELessEqual8 ) {
		node.type = 'text/css';
	}

	if ( node.styleSheet ) {
		node.styleSheet.cssText = content;
	} else {

		while ( node.hasChildNodes() ) {
			node.removeChild( node.firstChild );
		}

		node.appendChild( document.createTextNode(content) );
	}
};

updateScript = function () {
	if ( !this.node.type || this.node.type === 'text/javascript' ) {
		warn( 'Script tag was updated. This does not cause the code to be re-evaluated!' );
		// As it happens, we ARE in a position to re-evaluate the code if we wanted
		// to - we could eval() it, or insert it into a fresh (temporary) script tag.
		// But this would be a terrible idea with unpredictable results, so let's not.
	}

	this.node.text = this.fragment.toString( false );
};

export default function Element$render () {
	var root = this.root, namespace, node, transition;

	namespace = getNamespace( this );
	node = this.node = createElement( this.name, namespace );

	// Is this a top-level node of a component? If so, we may need to add
	// a data-ractive-css attribute, for CSS encapsulation
	if ( this.parentFragment.cssIds ) {
		this.node.setAttribute( 'data-ractive-css', this.parentFragment.cssIds.map( x => `{${x}}` ).join( ' ' ) );
	}

	// Add _ractive property to the node - we use this object to store stuff
	// related to proxy events, two-way bindings etc
	defineProperty( this.node, '_ractive', {
		value: {
			proxy: this,
			keypath: getInnerContext( this.parentFragment ),
			events: create( null ),
			root: root
		}
	});

	// Render attributes
	this.attributes.forEach( a => a.render( node ) );
	this.conditionalAttributes.forEach( a => a.render( node ) );

	// Render children
	if ( this.fragment ) {
		// Special case - <script> element
		if ( this.name === 'script' ) {
			this.bubble = updateScript;
			this.node.text = this.fragment.toString( false ); // bypass warning initially
			this.fragment.unrender = noop; // TODO this is a kludge
		}

		// Special case - <style> element
		else if ( this.name === 'style' ) {
			this.bubble = updateCss;
			this.bubble();
			this.fragment.unrender = noop;
		}

		// Special case - contenteditable
		else if ( this.binding && this.getAttribute( 'contenteditable' ) ) {
			this.fragment.unrender = noop;
		}

		else {
			this.node.appendChild( this.fragment.render() );
		}
	}

	// Add proxy event handlers
	if ( this.eventHandlers ) {
		this.eventHandlers.forEach( h => h.render() );
	}

	// deal with two-way bindings
	if ( this.binding ) {
		this.binding.render();
		this.node._ractive.binding = this.binding;
	}

	if ( this.name === 'option' ) {
		processOption( this );
	}

	// Special cases
	if ( this.name === 'img' ) {
		// if this is an <img>, and we're in a crap browser, we may
		// need to prevent it from overriding width and height when
		// it loads the src
		renderImage( this );
	} else if ( this.name === 'form' ) {
		// forms need to keep track of their bindings, in case of reset
		renderForm( this );
	} else if ( this.name === 'input' || this.name === 'textarea' ) {
		// inputs and textareas should store their initial value as
		// `defaultValue` in case of reset
		this.node.defaultValue = this.node.value;
	} else if ( this.name === 'option' ) {
		// similarly for option nodes
		this.node.defaultSelected = this.node.selected;
	}

	// apply decorator(s)
	if ( this.decorator && this.decorator.fn ) {
		runloop.scheduleTask( () => {
			if ( !this.decorator.torndown ) {
				this.decorator.init();
			}
		}, true );
	}

	// trigger intro transition
	if ( root.transitionsEnabled && this.intro ) {
		transition = new Transition ( this, this.intro, true );
		runloop.registerTransition( transition );
		runloop.scheduleTask( () => transition.start(), true );

		this.transition = transition;
	}

	if ( this.node.autofocus ) {
		// Special case. Some browsers (*cough* Firefix *cough*) have a problem
		// with dynamically-generated elements having autofocus, and they won't
		// allow you to programmatically focus the element until it's in the DOM
		runloop.scheduleTask( () => this.node.focus(), true );
	}

	updateLiveQueries( this );
	return this.node;
}

function getNamespace ( element ) {
	var namespace, xmlns, parent;

	// Use specified namespace...
	if ( xmlns = element.getAttribute( 'xmlns' ) ) {
		namespace = xmlns;
	}

	// ...or SVG namespace, if this is an <svg> element
	else if ( element.name === 'svg' ) {
		namespace = namespaces.svg;
	}

	else if ( parent = element.parent ) {
		// ...or HTML, if the parent is a <foreignObject>
		if ( parent.name === 'foreignObject' ) {
			namespace = namespaces.html;
		}

		// ...or inherit from the parent node
		else {
			namespace = parent.node.namespaceURI;
		}
	}

	else {
		namespace = element.root.el.namespaceURI;
	}

	return namespace;
}

function processOption ( option ) {
	var optionValue, selectValue, i;

	if ( !option.select ) {
		return;
	}

	selectValue = option.select.getAttribute( 'value' );
	if ( selectValue === undefined ) {
		return;
	}

	optionValue = option.getAttribute( 'value' );

	if ( option.select.node.multiple && isArray( selectValue ) ) {
		i = selectValue.length;
		while ( i-- ) {
			if ( optionValue == selectValue[i] ) {
				option.node.selected = true;
				break;
			}
		}
	} else {
		option.node.selected = ( optionValue == selectValue );
	}
}

function updateLiveQueries ( element ) {
	var instance, liveQueries, i, selector, query;

	// Does this need to be added to any live queries?
	instance = element.root;

	do {
		liveQueries = instance._liveQueries;

		i = liveQueries.length;
		while ( i-- ) {
			selector = liveQueries[i];
			query = liveQueries[ '_' + selector ];

			if ( query._test( element ) ) {
				// keep register of applicable selectors, for when we teardown
				( element.liveQueries || ( element.liveQueries = [] ) ).push( query );
			}
		}
	} while ( instance = instance.parent );
}
