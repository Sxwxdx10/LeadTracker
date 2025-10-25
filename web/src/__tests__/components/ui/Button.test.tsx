import { render, screen } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
    })

    it('should render with different variants', () => {
      const { rerender } = render(<Button variant="default">Default</Button>)
      let button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')

      rerender(<Button variant="destructive">Destructive</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('bg-destructive')

      rerender(<Button variant="outline">Outline</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('border')
    })

    it('should render with different sizes', () => {
      const { rerender } = render(<Button size="default">Default</Button>)
      let button = screen.getByRole('button')
      expect(button).toHaveClass('h-10')

      rerender(<Button size="sm">Small</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-9')

      rerender(<Button size="lg">Large</Button>)
      button = screen.getByRole('button')
      expect(button).toHaveClass('h-11')
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      await user.click(screen.getByRole('button'))
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when disabled', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick} disabled>Click me</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      // Attempt to click (should not work)
      await user.click(button)
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button).toBeDisabled()
    })

    it('should show loading text when provided', () => {
      render(
        <Button loading loadingText="Saving...">
          Save
        </Button>
      )
      
      expect(screen.getByText('Saving...')).toBeInTheDocument()
      expect(screen.queryByText('Save')).not.toBeInTheDocument()
    })

    it('should not call onClick when loading', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick} loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have correct aria attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toBeDisabled()
    })

    it('should accept custom aria-label', () => {
      render(<Button ariaLabel="Custom label">Button</Button>)
      
      expect(screen.getByRole('button', { name: 'Custom label' })).toBeInTheDocument()
    })

    it('should be keyboard accessible', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Press me</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      expect(button).toHaveFocus()
      
      await user.keyboard('{Enter}')
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})

