import { renderHook, act } from '@testing-library/react'
import { 
  useModal, 
  useConfirmationModal, 
  useFormModal, 
  useAlertModal 
} from '@/hooks/useModal'

describe('useModal', () => {
  it('should initialize with default closed state', () => {
    const { result } = renderHook(() => useModal())
    expect(result.current.isOpen).toBe(false)
  })

  it('should initialize with provided initial state', () => {
    const { result } = renderHook(() => useModal(true))
    expect(result.current.isOpen).toBe(true)
  })

  it('should open modal', () => {
    const { result } = renderHook(() => useModal())
    
    act(() => {
      result.current.open()
    })
    
    expect(result.current.isOpen).toBe(true)
  })

  it('should close modal', () => {
    const { result } = renderHook(() => useModal(true))
    
    act(() => {
      result.current.close()
    })
    
    expect(result.current.isOpen).toBe(false)
  })

  it('should toggle modal state', () => {
    const { result } = renderHook(() => useModal())
    
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(true)
    
    act(() => {
      result.current.toggle()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should set modal state directly', () => {
    const { result } = renderHook(() => useModal())
    
    act(() => {
      result.current.setIsOpen(true)
    })
    expect(result.current.isOpen).toBe(true)
    
    act(() => {
      result.current.setIsOpen(false)
    })
    expect(result.current.isOpen).toBe(false)
  })
})

describe('useConfirmationModal', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useConfirmationModal())
    expect(result.current.isOpen).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.config).toBe(null)
  })

  it('should open with config', () => {
    const { result } = renderHook(() => useConfirmationModal())
    const onConfirm = jest.fn()
    
    act(() => {
      result.current.confirm({
        title: 'Delete item?',
        description: 'This action cannot be undone',
        onConfirm,
      })
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.config).toMatchObject({
      title: 'Delete item?',
      description: 'This action cannot be undone',
    })
  })

  it('should call onConfirm and close on handleConfirm', async () => {
    const { result } = renderHook(() => useConfirmationModal())
    const onConfirm = jest.fn().mockResolvedValue(undefined)
    
    act(() => {
      result.current.confirm({
        title: 'Confirm',
        onConfirm,
      })
    })
    
    await act(async () => {
      await result.current.handleConfirm()
    })
    
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(result.current.isOpen).toBe(false)
    expect(result.current.config).toBe(null)
  })

  it('should handle async onConfirm', async () => {
    const { result } = renderHook(() => useConfirmationModal())
    const onConfirm = jest.fn().mockResolvedValue(undefined)
    
    act(() => {
      result.current.confirm({
        title: 'Async Confirm',
        onConfirm,
      })
    })
    
    await act(async () => {
      await result.current.handleConfirm()
    })
    
    expect(onConfirm).toHaveBeenCalled()
    expect(result.current.isLoading).toBe(false)
  })

  it('should handle errors in onConfirm', async () => {
    const { result } = renderHook(() => useConfirmationModal())
    const onConfirm = jest.fn().mockRejectedValue(new Error('Failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    act(() => {
      result.current.confirm({
        title: 'Error Confirm',
        onConfirm,
      })
    })
    
    await act(async () => {
      await result.current.handleConfirm()
    })
    
    expect(onConfirm).toHaveBeenCalled()
    expect(result.current.isOpen).toBe(true) // Should stay open on error
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })

  it('should close modal', () => {
    const { result } = renderHook(() => useConfirmationModal())
    
    act(() => {
      result.current.confirm({
        title: 'Test',
        onConfirm: jest.fn(),
      })
    })
    
    act(() => {
      result.current.close()
    })
    
    expect(result.current.isOpen).toBe(false)
    expect(result.current.config).toBe(null)
  })

  it('should not close while loading', () => {
    const { result } = renderHook(() => useConfirmationModal())
    const onConfirm = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    act(() => {
      result.current.confirm({
        title: 'Test',
        onConfirm,
      })
    })
    
    act(() => {
      result.current.handleConfirm()
    })
    
    act(() => {
      result.current.close()
    })
    
    // Should still be open because it's loading
    expect(result.current.isOpen).toBe(true)
  })
})

describe('useFormModal', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useFormModal())
    expect(result.current.isOpen).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('should open and close', () => {
    const { result } = renderHook(() => useFormModal())
    
    act(() => {
      result.current.open()
    })
    expect(result.current.isOpen).toBe(true)
    
    act(() => {
      result.current.close()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should handle form submission', async () => {
    const { result } = renderHook(() => useFormModal())
    const submitFn = jest.fn().mockResolvedValue(undefined)
    
    act(() => {
      result.current.open()
    })
    
    await act(async () => {
      await result.current.handleSubmit(submitFn)
    })
    
    expect(submitFn).toHaveBeenCalled()
    expect(result.current.isOpen).toBe(false)
  })

  it('should handle submission errors', async () => {
    const { result } = renderHook(() => useFormModal())
    const submitFn = jest.fn().mockRejectedValue(new Error('Submit failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    act(() => {
      result.current.open()
    })
    
    await act(async () => {
      await result.current.handleSubmit(submitFn)
    })
    
    expect(result.current.isOpen).toBe(true) // Should stay open on error
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })
})

describe('useAlertModal', () => {
  it('should initialize with closed state', () => {
    const { result } = renderHook(() => useAlertModal())
    expect(result.current.isOpen).toBe(false)
    expect(result.current.config).toBe(null)
  })

  it('should show alert with config', () => {
    const { result } = renderHook(() => useAlertModal())
    
    act(() => {
      result.current.alert({
        title: 'Alert Title',
        description: 'Alert description',
        variant: 'error',
      })
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.config).toMatchObject({
      title: 'Alert Title',
      description: 'Alert description',
      variant: 'error',
    })
  })

  it('should close alert', () => {
    const { result } = renderHook(() => useAlertModal())
    
    act(() => {
      result.current.alert({
        title: 'Test Alert',
      })
    })
    
    act(() => {
      result.current.close()
    })
    
    expect(result.current.isOpen).toBe(false)
    expect(result.current.config).toBe(null)
  })
})

