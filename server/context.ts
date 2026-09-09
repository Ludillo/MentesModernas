import { AsyncLocalStorage } from 'node:async_hooks'
export type Env = { FIREBASE_SERVICE_ACCOUNT: string; PRIVATE_FILES: R2Bucket; ASSETS: Fetcher; APP_SECRET: string; [key: string]: any }
export const context = new AsyncLocalStorage<{env: Env; request: Request}>()
export function env(): Env { const value = context.getStore(); if (!value) throw Error('Missing request context'); return value.env }
