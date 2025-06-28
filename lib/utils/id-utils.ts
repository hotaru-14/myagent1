import { generateId } from 'ai'

/**
 * 一時的な会話IDを生成
 * 新しい会話ボタンクリック時に使用
 */
export function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * IDが一時的なものかどうかを判定
 */
export function isTemporaryId(id: string): boolean {
  return id.startsWith('temp-')
}

/**
 * 一時IDを永続IDに変換（新しいUUIDを生成）
 */
export function convertTempIdToPermanent(tempId: string): string {
  return generateId()
}

/**
 * IDが永続的なものかどうかを判定
 */
export function isPermanentId(id: string): boolean {
  return !isTemporaryId(id)
} 