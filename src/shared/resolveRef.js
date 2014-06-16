import normaliseKeypath from 'utils/normaliseKeypath';
import hasOwnProperty from 'utils/hasOwnProperty';
import getInnerContext from 'shared/getInnerContext';
import createComponentBinding from 'shared/createComponentBinding';

var ancestorErrorMessage, getOptions;

ancestorErrorMessage = 'Could not resolve reference - too many "../" prefixes';

getOptions = { evaluateWrapped: true };

export default function resolveRef ( ractive, ref, fragment ) {
	var context, key, index, keypath, parentValue, hasContextChain;

	ref = normaliseKeypath( ref );

	// If a reference begins with '.', it's either a restricted reference or
	// an ancestor reference...
	if ( ref.charAt( 0 ) === '.' ) {
		return resolveAncestorReference( getInnerContext( fragment ), ref );
	}

	// ...otherwise we need to find the keypath
	key = ref.split( '.' )[0];

	do {
		context = fragment.context;

		if ( !context ) {
			continue;
		}

		hasContextChain = true;
		parentValue = ractive.viewmodel.get( context, getOptions );

		if ( parentValue && ( typeof parentValue === 'object' || typeof parentValue === 'function' ) && key in parentValue ) {
			return context + '.' + ref;
		}
	} while ( fragment = fragment.parent );

	// Root property?
	if ( hasOwnProperty.call( ractive.data, key ) ) {
		return ref;
	}

	// If this is an inline component, and it's not isolated, we
	// can try going up the scope chain
	if ( ractive._parent && !ractive.isolated ) {
		fragment = ractive.component.parentFragment;

		// Special case - index refs
		if ( fragment.indexRefs && ( index = fragment.indexRefs[ ref ] ) !== undefined ) {
			// create an index ref binding, so that it can be rebound letter if necessary
			ractive.component.indexRefBindings[ keypath ] = keypath;
			ractive.viewmodel.set( ref, index, true );
			return;
		}

		keypath = resolveRef( ractive._parent, ref, fragment );

		if ( keypath ) {
			// Need to create an inter-component binding
			ractive.viewmodel.set( ref, ractive._parent.viewmodel.get( keypath ), true );
			createComponentBinding( ractive.component, ractive._parent, keypath, ref );
		}
	}

	// If there's no context chain, and the instance is either a) isolated or
	// b) an orphan, then we know that the keypath is identical to the reference
	if ( !hasContextChain ) {
		return ref;
	}

	if ( ractive.viewmodel.get( ref ) !== undefined ) {
		return ref;
	}
}

function resolveAncestorReference ( baseContext, ref ) {
	var contextKeys;

	// {{.}} means 'current context'
	if ( ref === '.' ) return baseContext;

	contextKeys = baseContext ? baseContext.split( '.' ) : [];

	// ancestor references (starting "../") go up the tree
	if ( ref.substr( 0, 3 ) === '../' ) {
		while ( ref.substr( 0, 3 ) === '../' ) {
			if ( !contextKeys.length ) {
				throw new Error( ancestorErrorMessage );
			}

			contextKeys.pop();
			ref = ref.substring( 3 );
		}

		contextKeys.push( ref );
		return contextKeys.join( '.' );
	}

	// not an ancestor reference - must be a restricted reference (prepended with "." or "./")
	if ( !baseContext ) {
		return ref.replace( /^\.\/?/, '' );
	}

	return baseContext + ref.replace( /^\.\//, '.' );
}
