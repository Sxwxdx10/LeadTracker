import { render, screen } from '@/__tests__/utils/test-utils'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  describe('Rendering', () => {
    it('should render input field', () => {
      render(<Input placeholder="Enter text" />)
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<Input className="custom-class" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('custom-class')
    })

    it('should render with different types', () => {
      const { rerender } = render(<Input type="text" data-testid="input" />)
      let input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'text')

      rerender(<Input type="email" data-testid="input" />)
      input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'email')

      rerender(<Input type="password" data-testid="input" />)
      input = screen.getByTestId('input')
      expect(input).toHaveAttribute('type', 'password')
    })

    it('should show error state', () => {
      render(<Input error data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-red-500')
    })
  })

  describe('Interactions', () => {
    it('should accept user input', async () => {
      const user = userEvent.setup()
      render(<Input placeholder="Type here" />)
      
      const input = screen.getByPlaceholderText('Type here')
      await user.type(input, 'Hello World')
      
      expect(input).toHaveValue('Hello World')
    })

    it('should call onChange handler', async () => {
      const handleChange = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onChange={handleChange} placeholder="Type here" />)
      const input = screen.getByPlaceholderText('Type here')
      
      await user.type(input, 'Test')
      
      expect(handleChange).toHaveBeenCalled()
    })

    it('should call onBlur handler', async () => {
      const handleBlur = jest.fn()
      const user = userEvent.setup()
      
      render(<Input onBlur={handleBlur} placeholder="Type here" />)
      const input = screen.getByPlaceholderText('Type here')
      
      await user.click(input)
      await user.tab()
      
      expect(handleBlur).toHaveBeenCalled()
    })

    it('should not accept input when disabled', async () => {
      const user = userEvent.setup()
      render(<Input disabled placeholder="Disabled input" />)
      
      const input = screen.getByPlaceholderText('Disabled input')
      expect(input).toBeDisabled()
      
      await user.type(input, 'Test')
      expect(input).toHaveValue('')
    })
  })

  describe('Value Control', () => {
    it('should work as controlled component', async () => {
      const TestComponent = () => {
        const [value, setValue] = React.useState('')
        return (
          <Input 
            value={value} 
            onChange={(e) => setValue(e.target.value)}
            placeholder="Controlled"
          />
        )
      }

      const user = userEvent.setup()
      render(<TestComponent />)
      
      const input = screen.getByPlaceholderText('Controlled')
      await user.type(input, 'Controlled value')
      
      expect(input).toHaveValue('Controlled value')
    })

    it('should display default value', () => {
      render(<Input defaultValue="Default text" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveValue('Default text')
    })
  })

  describe('Accessibility', () => {
    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(
        <>
          <Input placeholder="First" />
          <Input placeholder="Second" />
        </>
      )
      
      const firstInput = screen.getByPlaceholderText('First')
      const secondInput = screen.getByPlaceholderText('Second')
      
      firstInput.focus()
      expect(firstInput).toHaveFocus()
      
      await user.tab()
      expect(secondInput).toHaveFocus()
    })

    it('should support required attribute', () => {
      render(<Input required data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toBeRequired()
    })

    it('should support aria attributes', () => {
      render(
        <Input 
          aria-label="Search" 
          aria-describedby="search-help"
          data-testid="input"
        />
      )
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-label', 'Search')
      expect(input).toHaveAttribute('aria-describedby', 'search-help')
    })
  })
})

// Import React for controlled component test
import * as React from 'react'

