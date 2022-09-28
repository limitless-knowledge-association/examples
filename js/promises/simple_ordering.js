// This shows the ordering between a synchronous function using then()
// and an async function using await.

// Pay attention to the scope of the launch_next and launch_await as
// they finish.

// The launch_next function finishes BEFORE the then() calls the lambda
// to process the work.

// The launch_await function YIELDS and does NOT finish until the await
// has been fulfilled.

// CRUCIAL ISSUE: the launch_await does NOT block the caller, so the two
// calls to launch_await are both started (but unfinished) until the
// later cycle allows the awaiting assignment to complete and the
// launch_await functions "resume" after the await.

function create(value) {
    console.log("Making promise");
    return new Promise( (resolve) => {
        console.log(`Promise body starts with value = ${value}`);
        resolve(value);
        console.log(`Resolve of value=${value} done`);
    });
}

function launch_next(value) {
    console.log(`Entering launch_next with value=${value}`);
    const prom = create(value);
    prom.then( (v) => {console.log(`then() given value v=${v}`); });
    console.log(`Exiting launch_next value=${value}`);
}

async function launch_await(value) {
    console.log(`Entering launch_await with value=${value}`);
    const v = await create(value);
    console.log(`Exiting launch_await with READ v=${v}`);
}

async function launch_await_sync(value) {
    function inner() {
        return value;
    }
    
    console.log(`Entering launch_await_sync with value=${value}`);
    const v = await inner();
    console.log(`Exiting launch_await_sync with READ v=${v}`);
}

launch_next(123);
launch_next(234);
launch_await(321);
launch_await(432);
launch_await_sync("c1");
launch_await_sync("c2");
