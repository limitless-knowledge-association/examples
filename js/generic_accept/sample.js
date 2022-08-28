// Demonstrate the generic accept facility

import {class_for,
        generic_accept,
        provide_generic_visitor
       }from "./accept.js";

// Toy is a trivial composite. Box is its composite class that
// holds references to Toy, including other boxes and the leaves.

class Toy {
    constructor() {
    }

    describe() {
        throw Exception("Implement describe()");
    }

    accept(visitor) {
        return generic_accept(this, visitor);
    }
}

class Box extends Toy {
    constructor(toys) {
        super();
        this.toys = [...toys];
    }

    describe() {
        return `Box holds ${this.toys.length} items:`;
    }

    accept(visitor) {
        return generic_accept(this, visitor,
                              {intention:'content',
                               vals:this.toys});
    }
}

class SpecialBox extends Box {
    constructor(toys){
        super(toys);
    }
}

class Book extends Toy {
    constructor(title) {
        super();
        this.title = title;
    }

    describe() {
        return `A book named ${this.title}`;
    }
}

class ArtBook extends Book {
    constructor(title, domain) {
        super(title);
        this.domain = domain;
    }

    describe() {
        return `An art book from "${this.domain}" named ${this.title}`;
    }
}

class Ball extends Toy {
    constructor(size, color) {
        super();
        this.size = size;
        this.color = color;
    }

    describe() {
        return `A ${this.size} ${this.color} ball`;
    }
}

class Doll extends Toy {
    constructor(size, desc) {
        super();
        this.size = size;
        this.desc = desc;
    }

    describe() {
        return `A ${this.size} doll that has ${this.desc}`;
    }
}

// Sample data
const stuff = new Box([
    new Book("Lord of the Rings"),
    new Book("Design Patterns"),
    new SpecialBox([
        new Ball("small", "red"),
        new Ball("small", "green"),
        new Doll("large", "green hair and a blue shirt"),
        new ArtBook("The Art of How to Train Your Dragon",
                    "How to Train Your Dragon")
    ]),
]);

// Generic visitor
console.log("*** GENERIC VISITOR ***");
stuff.accept(provide_generic_visitor());

// Show each toy
class Visitor_1 {
    visit_Toy(toy) { console.log(toy.describe()); }
}
console.log("*** EACH TOY (Visitor_1)");
stuff.accept(new Visitor_1());

// List just books
class BookLister {
    visit_Book(book) {console.log(book.describe()); }
};
console.log("*** EACH BOOK (BookLister)");
stuff.accept(new BookLister());

// This demo shows how nested containers can be processed, and paying
// attention to composite null intention -- entering the raw composite --
// and the "per intention" entry/exit.
// Also, it shows why intention reaches all the way down to base for the
// composite's intentions.
class NestingDemo {
    static spaces= "                                        ";
    
    constructor() {
        this.depth = 0;
    }

    _print(s) {
        const indent = this.depth > 0 ?
              NestingDemo.spaces.slice(0,2*this.depth) :
              "";
        console.log(`${indent}${s}`);
    }
    enter_Toy(toy, context) {
        this._print(`EnteredToy (${class_for(toy).name}) with context ${context}:${toy.describe()}`);
    }
    exit_Toy(toy, context) {
        this._print(`Exited toy with context ${context}:${toy.describe()}`);
    }
    enter_Box(box, context) {
        if(null !== context) {
            this._print(`Entering box of ${box.toys.length} items`)
            ++this.depth;
        }
    }
    exit_Box(box, context) {
        if(null !== context) {
            --this.depth;
            this._print(`Exiting box of ${box.toys.length} items`)
        }
    }
}
console.log("*** EACH THING ONLY FOR NESTING (NestingDemo)");
stuff.accept(new NestingDemo());
