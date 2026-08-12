import { defineStore } from 'pinia';
import { ADMINS, ADMIN_SALT } from '../config/admins';
import { sha256Hex } from '../utils/crypto';

const SESSION_KEY = 'lww_admin_session';
const LOCK_KEY = 'lww_admin_lock';

const MAX_FAILS = 5;
const LOCK_MS = 10 * 60 * 1000;

interface LockState {
  fails: number;
  lockUntil: number; // 时间戳，0 表示未锁定
}

function readLock(): LockState {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    if (raw) return JSON.parse(raw) as LockState;
  } catch {
    /* 忽略损坏数据 */
  }
  return { fails: 0, lockUntil: 0 };
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    username: sessionStorage.getItem(SESSION_KEY) ?? '',
    lock: readLock(),
  }),
  getters: {
    isLoggedIn: (s) => !!s.username,
    lockRemainingMs: (s) => Math.max(0, s.lock.lockUntil - Date.now()),
  },
  actions: {
    // 返回 null 表示成功，否则为错误文案
    async login(username: string, password: string): Promise<string | null> {
      if (this.lockRemainingMs > 0) {
        return `连续失败次数过多，已锁定，请 ${Math.ceil(this.lockRemainingMs / 60000)} 分钟后再试`;
      }
      const account = ADMINS.find((a) => a.username === username);
      const hash = await sha256Hex(ADMIN_SALT + password);
      if (!account || account.hash !== hash) {
        const fails = this.lock.fails + 1;
        this.lock = {
          fails,
          lockUntil: fails >= MAX_FAILS ? Date.now() + LOCK_MS : 0,
        };
        if (this.lock.lockUntil) this.lock.fails = 0;
        localStorage.setItem(LOCK_KEY, JSON.stringify(this.lock));
        return this.lock.lockUntil
          ? '连续失败 5 次，已锁定 10 分钟'
          : '用户名或密码错误';
      }
      this.lock = { fails: 0, lockUntil: 0 };
      localStorage.setItem(LOCK_KEY, JSON.stringify(this.lock));
      this.username = username;
      sessionStorage.setItem(SESSION_KEY, username);
      return null;
    },
    logout() {
      this.username = '';
      sessionStorage.removeItem(SESSION_KEY);
    },
  },
});
