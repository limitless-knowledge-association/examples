// This shows how to simulate a condition variable so the effect of wait
// and notify can be done to allow asynchronous blockers without needing
// timers or immediate launching.

// This blocks until a value is passed to notify. The value is then returned
// to ALL that wait on it.
class BlockingWait {
    constructor() {
        this.resolve = null;
        this.promise = null;
    }

    async wait(tracker) {

        // If there's no promise to wait on, then create one.
        if(this.promise === null) {
            this._makePromise();
        }

        // This waits until notify by using await, which lets the caller
        // continue on (yields at the await).
        console.log(`wait awaiting notify with tracker="${tracker}"`);
        const value = await this.promise;

        // Something triggered notify and woke this back up. Now whatever
        // was waiting on THIS may continue as well.
        console.log(`Tracker "${tracker}" awoken with value:`, value);

        // The value is the value provided by notify.
        return value;
    }

    notify(value = null) {
        if(this.resolve !== null) {
            const resolve = this.resolve;
            this.promise = null;
            this.resolve = null;

            // This does the exactly-once resolve returning the given value
            // to ALL that have called wait().
            resolve(value);
        } 
    }

    // This does the mechanics of setting up the promise. It stores the
    // resolve since the function will be called OUTSIDE the body of the
    // promise's function.
    _makePromise() {
        this.promise = new Promise( (resolve) => {
            this.resolve = resolve;
        });
    }
}

const blocker = new BlockingWait();

function launch_workers(blocker) {


    waiting_worker(blocker, "Worker 1");
    waiting_worker(blocker, "Worker 2");
    waiting_worker(blocker, "Worker 3");
    
}
async function waiting_worker(block, name) {
    console.log(`${name} does some init work before blocking`);
    const woke_value = await block.wait(name);
    console.log(`${name} uses ${woke_value} to finish work`);
}

console.log("Launching workers...");
launch_workers(blocker);
console.log("Workers launched...triggering notify with 100");
blocker.notify(100);
console.log("Making another worker...After-1");
waiting_worker(blocker, "After-1");
console.log("Notify of 200");
blocker.notify(200);
