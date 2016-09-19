"use strict";
const BufferShift = require("buffershift");

const MAX5 = (1 << 5) - 1;

const decodeForm = (buf) => {
    const prefixLen = buf[buf.length - 1] & MAX5;
    BufferShift.shr(buf, 5);
    const bitCount = buf[buf.length - 1] & MAX5;
    if (bitCount < 1) {
        return;
    }
    BufferShift.shr(buf, 5);
    const prefix = new Buffer((prefixLen >> 3) + !!(prefixLen & 7));
    for (let i = 1; i <= prefix.length; i++) {
        prefix[prefix.length - i] = buf[buf.length - i];
    }
    if (prefixLen & 7) {
        prefix[0] &= (1 << (prefixLen & 7)) - 1;
    }
    BufferShift.shr(buf, prefixLen);
    return {
        bitCount: bitCount,
        prefix: prefix.toString('hex'),
        prefixLen: prefixLen
    };
};

const getReversed = (input) => {
    const bytes = new Buffer(input.length);
    for (let i = 0; i < input.length; i++) {
        bytes[bytes.length - i - 1] = input[i];
    }
    return bytes;
};

const parse = module.exports.parse = (input) => {
    const bytes = getReversed(input);
    const out = [];
    for (;;) {
        const form = decodeForm(bytes);
        if (!form) {
            if (bytes.toString('hex').replace(/0/g, '') !== '') {
                throw new Error("invalid encoding");
            }
            return out;
        }
        out.push(form);
    }
};

const encodeForm = (buf, form) => {
    BufferShift.shl(buf, form.prefixLen);
    for (let i = 1; i <= form.prefix.length; i++) {
        buf[buf.length - i] ^= form.prefix[form.prefix.length - i];
    }
    BufferShift.shl(buf, 5);
    buf[buf.length - 1] ^= form.bitCount;
    BufferShift.shl(buf, 5);
    buf[buf.length - 1] ^= form.prefixLen;
};

const serialize = module.exports.serialize = (scheme) => {
    let bitsNeeded = 0;
    scheme.forEach((form) => { bitsNeeded += form.prefixLen + 5 + 5; });
    const buf = new Buffer((bitsNeeded >> 3) + (!!(bitsNeeded & 7))).fill(0);
    for (let i = scheme.length - 1; i >= 0; i--) { encodeForm(buf, scheme[i]); }
    return getReversed(buf);
};

const formSize = module.exports.formSize = (form) => {
    return form.bitCount + form.prefixLen;
};

const isSane = module.exports.isSane = (scheme) => {
    // Check for obviously insane encoding.
    if (scheme.length === 0) {
        // No encoding schemes
        return { sane: false, reason: "no forms" };
    }

    if (scheme.length > 31) {
        // impossible, each form must have a different bitCount and bitCount
        // can only be expressed in 5 bits limiting it to 31 bits max and a form
        // using zero bits is not allowed so there are only 31 max possibilities.
        return { sane: false, reason: "too many forms" };
    }

    if (scheme.length === 1) {
        // Fixed width encoding, prefix is not allowed and bitcount must be non-zero
        if (scheme[0].prefixLen !== 0 || scheme[0].prefix !== 0) {
            return { sane: false, reason: "fixed width encoding prefixLen must be 0" };
        }
        if (scheme[0].bitCount === 0 || scheme[0].bitCount > 31) {
            return {
                sane: false,
                reason: "bitcount must be non-zero and can't overflow the number"
            };
        }
        return true;
    }

    // Variable width encoding.
    for (let i = 0; i < scheme.length; i++) {
        const form = scheme[i];

        if (form.prefixLen === 0 || form.prefixLen > 31) {
            return {
                sane: false,
                reason: "Prefix must exist in order to distinguish between forms"
            };
        }
        if (form.bitCount === 0 || form.bitCount > 31) {
            return { sane: false, reason: "Bitcount must be non-zero and < 32" };
        }
        if (formSize(form) > 59) {
            return { sane: false, reason: "cannot be represented in the usable space in a label" };
        }
        if (i > 0 && form.bitCount <= scheme[i-1].bitCount) {
            return { sane: false, reason: "Forms must be in ascending order" };
        }
        for (let j = 0; j < scheme.length; j++) {
            if (j !== i) {
                const formj = scheme[j];
                const a = new Array(8 - formj.prefix.length).fill(0).join('') + formj.prefix;
                const b = new Array(8 - form.prefix.length).fill(0).join('') + form.prefix;
                const aBuf = new Buffer(a, 'hex');
                const bBuf = new Buffer(b, 'hex');
                BufferShift.shl(aBuf, 64 - form.prefixLen);
                BufferShift.shl(bBuf, 64 - form.prefixLen);
                if (aBuf.equals(bBuf)) {
                    return {
                        sane: false,
                        reason: "Forms must be distinguishable by their prefixes"
                    };
                }
            }
        }
    }

    return { sane: true, reason: "none" };
};
