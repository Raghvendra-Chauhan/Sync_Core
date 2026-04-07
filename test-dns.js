const dns = require('dns/promises');

async function test() {
    try {
        const srv1 = await dns.resolveSrv('_mongodb._tcp.cluster0.jayytfd.mongodb.net');
        console.log('Default DNS success:', srv1);
    } catch (e) {
        console.error('Default DNS error:', e.message);
    }

    try {
        const dnsCb = require('dns');
        dnsCb.setServers(['8.8.8.8', '8.8.4.4']);
        const srv2 = await dnsCb.promises.resolveSrv('_mongodb._tcp.cluster0.jayytfd.mongodb.net');
        console.log('Google DNS success:', srv2);
    } catch (e) {
        console.error('Google DNS error:', e.message);
    }
}

test();
