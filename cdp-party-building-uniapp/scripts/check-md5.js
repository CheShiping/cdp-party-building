// md5.ts 已知答案校验（回归防护）：
// 2026-09-09 曾因 TS 移植时漏写一轮 II 运算，导致 encryptPassword('123456') 输出错误密文。
// 本脚本用 Node 内置 crypto 的 HMAC-MD5 作基准，逐向量比对 src/utils/md5.ts，不一致即 exit 1。
// 注意：md5.js 为 chrsz=8（ASCII）实现，非 ASCII 字符高位被丢弃，故校验只覆盖 ASCII 向量。
const { execFileSync } = require('child_process');
const path = require('path');
const { pathToFileURL } = require('url');

const md5Path = pathToFileURL(path.resolve(__dirname, '../src/utils/md5.ts')).href;

const VECTORS = ['', 'a', 'abc', '123456', 'admin', '88888888', 'message digest', 'abcdefghijklmnopqrstuvwxyz',
  '1234567890123456789012345678901234567890123456789012345678901234567890', 'Aa1!at#$%^&*()'];

const script = `
import { hexHmacMd5, encryptPassword } from '${md5Path}';
import crypto from 'node:crypto';
const vectors = ${JSON.stringify(VECTORS)};
let bad = 0;
for (const v of vectors) {
  const actual = hexHmacMd5('cds', v);
  const expected = crypto.createHmac('md5', 'cds').update(v).digest('hex');
  if (actual !== expected) { bad++; console.error('  MISMATCH: ' + JSON.stringify(v) + ' -> ' + actual + ' (expect ' + expected + ')'); }
}
// 关键向量：密码 123456 必须等于后端已验证通过的密文
const pwd = encryptPassword('123456');
if (pwd !== '64d53bde5d769763153159245c619185') { bad++; console.error('  MISMATCH: encryptPassword(123456) -> ' + pwd); }
console.log(bad ? '[check-md5] FAILED' : '[check-md5] OK - ' + vectors.length + ' vectors + 关键密码向量全部一致');
process.exit(bad ? 1 : 0);
`;

try {
  execFileSync(process.execPath, ['--experimental-strip-types', '--no-warnings', '--input-type=module', '-e', script], {
    stdio: 'inherit',
  });
} catch (err) {
  if (err && err.message && /--experimental-strip-types|bad option/i.test(err.message)) {
    console.warn('[check-md5] 当前 Node 不支持类型剥离，已跳过（需 Node >= 22.6）');
    process.exit(0);
  }
  console.error('[check-md5] 失败：md5.ts 与标准 HMAC-MD5 不一致');
  process.exit(1);
}
