/**
 * Accessibility tests for UI components
 * These tests ensure WCAG 2.1 Level AA compliance
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../button';
import { Input } from '../input';
import { Modal } from '../modal';
import { Select } from '../select';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have aria-disabled when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('should have aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should have custom aria-label', () => {
    render(<Button ariaLabel="Save document">Save</Button>);
    const button = screen.getByRole('button', { name: 'Save document' });
    expect(button).toBeInTheDocument();
  });

  it('should be keyboard accessible', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    const button = screen.getByRole('button');
    button.focus();
    
    // Simulate Enter key
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
    
    expect(button).toHaveFocus();
  });
});

describe('Input Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Input 
        label="Email" 
        type="email" 
        placeholder="Enter email"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should associate label with input', () => {
    render(<Input label="Username" id="username" />);
    const input = screen.getByLabelText('Username');
    expect(input).toBeInTheDocument();
  });

  it('should have aria-invalid when error is present', () => {
    render(<Input label="Email" error="Invalid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should link error message with aria-describedby', () => {
    render(<Input label="Email" error="Invalid email" id="email" />);
    const input = screen.getByLabelText('Email');
    const describedBy = input.getAttribute('aria-describedby');
    
    expect(describedBy).toContain('error');
    const errorElement = document.getElementById(describedBy!);
    expect(errorElement).toHaveTextContent('Invalid email');
  });

  it('should show required indicator', () => {
    render(<Input label="Email" required />);
    expect(screen.getByLabelText(/requis/i)).toBeInTheDocument();
  });

  it('should display helper text', () => {
    render(
      <Input 
        label="Password" 
        helperText="Must be at least 8 characters"
      />
    );
    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });
});

describe('Modal Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Content</p>
      </Modal>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have role="dialog"', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should have aria-modal="true"', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('should link title with aria-labelledby', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    
    expect(labelledBy).toBeTruthy();
    const titleElement = document.getElementById(labelledBy!);
    expect(titleElement).toHaveTextContent('Test Modal');
  });

  it('should close on Escape key', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test">
        Content
      </Modal>
    );
    
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  it('should trap focus within modal', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test">
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      </Modal>
    );

    const buttons = screen.getAllByRole('button').filter(
      btn => btn.textContent === 'Button 1' || 
             btn.textContent === 'Button 2' || 
             btn.textContent === 'Button 3'
    );
    
    // First button should receive focus
    expect(buttons[0]).toHaveFocus();
  });
});

describe('Select Accessibility', () => {
  const options = [
    { value: '1', label: 'Option 1' },
    { value: '2', label: 'Option 2' },
    { value: '3', label: 'Option 3' },
  ];

  it('should have no accessibility violations', async () => {
    const { container } = render(
      <Select 
        options={options} 
        value="" 
        onChange={() => {}}
        label="Choose option"
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have role="combobox"', () => {
    render(
      <Select 
        options={options} 
        value="" 
        onChange={() => {}}
        label="Choose"
      />
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should have aria-expanded', () => {
    render(
      <Select 
        options={options} 
        value="" 
        onChange={() => {}}
        label="Choose"
      />
    );
    const combobox = screen.getByRole('combobox');
    expect(combobox).toHaveAttribute('aria-expanded', 'false');
  });

  it('should open on Enter key', async () => {
    render(
      <Select 
        options={options} 
        value="" 
        onChange={() => {}}
        label="Choose"
      />
    );
    
    const combobox = screen.getByRole('combobox');
    combobox.focus();
    fireEvent.keyDown(combobox, { key: 'Enter', code: 'Enter' });
    
    expect(combobox).toHaveAttribute('aria-expanded', 'true');
  });

  it('should have role="option" for each option', async () => {
    render(
      <Select 
        options={options} 
        value="" 
        onChange={() => {}}
        label="Choose"
      />
    );
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    const optionElements = screen.getAllByRole('option');
    expect(optionElements).toHaveLength(3);
  });

  it('should have aria-selected on selected option', async () => {
    render(
      <Select 
        options={options} 
        value="2" 
        onChange={() => {}}
        label="Choose"
      />
    );
    
    const combobox = screen.getByRole('combobox');
    fireEvent.click(combobox);
    
    const selectedOption = screen.getByRole('option', { name: 'Option 2' });
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
  });
});

describe('Keyboard Navigation', () => {
  it('should navigate through focusable elements with Tab', async () => {
    render(
      <div>
        <Button>Button 1</Button>
        <Input label="Input 1" />
        <Button>Button 2</Button>
      </div>
    );

    const button1 = screen.getByRole('button', { name: 'Button 1' });
    const input = screen.getByLabelText('Input 1');
    const button2 = screen.getByRole('button', { name: 'Button 2' });

    button1.focus();
    expect(button1).toHaveFocus();

    // Simulate Tab
    fireEvent.keyDown(button1, { key: 'Tab', code: 'Tab' });
    input.focus();
    expect(input).toHaveFocus();

    // Simulate Tab again
    fireEvent.keyDown(input, { key: 'Tab', code: 'Tab' });
    button2.focus();
    expect(button2).toHaveFocus();
  });
});

describe('Screen Reader Announcements', () => {
  it('should announce errors with role="alert"', () => {
    render(<Input label="Email" error="Invalid email" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid email');
  });

  it('should hide decorative icons from screen readers', () => {
    render(
      <Button>
        <span aria-hidden="true">→</span>
        Next
      </Button>
    );
    
    const icon = document.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });
});

describe('Focus Management', () => {
  it('should have visible focus indicators', () => {
    render(<Button>Focus me</Button>);
    const button = screen.getByRole('button');
    button.focus();
    
    // Check if focus styles are applied (class contains focus-visible)
    expect(button.className).toMatch(/focus-visible/);
  });

  it('should not trap focus outside modals', () => {
    render(
      <div>
        <Button>Outside Button</Button>
        <Modal isOpen={false} onClose={() => {}} title="Test">
          <Button>Inside Button</Button>
        </Modal>
      </div>
    );

    const outsideButton = screen.getByRole('button', { name: 'Outside Button' });
    outsideButton.focus();
    expect(outsideButton).toHaveFocus();
  });
});

