import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Contains a failure in the decorative 3D layer (a chunk that fails to load, a
 * WebGL context that can't be created) so it never takes the page down with
 * it. Renders `fallback` (nothing by default) once its children have thrown,
 * and reports the error through `onError`.
 */
export class StageErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode; onError?: (error: unknown) => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.warn('3D stage disabled:', error, info.componentStack)
    this.props.onError?.(error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
