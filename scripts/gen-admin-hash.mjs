// 生成管理员密码哈希：node scripts/gen-admin-hash.mjs <密码> [salt]
// 默认 salt 与 src/config/admins.ts 中写死的一致。
import { createHash } from 'node:crypto';

const DEFAULT_SALT = 'kX7fQ2mZ9pL4wR8tN3vB6yH1cJ5uA0sD';

const password = process.argv[2];
const salt = process.argv[3] ?? DEFAULT_SALT;

if (!password) {
  console.error('用法：node scripts/gen-admin-hash.mjs <密码> [salt]');
  process.exit(1);
}

const hash = createHash('sha256').update(salt + password).digest('hex');
console.log(`salt:     ${salt}`);
console.log(`password: ${password}`);
console.log(`hash:     ${hash}`);
