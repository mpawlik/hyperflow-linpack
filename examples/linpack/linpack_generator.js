var argv = require('optimist').argv;

Number.prototype.pad = function (size) {
    var s = String(this);
    while (s.length < (size || 2)) {
        s = "0" + s;
    }
    return s;
};

// create task object
function task(name, functionName, executable, args, ins, outs) {
    return {
        "name": name,
        "function": functionName,
        "type": "dataflow",
        "firingLimit": 1,
        "config": {
            "executor": {
                "executable": executable,
                "args": args
            }
        },
        "ins": ins,
        "outs": outs
    }
}

function createWf(functionName, procs, memsize) {

    var wfOut = {
        processes: [],
        signals: [],
        ins: ["start"],
        outs: ["end"]
    };

    var local_outs = [];

    for (i = 0; i < procs; i++) {
        local_outs.push(i);
        wfOut.processes.push(
            //AWS
            task("linpack" + (i).pad(2), functionName, "./xlinpack_xeon64", ["-i", "/var/task/lininput_" + memsize + ".txt"], ["start"], [i])
        );
    }

    wfOut.processes.push(
        task("exit", "exit", "", [""], local_outs, ["end"])
    );

    for (i = 0; i < procs; i++) {
        wfOut.signals.push({"name": i});
    }


    wfOut.signals.push({"name": "start"});
    wfOut.signals.push({"name": "end"});

    console.log(JSON.stringify(wfOut, null, 2));

}

if (!argv._[0]) {
    console.log("Usage: node linpack_generator.js function_name concurent_process_number mem_size");
    process.exit();
}

createWf(argv._[0], argv._[1], argv._[2]);
