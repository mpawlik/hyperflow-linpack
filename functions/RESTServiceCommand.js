var request = require('requestretry');
var executor_config = require('./RESTServiceCommand.config.js');
var identity = function(e) {return e};

function simpleRetryStrategy(err, response, body) {
    if (err || response.statusCode >= 300) {
        console.log("ERRPR", err, response !== undefined ? response.statusCode + response.message : "");
        return true;
    } else {
        return false;
    }
}

function RESTServiceCommand(ins, outs, config, cb) {

    var options = executor_config.options;
    if(config.executor.hasOwnProperty('options')) {
        var executorOptions = config.executor.options;
        for (var opt in executorOptions) {
            if(executorOptions.hasOwnProperty(opt)) {
                options[opt] = executorOptions[opt];
            }
        }
    }
    var executable = config.executor.executable;
    var jobMessage = {
        "executable": executable,
        "args":       config.executor.args,
        "env":        (config.executor.env || {}),
        "inputs":     ins.map(identity),
        "outputs":    outs.map(identity),
        "options":    options
    };

    var url = executor_config.service_url;

    console.log("Executing: " + JSON.stringify(jobMessage) + "@" + url);

    function requestCb(err, response, body) {
        var request_end = Date.now();
        if (err) {
            console.log("Function: " + executable + " error: " + err);
            cb(err, outs);
            return
        }
        if (response) {
             console.log("Function: " + executable + " response status code: " + response.statusCode + " number of request attempts: " + response.attempts)
        } else {
            console.log("No response!");
        }

        var request_duration = request_end - request_start;
        console.log("Function: " + executable + " data: " + body.toString());
        body['request_start'] = request_start;
        body['request_end'] = request_end;
        body['request_duration'] = request_duration;
        body['executor_url'] = url;
        body['args'] = config.executor.args;
        body['process_id'] = config.procId;
        body['firing_id'] = config.firingId;
        console.log("#DATA:" + JSON.stringify(body));
        cb(null, outs);
    }

    let req_timeout = 20 * 60 * 1000;
    var request_start = Date.now();

    var req = request.post(
        //todo add explicite retryDelay
        {
            timeout: req_timeout,
            url: url,
            json: jobMessage,
            headers: {'Content-Type': 'application/json', 'Accept': '*/*'},
            maxAttempts: 100,
            retryDelay: 5000,
            // retryStrategy: simpleRetryStrategy
        },
        requestCb
    );


}


exports.RESTServiceCommand = RESTServiceCommand;
