// Create a generic accept() for a composite to support visitors
// without requiring code to support leaves and minimal code to
// support composites.

// Useful exports:
// export function deriviation(klass)
//   Provides an array with all the classes to the initial class ordered
//   from most concrete to most derived.
// export class_for(obj)
//   Provides the class ("constructor" technically) for an object. This
//   just wraps the obj.constructor but it provides the means to add any
//   later intelligence needed without searching the code for where it's
//   used for this purpose.
// export function generic_accept(obj, visitor, nested_raw)
//   The accept() function in the composite pattern's root and any
//   composite (a derived class that holds refrences to other classes in
//   the family) place this into the accept() call at the composite in
//   order to trivialize the implementation of ALL visitors and the accept()
//   code itself.

// See the sample sample.js for usage and visitors.

// Observations that provide the foundation for the code below:

// class A{}
// const a = new A();
// a.constructor === A
// class B extends A {}
// const b = new B();
// Object.getPrototypeOf(B) === A
// a.constructor.name === 'A'

// Every base-most class has THIS as its prototype (all root classes share
// the same prototype).
const RootForDerivation = (() => {
    class Marker {}
    return Object.getPrototypeOf(Marker);
})();

// This function provides an array of the inheritance hierarchy from the
// provided class to the base, in order. So the following hierarchy:
//   class A{}
//   class B extends A{}
//   class C extends B{}
// derivation(C) --> [C, B, A]
//
// NOTE: the objects are technically the constructors!
//
export function derivation(klass) {

    const derivedFrom = Object.getPrototypeOf(klass);

    // if it's the base, end the recursion
    if(derivedFrom === RootForDerivation) {
        return [klass];
    }

    // it's not the base
    return [klass, ...derivation(derivedFrom)];
}

// This returns the constructor (allows a place to log or extend if needed)
export function class_for(obj) {
    return obj.constructor
}


// Generic Visitor Facility
//
// ***** NOTE *****
//
//     THIS ONLY WORKS FOR TREES AND DOES NOT HANDLE CYCLES
//
// Guidelines for composite pattern:
//   1. Once a composite, all derived children MUST ALSO be composite
//   2. Leaves can have comopsites derived from them
//   3. Leaves should NOT implement accept() at all!
//
// Each visitor may implement (but not MUST implement) a handler for either
// (or each) of:
//    enter_Classname(object_of_Classname)
//    visit_Classname(object_of_Classname)
//    exit_Classname(object_of_Classname)
//
// This is how a call for a LEAF of a two-level object would look:
//    enter_BaseClassname(object)
//    visit_BaseClassname(object)
//         enter_Classname(object)
//         visit_Classname(object)
//         exit_Classname(object)
//    exit_BaseClassname(object)
//
// The pattern continues through all levels of inheritance.
//
// Composites for a single level look like this:
//    enter_CompositeClassname(compositeObject, null)
//    visit_CompositeClassname(compositeObject, null)
//      enter_CompositeClassname(compositeObject, intention)
//       enter_ContainedObject1ClassName(contained_object_1)
//       visit_ContainedObject1ClassName(contained_object_1)
//       exit_ContainedObject1ClassName(contained_object_1)
//      exit_CompositeClassname(compositeObject, intention)
//    exit_CompositeClassname(compositeObject, null)
//
// NOTE: if the visitor ignores the enter/exit composite's null/intention
//       marker it will have the effect of entering the composite twice.
//       It will also exit twice, so the effect won't be catastrophic but
//       it is NOT smart.
//
//       Base classes will also have the intention passed in for composite.

// obj is the "thing" with the accept (the composite pattern entry,
//     composite or leaf)
// visitor is the visitor passed.
// nested is an array of {intention:<whatever>, vals:iterator} for
//     composite (non-leaf) entries
export function generic_accept(obj, visitor, nested_raw=[]) {
    // NOTE: this is NOT efficient. Caching could be added and annotation
    //       on the visitor itself to support the cache as a "static"
    //       on the base visitor would be very useful, but this is ALWAYS
    //       safe.

    function find_method(klass, name) {
        const found = visitor[`${name}_${klass.name}`];
        return found ? found : () => {};
    }

    function apply_path(path, names, intention=null) {
        path.forEach( (klass) => {
            for(const name of Array.isArray(names) ? names : [names]) {
                find_method(klass, name).call(visitor, obj, intention);
            }});
    }
    
    // Call enter/visit for each of the classes (passing null in case
    // this happens to be a composite for the initial pass)
    const class_path = derivation(class_for(obj));
    const reversed_class_path = [... class_path].reverse();
    const nested = Array.isArray(nested_raw) ? nested_raw : [nested_raw];


    // The 'mainline' version (passes a null as second arg)
    apply_path(reversed_class_path, ['enter', 'visit']);

    // if there are nested, do the entry for them
    nested.forEach( ({intention, vals}) => {

        // The entry header
        apply_path(reversed_class_path, 'enter', intention);

        // Each value
        vals.forEach(nested_object => nested_object.accept(visitor));

        // Exit footers
        apply_path(class_path, 'exit', intention);
    });

    // Exit for the mainline
    apply_path(class_path, 'exit');

    // Done!
    return visitor;
}
