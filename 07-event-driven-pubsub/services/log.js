// Tiny log helper: timestamp first so run.sh can merge the logs of several nodes in order.
module.exports.log = (svc, msg) => console.log(`${new Date().toISOString()} [${svc.broker.nodeID}] ${msg}`);
