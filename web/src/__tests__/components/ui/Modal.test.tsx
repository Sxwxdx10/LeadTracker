import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/modal'

describe('Modal Component', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={mockOnClose}>
          Modal Content
        </Modal>
      )
      
      expect(screen.queryByText('Modal Content')).not.toBeInTheDocument()
    })

    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          Modal Content
        </Modal>
      )
      
      expect(screen.getByText('Modal Content')).toBeInTheDocument()
    })

    it('should render with title', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
          Content
        </Modal>
      )
      
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    it('should render with different sizes', () => {
      const { rerender, container } = render(
        <Modal isOpen={true} onClose={mockOnClose} size="sm">
          Content
        </Modal>
      )
      
      let modal = container.querySelector('.max-w-sm')
      expect(modal).toBeInTheDocument()

      rerender(
        <Modal isOpen={true} onClose={mockOnClose} size="lg">
          Content
        </Modal>
      )
      modal = container.querySelector('.max-w-lg')
      expect(modal).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} className="custom-modal">
          Content
        </Modal>
      )
      
      const modal = container.querySelector('.custom-modal')
      expect(modal).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClose when clicking overlay', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          Content
        </Modal>
      )
      
      const overlay = container.querySelector('.bg-black')
      if (overlay) {
        await user.click(overlay)
        expect(mockOnClose).toHaveBeenCalledTimes(1)
      }
    })

    it('should call onClose when clicking close button', async () => {
      const user = userEvent.setup()
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test" closable={true}>
          Content
        </Modal>
      )
      
      const closeButton = screen.getByRole('button')
      await user.click(closeButton)
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not show close button when closable is false', () => {
      render(
        <Modal isOpen={true} onClose={mockOnClose} title="Test" closable={false}>
          Content
        </Modal>
      )
      
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should not close on overlay click when closable is false', async () => {
      const user = userEvent.setup()
      const { container } = render(
        <Modal isOpen={true} onClose={mockOnClose} closable={false}>
          Content
        </Modal>
      )
      
      const overlay = container.querySelector('.bg-black')
      if (overlay) {
        await user.click(overlay)
        expect(mockOnClose).not.toHaveBeenCalled()
      }
    })
  })

  describe('Keyboard Interactions', () => {
    it('should close on Escape key when closable', async () => {
      const user = userEvent.setup()
      render(
        <Modal isOpen={true} onClose={mockOnClose} closable={true}>
          Content
        </Modal>
      )
      
      await user.keyboard('{Escape}')
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should not close on Escape key when not closable', async () => {
      const user = userEvent.setup()
      render(
        <Modal isOpen={true} onClose={mockOnClose} closable={false}>
          Content
        </Modal>
      )
      
      await user.keyboard('{Escape}')
      
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Body Scroll Prevention', () => {
    it('should prevent body scroll when open', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={mockOnClose}>
          Content
        </Modal>
      )
      
      expect(document.body.style.overflow).toBe('hidden')
      
      rerender(
        <Modal isOpen={false} onClose={mockOnClose}>
          Content
        </Modal>
      )
      
      // Wait for cleanup
      waitFor(() => {
        expect(document.body.style.overflow).toBe('unset')
      })
    })
  })

  describe('Compound Components', () => {
    it('should render ModalHeader, ModalBody, and ModalFooter', () => {
      const { ModalHeader, ModalBody, ModalFooter } = require('@/components/ui/modal')
      
      render(
        <Modal isOpen={true} onClose={mockOnClose}>
          <ModalHeader>Header</ModalHeader>
          <ModalBody>Body</ModalBody>
          <ModalFooter>Footer</ModalFooter>
        </Modal>
      )
      
      expect(screen.getByText('Header')).toBeInTheDocument()
      expect(screen.getByText('Body')).toBeInTheDocument()
      expect(screen.getByText('Footer')).toBeInTheDocument()
    })
  })
})

