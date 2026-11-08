const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { tests } = require('@iobroker/testing');

const INSTANCE_ID = 'system.adapter.openweathermap.0';
const PLAIN_KEY = '0123456789abcdef0123456789abcdef';

/** Decrypts like the controller does. `harness.getAdapterConfig()` knows only the old XOR encoding */
function decrypt(secret, value) {
    const [, iv, data] = value.split(':');
    const decipher = crypto.createDecipheriv('aes-192-cbc', Buffer.from(secret, 'hex'), Buffer.from(iv, 'hex'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString();
}

async function waitFor(check, timeout) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
        const result = await check();
        if (result) {
            return result;
        }
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    throw new Error(`Condition was not met in ${timeout} ms`);
}

// Run integration tests - See https://github.com/ioBroker/testing for a detailed explanation and further options
tests.integration(path.join(__dirname, '..'), {
    allowedExitCodes: [11],
    defineAdditionalTests({ suite }) {
        suite('Encrypted API key', getHarness => {
            it('encrypts a key stored as plain text by an old version and leaves it alone after that', async function () {
                this.timeout(60000);
                const harness = getHarness();

                // what an upgraded instance looks like: `encryptedNative` is set, but the value is still plain
                const obj = await harness.objects.getObject(INSTANCE_ID);
                assert.ok(obj.encryptedNative.includes('apikey'));
                obj.native.apikey = PLAIN_KEY;
                await harness.objects.setObject(INSTANCE_ID, obj);

                await harness.startAdapter();
                const migrated = await waitFor(async () => {
                    const current = await harness.objects.getObject(INSTANCE_ID);
                    return current.native.apikey !== PLAIN_KEY && current;
                }, 30000);

                assert.ok(migrated.native.apikey.startsWith('$/aes-192-cbc:'));
                const systemConfig = await harness.objects.getObject('system.config');
                assert.equal(decrypt(systemConfig.native.secret, migrated.native.apikey), PLAIN_KEY);
                await waitFor(() => !harness.isAdapterRunning(), 10000);

                // a second start must not encrypt it again
                await harness.startAdapter();
                await new Promise(resolve => setTimeout(resolve, 5000));
                const current = await harness.objects.getObject(INSTANCE_ID);
                assert.equal(current.native.apikey, migrated.native.apikey);
                await harness.stopAdapter();
            });
        });
    },
});
