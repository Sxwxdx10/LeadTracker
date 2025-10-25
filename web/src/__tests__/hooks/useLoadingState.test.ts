import { renderHook, act, waitFor } from '@testing-library/react'
import { 
  useLoadingState, 
  useButtonLoadingStates, 
  useLoadingWithTimeout 
} from '@/hooks/useLoadingState'

describe('useLoadingState', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useLoadingState())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should initialize with custom initial loading state', () => {
    const { result } = renderHook(() => useLoadingState({ initialLoading: true }))
    
    expect(result.current.isLoading).toBe(true)
  })

  it('should execute async function successfully', async () => {
    const { result } = renderHook(() => useLoadingState())
    const asyncFn = jest.fn().mockResolvedValue('success')
    
    let promise: Promise<any>
    
    act(() => {
      promise = result.current.execute(asyncFn)
    })
    
    expect(result.current.isLoading).toBe(true)
    
    await act(async () => {
      const returnValue = await promise!
      expect(returnValue).toBe('success')
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('should handle errors', async () => {
    const { result } = renderHook(() => useLoadingState())
    const error = new Error('Test error')
    const asyncFn = jest.fn().mockRejectedValue(error)
    
    let promise: Promise<any>
    
    act(() => {
      promise = result.current.execute(asyncFn)
    })
    
    await act(async () => {
      await promise!
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toEqual(error)
  })

  it('should call onSuccess callback', async () => {
    const onSuccess = jest.fn()
    const { result } = renderHook(() => useLoadingState({ onSuccess }))
    const asyncFn = jest.fn().mockResolvedValue('success')
    
    await act(async () => {
      await result.current.execute(asyncFn)
    })
    
    expect(onSuccess).toHaveBeenCalled()
  })

  it('should call onError callback', async () => {
    const error = new Error('Test error')
    const onError = jest.fn()
    const { result } = renderHook(() => useLoadingState({ onError }))
    const asyncFn = jest.fn().mockRejectedValue(error)
    
    await act(async () => {
      await result.current.execute(asyncFn)
    })
    
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('should reset state', async () => {
    const { result } = renderHook(() => useLoadingState())
    const error = new Error('Test error')
    const asyncFn = jest.fn().mockRejectedValue(error)
    
    await act(async () => {
      await result.current.execute(asyncFn)
    })
    
    expect(result.current.error).not.toBe(null)
    
    act(() => {
      result.current.reset()
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(null)
  })
})

describe('useButtonLoadingStates', () => {
  it('should initialize with empty loading states', () => {
    const { result } = renderHook(() => useButtonLoadingStates())
    
    expect(result.current.loadingStates).toEqual({})
    expect(result.current.isLoading('any-key')).toBe(false)
  })

  it('should set loading state for a key', () => {
    const { result } = renderHook(() => useButtonLoadingStates())
    
    act(() => {
      result.current.setLoading('save', true)
    })
    
    expect(result.current.isLoading('save')).toBe(true)
    expect(result.current.isLoading('delete')).toBe(false)
  })

  it('should handle multiple loading states', () => {
    const { result } = renderHook(() => useButtonLoadingStates())
    
    act(() => {
      result.current.setLoading('save', true)
      result.current.setLoading('delete', true)
    })
    
    expect(result.current.isLoading('save')).toBe(true)
    expect(result.current.isLoading('delete')).toBe(true)
  })

  it('should execute with loading state', async () => {
    const { result } = renderHook(() => useButtonLoadingStates())
    const asyncFn = jest.fn().mockResolvedValue('result')
    
    let promise: Promise<any>
    
    act(() => {
      promise = result.current.executeWithLoading('test', asyncFn)
    })
    
    expect(result.current.isLoading('test')).toBe(true)
    
    await act(async () => {
      const value = await promise!
      expect(value).toBe('result')
    })
    
    expect(result.current.isLoading('test')).toBe(false)
  })

  it('should handle execution errors and still reset loading', async () => {
    const { result } = renderHook(() => useButtonLoadingStates())
    const error = new Error('Failed')
    const asyncFn = jest.fn().mockRejectedValue(error)
    
    let errorThrown = false
    
    await act(async () => {
      try {
        await result.current.executeWithLoading('test', asyncFn)
      } catch (e) {
        errorThrown = true
      }
    })
    
    expect(errorThrown).toBe(true)
    expect(result.current.isLoading('test')).toBe(false)
  })
})

describe('useLoadingWithTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  it('should initialize with not loading state', () => {
    const { result } = renderHook(() => useLoadingWithTimeout())
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasTimedOut).toBe(false)
  })

  it('should start loading', () => {
    const { result } = renderHook(() => useLoadingWithTimeout())
    
    act(() => {
      result.current.startLoading()
    })
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasTimedOut).toBe(false)
  })

  it('should timeout after specified duration', async () => {
    const { result } = renderHook(() => useLoadingWithTimeout(1000))
    
    act(() => {
      result.current.startLoading()
    })
    
    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasTimedOut).toBe(false)
    
    await act(async () => {
      jest.advanceTimersByTime(1000)
      await Promise.resolve()
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasTimedOut).toBe(true)
  })

  it('should stop loading manually', () => {
    const { result } = renderHook(() => useLoadingWithTimeout())
    
    act(() => {
      result.current.startLoading()
    })
    
    expect(result.current.isLoading).toBe(true)
    
    act(() => {
      result.current.stopLoading()
    })
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.hasTimedOut).toBe(false)
  })

  it('should cleanup timeout on unmount', () => {
    const { result, unmount } = renderHook(() => useLoadingWithTimeout(1000))
    
    let cleanup: (() => void) | undefined
    
    act(() => {
      cleanup = result.current.startLoading()
    })
    
    unmount()
    
    if (cleanup) {
      act(() => {
        cleanup()
      })
    }
    
    // Should not throw any errors
    expect(true).toBe(true)
  })
})

