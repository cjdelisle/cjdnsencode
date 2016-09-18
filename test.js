'use strict';
const Cjdnsencode = require('./index');

const SCHEMES = [
    {
        name: "SCHEME_F4",
        obj: [ { prefixLen: 0, bitCount: 4, prefix: "" } ],
        hex: '8000'
    },
    {
        name: "SCHEME_F8",
        obj: [ { prefixLen: 0, bitCount: 8, prefix: "" } ],
        hex: '0001'
    },
    {
        name: "SCHEME_v48",
        obj: [
            { prefixLen: 1, bitCount: 4, prefix: "01" },
            { prefixLen: 1, bitCount: 8, prefix: "00" },
        ],
        hex: '810c08'
    },
    {
        name: "SCHEME_v358",
        obj: [
            { prefixLen: 1, bitCount: 3, prefix: "01" },
            { prefixLen: 2, bitCount: 5, prefix: "02" },
            { prefixLen: 2, bitCount: 8, prefix: "00" }
        ],
        hex: '6114458100'
    }
];

SCHEMES.forEach((scheme) => {
    const parsed = Cjdnsencode.parse(new Buffer(scheme.hex, 'hex'));
    if (JSON.stringify(parsed) !== JSON.stringify(scheme.obj)) { throw new Error(); }
    const serialized = Cjdnsencode.serialize(parsed);
    if (serialized.toString('hex') !== scheme.hex) { throw new Error(); }
    const isSane = Cjdnsencode.isSane(scheme);
    if (!isSane.sane) { throw new Error(isSane.reason); }
});
