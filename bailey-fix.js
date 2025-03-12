"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LT_HASH_ANTI_TAMPERING = void 0;
const crypto_1 = require("./crypto");

/**
 * LT Hash adalah algoritma hash berbasis penjumlahan yang menjaga integritas data
 * melalui serangkaian mutasi.
 */
const o = 128;

// Helper function to convert data to ArrayBuffer
async function toArrayBuffer(data) {
    if (!data) {
        throw new TypeError("Data cannot be null or undefined");
    }

    // Jika data adalah Promise, tunggu hingga selesai
    if (data instanceof Promise) {
        data = await data;
    }

    if (data instanceof ArrayBuffer) {
        return data;
    }

    if (data instanceof Uint8Array) {
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }

    if (Buffer.isBuffer(data)) {
        return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }

    console.error("Invalid data type received:", typeof data, data);
    throw new TypeError(`Invalid data type for DataView: ${typeof data}`);
}

class d {
    constructor(e) {
        this.salt = e;
    }

    async add(e, t) {
        var r = this;
        for (const item of t) {
            e = await r._addSingle(e, item);
        }
        return e;
    }

    async subtract(e, t) {
        var r = this;
        for (const item of t) {
            e = await r._subtractSingle(e, item);
        }
        return e;
    }

    async subtractThenAdd(e, t, r) {
        var n = this;
        return n.add(await n.subtract(e, r), t);
    }

    async _addSingle(e, t) {
        var r = this;
        const n = new Uint8Array(await toArrayBuffer((0, crypto_1.hkdf)(Buffer.from(t), o, { info: r.salt }))).buffer;
        return r.performPointwiseWithOverflow(await e, n, ((e, t) => e + t));
    }

    async _subtractSingle(e, t) {
        var r = this;
        const n = new Uint8Array(await toArrayBuffer((0, crypto_1.hkdf)(Buffer.from(t), o, { info: r.salt }))).buffer;
        return r.performPointwiseWithOverflow(await e, n, ((e, t) => e - t));
    }

    async performPointwiseWithOverflow(e, t, r) {
        const n = new DataView(await toArrayBuffer(e));
        const i = new DataView(await toArrayBuffer(t));
        const a = new ArrayBuffer(n.byteLength);
        const s = new DataView(a);

        for (let e = 0; e < n.byteLength; e += 2) {
            s.setUint16(e, r(n.getUint16(e, !0), i.getUint16(e, !0)), !0);
        }
        return a;
    }
}

exports.LT_HASH_ANTI_TAMPERING = new d('WhatsApp Patch Integrity');
