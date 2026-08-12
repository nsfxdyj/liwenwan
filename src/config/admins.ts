// 写死的 3 个管理员账号（规格书 §五.1）
// hash = sha256(ADMIN_SALT + 密码)
// 初始密码随部署文档单独交付（见仓库外的「初始管理员密码-勿入库.txt」），不写入本仓库任何文件。
// 生成方式：node scripts/gen-admin-hash.mjs <密码>
// ⚠️ 管理员首次使用后务必修改密码（重新生成哈希并更新本文件后提交）。

export const ADMIN_SALT = 'kX7fQ2mZ9pL4wR8tN3vB6yH1cJ5uA0sD';

export interface AdminAccount {
  username: string;
  hash: string;
}

export const ADMINS: AdminAccount[] = [
  { username: 'admin1', hash: '62ecaf7577cc4ebd7d4e4aa0b84801549e884c29e6afce64910158925f5650ef' },
  { username: 'admin2', hash: '62ecaf7577cc4ebd7d4e4aa0b84801549e884c29e6afce64910158925f5650ef' },
  { username: 'admin3', hash: '62ecaf7577cc4ebd7d4e4aa0b84801549e884c29e6afce64910158925f5650ef' },
];
