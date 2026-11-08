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

function encrypt(secret, value) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-192-cbc', Buffer.from(secret, 'hex'), iv);
    const encrypted = Buffer.concat([cipher.update(value), cipher.final()]);
    return `$/aes-192-cbc:${iv.toString('hex')}:${encrypted.toString('hex')}`;
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
        // A harness can start the adapter only once, so every start needs its own suite
        suite('API key stored as plain text', getHarness => {
            it('is encrypted at the start and the instance terminates to restart', async function () {
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
                await waitFor(() => harness.didAdapterStop(), 10000);
            });
        });

        suite('API key stored encrypted', getHarness => {
            it('is not changed at the start', async function () {
                this.timeout(60000);
                const harness = getHarness();

                const systemConfig = await harness.objects.getObject('system.config');
                const encrypted = encrypt(systemConfig.native.secret, PLAIN_KEY);
                const obj = await harness.objects.getObject(INSTANCE_ID);
                obj.native.apikey = encrypted;
                // not a default schedule, or the adapter would rewrite it and terminate
                obj.common.schedule = '5 * * * *';
                await harness.objects.setObject(INSTANCE_ID, obj);

                await harness.startAdapterAndWait();
                await new Promise(resolve => setTimeout(resolve, 3000));

                assert.equal((await harness.objects.getObject(INSTANCE_ID)).native.apikey, encrypted);
                // With a short random start delay the adapter may have finished already, and then
                // stopAdapter() would wait forever for a process that is gone.
                if (!harness.didAdapterStop()) {
                    await harness.stopAdapter();
                }
            });
        });
    },
});
