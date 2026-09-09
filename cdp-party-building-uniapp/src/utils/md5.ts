/**
 * HMAC-MD5 工具（逐行移植自仓库根 md5.js，BSD License，Paul Johnston 1999-2002）
 *
 * 关键事实（2026-09-09 已用真实接口验证）：
 * - 后端密码传输格式为 hex_hmac_md5(key='cds', data=pwd)，即密钥在前
 * - 与 Node crypto.createHmac('md5','cds').update(pwd) 结果一致
 * - 禁止明文或裸 MD5 提交密码（AGENTS.md 不变式 3）
 */

const HEXCASE = 0; // hex 输出格式：0 - 小写
const CHRSZ = 8; // bits per input character：8 - ASCII

function safeAdd(x: number, y: number): number {
  const lsw = (x & 0xffff) + (y & 0xffff);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xffff);
}

function bitRol(num: number, cnt: number): number {
  return (num << cnt) | (num >>> (32 - cnt));
}

function md5Cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
  return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
}

function md5Ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn((b & c) | (~b & d), a, b, x, s, t);
}

function md5Gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn((b & d) | (c & ~d), a, b, x, s, t);
}

function md5Hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5Ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
  return md5Cmn(c ^ (b | ~d), a, b, x, s, t);
}

function coreMd5(x: number[], len: number): number[] {
  // append padding
  x[len >> 5] |= 0x80 << len % 32;
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5Ff(a, b, c, d, x[i]!, 7, -680876936);
    d = md5Ff(d, a, b, c, x[i + 1]!, 12, -389564586);
    c = md5Ff(c, d, a, b, x[i + 2]!, 17, 606105819);
    b = md5Ff(b, c, d, a, x[i + 3]!, 22, -1044525330);
    a = md5Ff(a, b, c, d, x[i + 4]!, 7, -176418897);
    d = md5Ff(d, a, b, c, x[i + 5]!, 12, 1200080426);
    c = md5Ff(c, d, a, b, x[i + 6]!, 17, -1473231341);
    b = md5Ff(b, c, d, a, x[i + 7]!, 22, -45705983);
    a = md5Ff(a, b, c, d, x[i + 8]!, 7, 1770035416);
    d = md5Ff(d, a, b, c, x[i + 9]!, 12, -1958414417);
    c = md5Ff(c, d, a, b, x[i + 10]!, 17, -42063);
    b = md5Ff(b, c, d, a, x[i + 11]!, 22, -1990404162);
    a = md5Ff(a, b, c, d, x[i + 12]!, 7, 1804603682);
    d = md5Ff(d, a, b, c, x[i + 13]!, 12, -40341101);
    c = md5Ff(c, d, a, b, x[i + 14]!, 17, -1502002290);
    b = md5Ff(b, c, d, a, x[i + 15]!, 22, 1236535329);

    a = md5Gg(a, b, c, d, x[i + 1]!, 5, -165796510);
    d = md5Gg(d, a, b, c, x[i + 6]!, 9, -1069501632);
    c = md5Gg(c, d, a, b, x[i + 11]!, 14, 643717713);
    b = md5Gg(b, c, d, a, x[i]!, 20, -373897302);
    a = md5Gg(a, b, c, d, x[i + 5]!, 5, -701558691);
    d = md5Gg(d, a, b, c, x[i + 10]!, 9, 38016083);
    c = md5Gg(c, d, a, b, x[i + 15]!, 14, -660478335);
    b = md5Gg(b, c, d, a, x[i + 4]!, 20, -405537848);
    a = md5Gg(a, b, c, d, x[i + 9]!, 5, 568446438);
    d = md5Gg(d, a, b, c, x[i + 14]!, 9, -1019803690);
    c = md5Gg(c, d, a, b, x[i + 3]!, 14, -187363961);
    b = md5Gg(b, c, d, a, x[i + 8]!, 20, 1163531501);
    a = md5Gg(a, b, c, d, x[i + 13]!, 5, -1444681467);
    d = md5Gg(d, a, b, c, x[i + 2]!, 9, -51403784);
    c = md5Gg(c, d, a, b, x[i + 7]!, 14, 1735328473);
    b = md5Gg(b, c, d, a, x[i + 12]!, 20, -1926607734);

    a = md5Hh(a, b, c, d, x[i + 5]!, 4, -378558);
    d = md5Hh(d, a, b, c, x[i + 8]!, 11, -2022574463);
    c = md5Hh(c, d, a, b, x[i + 11]!, 16, 1839030562);
    b = md5Hh(b, c, d, a, x[i + 14]!, 23, -35309556);
    a = md5Hh(a, b, c, d, x[i + 1]!, 4, -1530992060);
    d = md5Hh(d, a, b, c, x[i + 4]!, 11, 1272893353);
    c = md5Hh(c, d, a, b, x[i + 7]!, 16, -155497632);
    b = md5Hh(b, c, d, a, x[i + 10]!, 23, -1094730640);
    a = md5Hh(a, b, c, d, x[i + 13]!, 4, 681279174);
    d = md5Hh(d, a, b, c, x[i]!, 11, -358537222);
    c = md5Hh(c, d, a, b, x[i + 3]!, 16, -722521979);
    b = md5Hh(b, c, d, a, x[i + 6]!, 23, 76029189);
    a = md5Hh(a, b, c, d, x[i + 9]!, 4, -640364487);
    d = md5Hh(d, a, b, c, x[i + 12]!, 11, -421815835);
    c = md5Hh(c, d, a, b, x[i + 15]!, 16, 530742520);
    b = md5Hh(b, c, d, a, x[i + 2]!, 23, -995338651);

    a = md5Ii(a, b, c, d, x[i]!, 6, -198630844);
    d = md5Ii(d, a, b, c, x[i + 7]!, 10, 1126891415);
    c = md5Ii(c, d, a, b, x[i + 14]!, 15, -1416354905);
    b = md5Ii(b, c, d, a, x[i + 5]!, 21, -57434055);
    a = md5Ii(a, b, c, d, x[i + 12]!, 6, 1700485571);
    d = md5Ii(d, a, b, c, x[i + 3]!, 10, -1894986606);
    c = md5Ii(c, d, a, b, x[i + 10]!, 15, -1051523);
    b = md5Ii(b, c, d, a, x[i + 1]!, 21, -2054922799);
    a = md5Ii(a, b, c, d, x[i + 8]!, 6, 1873313359);
    d = md5Ii(d, a, b, c, x[i + 15]!, 10, -30611744);
    c = md5Ii(c, d, a, b, x[i + 6]!, 15, -1560198380);
    b = md5Ii(b, c, d, a, x[i + 13]!, 21, 1309151649);
    a = md5Ii(a, b, c, d, x[i + 4]!, 6, -145523070);
    d = md5Ii(d, a, b, c, x[i + 11]!, 10, -1120210379);
    c = md5Ii(c, d, a, b, x[i + 2]!, 15, 718787259);
    b = md5Ii(b, c, d, a, x[i + 9]!, 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }
  return [a, b, c, d];
}

function coreHmacMd5(key: string, data: string): number[] {
  let bkey = str2binl(key);
  if (bkey.length > 16) bkey = coreMd5(bkey, key.length * CHRSZ);

  const ipad: number[] = [];
  const opad: number[] = [];
  for (let i = 0; i < 16; i++) {
    ipad[i] = (bkey[i] ?? 0) ^ 0x36363636;
    opad[i] = (bkey[i] ?? 0) ^ 0x5c5c5c5c;
  }

  const hash = coreMd5(ipad.concat(str2binl(data)), 512 + data.length * CHRSZ);
  return coreMd5(opad.concat(hash), 512 + 128);
}

function str2binl(str: string): number[] {
  const bin: number[] = [];
  const mask = (1 << CHRSZ) - 1;
  for (let i = 0; i < str.length * CHRSZ; i += CHRSZ) {
    bin[i >> 5] |= (str.charCodeAt(i / CHRSZ) & mask) << i % 32;
  }
  return bin;
}

function binl2hex(binarray: number[]): string {
  const hexTab = HEXCASE ? '0123456789ABCDEF' : '0123456789abcdef';
  let str = '';
  for (let i = 0; i < binarray.length * 4; i++) {
    str +=
      hexTab.charAt((binarray[i >> 2]! >> ((i % 4) * 8 + 4)) & 0xf) +
      hexTab.charAt((binarray[i >> 2]! >> ((i % 4) * 8)) & 0xf);
  }
  return str;
}

/** HMAC-MD5（密钥在前，与后端约定一致） */
export function hexHmacMd5(key: string, data: string): string {
  return binl2hex(coreHmacMd5(key, data));
}

/** 密码传输加密：HMAC-MD5，密钥 cds（禁止明文/裸 MD5） */
export function encryptPassword(pwd: string): string {
  return hexHmacMd5('cds', pwd);
}
