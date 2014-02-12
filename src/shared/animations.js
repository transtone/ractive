define([
	'utils/requestAnimationFrame',
	'utils/getTime'
], function (
	rAF,
	getTime
) {

	'use strict';

	var queue = [];

	var animations = {
		tick: function () {
			var i, animation, now;

			now = getTime();

			for ( i=0; i<queue.length; i+=1 ) {
				animation = queue[i];

				if ( !animation.tick( now ) ) {
					// animation is complete, remove it from the stack, and decrement i so we don't miss one
					queue.splice( i--, 1 );
				}
			}

			if ( queue.length ) {
				rAF( animations.tick );
			} else {
				animations.running = false;
			}
		},

		add: function ( animation ) {
			queue.push( animation );

			if ( !animations.running ) {
				animations.running = true;
				animations.tick();
			}
		},

		// TODO optimise this
		abort: function ( keypath, root ) {
			var i = queue.length, animation;

			while ( i-- ) {
				animation = queue[i];

				if ( animation.root === root && animation.keypath === keypath ) {
					animation.stop();
				}
			}
		}
	};

	return animations;

});