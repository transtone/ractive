import { isArray } from 'utils/is';

export function arrayContains ( array, value ) {
	for ( let i = 0, c = array.length; i < c; i++ ) {
		if ( array[i] == value ) {
			return true;
		}
	}

    return false;
}

export function arrayContentsMatch ( a, b ) {
	var i;

	if ( !isArray( a ) || !isArray( b ) ) {
		return false;
	}

	if ( a.length !== b.length ) {
		return false;
	}

	i = a.length;
	while ( i-- ) {
		if ( a[i] !== b[i] ) {
			return false;
		}
	}

	return true;
}

export function removeFromArray ( array, member ) {
	var index = array.indexOf( member );

	if ( index !== -1 ) {
		array.splice( index, 1 );
	}
}