# Cjdnsencode
Parser and serializer for cjdns encoding schemes

[![Build Status](https://travis-ci.org/cjdelisle/cjdnsencode.svg?branch=master)](https://travis-ci.org/cjdelisle/cjdnsencode)

Encoding schemes are the way that the engine explains to other nodes how it parses labels.
Encoding schemes are represented as lists of encoding *forms*, an encoding form is a a packed
array of bits comprising of a pair of 5 bit numbers followed by a number of bits which is defined
by one of the numbers. Forms are packed together tightly in order to save bandwidth when
transferring encoding schemes across the wire.

## Cjdnsencode.parse(buffer)
Parse an encoding scheme representation into a js array.

```javascript
> Cjdnsencode.parse(new Buffer('810c08', 'hex'))
[ { prefixLen: 1, bitCount: 4, prefix: '01' },
  { prefixLen: 1, bitCount: 8, prefix: '00' } ]
```

## Cjdnsencode.serialize(scheme)
Serialize an encoding scheme representation back into a tightly packed Buffer.

```javascript
> Cjdnsencode.serialize([ { prefixLen: 1, bitCount: 4, prefix: "01" }, { prefixLen: 1, bitCount: 8, prefix: "00" }, ])
<Buffer 81 0c 08>
```

## Cjdnsencode.formSize(scheme[0])
As a scheme is represented as an array of *forms*, this function will tell you how many bits of
label space is occupied by a representation of a given form.

```javascript
> Cjdnsencode.formSize({ prefixLen: 1, bitCount: 8, prefix: "00" })
9
```

## Cjdnsencode.isSane(scheme)
Returns an object containing sane: <true|false> and reason (a string telling why the scheme is not
is valid if sane = false).

```javascript
> Cjdnsencode.isSane([])
{ sane: false, reason: 'no forms' }
```

## Node Version
Tested on 4.2.1, 4.5.0 and 6.6.0

## License

GPLv3+
