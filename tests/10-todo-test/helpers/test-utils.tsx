import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// カスタムレンダーオプション用のProps型
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // 将来的にThemeProviderやRouterProviderなどを追加する場合
}

// カスタムレンダー関数
const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  // 将来的にプロバイダーでラップする場合
  const Wrapper = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

// testing-libraryのすべてをexportしつつ、カスタムレンダーも追加
export * from '@testing-library/react'
export { customRender as render } 