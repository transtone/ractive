module( 'Magic mode' );

var fixture2, makeObj;

// only run these tests if magic mode is supported
try {
	var obj = {}, _foo;
	Object.defineProperty( obj, 'foo', {
		get: function () {
			return _foo;
		},
		set: function ( value ) {
			_foo = value;
		}
	});

	fixture2 = document.createElement( 'div' );

	var MagicRactive = Ractive.extend({
		template: '{{name}}: {{type}}',
		magic: true
	});

	makeObj = function () {
		return {
			name: 'Kermit',
			type: 'frog'
		};
	};

	test( 'Mustaches update when property values change', function ( t ) {
		var muppet, ractive;

		muppet = makeObj();

		ractive = new MagicRactive({
			el: fixture,
			data: muppet
		});

		muppet.name = 'Rizzo';
		muppet.type = 'rat';

		t.htmlEqual( fixture.innerHTML, 'Rizzo: rat' );

		muppet.name = 'Fozzie';
		muppet.type = 'bear';

		t.htmlEqual( fixture.innerHTML, 'Fozzie: bear' );
	});

	test( 'Multiple instances can share an object', function ( t ) {
		var muppet, ractive1, ractive2;

		muppet = makeObj();

		ractive1 = new MagicRactive({
			el: fixture,
			data: muppet
		});

		ractive2 = new MagicRactive({
			el: fixture2,
			data: muppet
		});

		muppet.name = 'Rizzo';
		muppet.type = 'rat';

		t.htmlEqual( fixture.innerHTML, 'Rizzo: rat' );
		t.htmlEqual( fixture2.innerHTML, 'Rizzo: rat' );

		muppet.name = 'Fozzie';
		muppet.type = 'bear';

		t.htmlEqual( fixture.innerHTML, 'Fozzie: bear' );
		t.htmlEqual( fixture2.innerHTML, 'Fozzie: bear' );
	});

	test( 'Direct property access can be used interchangeably with ractive.set()', function ( t ) {
		var muppet, ractive1, ractive2;

		muppet = makeObj();

		ractive1 = new MagicRactive({
			el: fixture,
			data: muppet
		});

		ractive2 = new MagicRactive({
			el: fixture2,
			data: muppet
		});

		muppet.name = 'Rizzo';
		muppet.type = 'rat';

		t.htmlEqual( fixture.innerHTML, 'Rizzo: rat' );
		t.htmlEqual( fixture2.innerHTML, 'Rizzo: rat' );

		ractive1.set({
			name: 'Fozzie',
			type: 'bear'
		});

		t.htmlEqual( fixture.innerHTML, 'Fozzie: bear' );
		t.htmlEqual( fixture2.innerHTML, 'Fozzie: bear' );

		ractive2.set({
			name: 'Miss Piggy',
			type: 'pig'
		});

		t.htmlEqual( fixture.innerHTML, 'Miss Piggy: pig' );
		t.htmlEqual( fixture2.innerHTML, 'Miss Piggy: pig' );

		muppet.name = 'Pepe';
		muppet.type = 'king prawn';

		t.htmlEqual( fixture.innerHTML, 'Pepe: king prawn' );
		t.htmlEqual( fixture2.innerHTML, 'Pepe: king prawn' );
	});

	test( 'Magic mode works with existing accessors', function ( t ) {
		var _foo, data, ractive;

		_foo = 'Bar';

		data = {};

		Object.defineProperty( data, 'foo', {
			get: function () {
				return _foo.toLowerCase();
			},
			set: function ( value ) {
				_foo = value;
			},
			configurable: true,
			enumerable: true
		});

		ractive = new MagicRactive({
			el: fixture,
			template: '{{foo}}',
			data: data
		});

		t.htmlEqual( fixture.innerHTML, 'bar' );

		data.foo = 'BAZ';
		t.htmlEqual( fixture.innerHTML, 'baz' );
	});

	test( 'Setting properties in magic mode triggers change events', function ( t ) {
		var ractive, foo;

		foo = { bar: 'baz' };

		ractive = new MagicRactive({
			el: fixture,
			template: '{{foo.bar}}',
			data: { foo: foo }
		});

		expect( 1 );

		ractive.on( 'change', function ( changeHash ) {
			t.deepEqual( changeHash, { 'foo.bar': 'qux' });
		});

		foo.bar = 'qux';
	});

	test( 'A magic component is magic regardless of whether its parent is magic', function ( t ) {
		var data, Magician, ractive;

		expect( 3 );

		data = {
			magician: 'Harry Houdini'
		};

		Magician = MagicRactive.extend({
			template: '<p>{{magician}}</p>',
			magic: true,
			data: data,
			changeMagician: function () {
				this.viewmodel.data.magician = 'David Copperfield';
			},
			oninit: function () {
				t.ok( this.magic );
			}
		});

		window.Magician = Magician;

		ractive = new MagicRactive({
			el: fixture,
			magic: false,
			template: '<magician/>',
			components: { magician: Magician }
		});

		t.htmlEqual( fixture.innerHTML, '<p>Harry Houdini</p>' );
		ractive.findComponent( 'magician' ).changeMagician();
		t.htmlEqual( fixture.innerHTML, '<p>David Copperfield</p>' );
	});

	test( "Magic adapters shouldn't tear themselves down while resetting (#1342)", t => {
		let list = 'abcde'.split('');
		let ractive = new MagicRactive({
			el: fixture,
			template: '{{#list}}{{.}}{{/}}',
			data: { list: list },
			magic: true
		});

		t.htmlEqual( fixture.innerHTML, 'abcde' );
		// if the wrapper causes itself to be recreated, this is where it happens
		// during reset
		list.pop();
		t.htmlEqual( fixture.innerHTML, 'abcd' );
		// since the wrapper now has two magic adapters, two fragments get popped
		list.pop();
		t.htmlEqual( fixture.innerHTML, 'abc' );
	});
} catch ( err ) {
	// don't run these tests
}
