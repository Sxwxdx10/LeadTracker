import * as React from 'react';

/**
 * Component that renders content only visible to screen readers
 * Follows WCAG 2.1 guidelines for visually hidden content
 */
export interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export const ScreenReaderOnly = React.forwardRef<HTMLElement, ScreenReaderOnlyProps>(
  ({ children, as: Component = 'span' }, ref) => {
    return React.createElement(
      Component,
      {
        ref,
        className: "sr-only",
        style: {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: '0',
        },
      },
      children
    );
  }
);

ScreenReaderOnly.displayName = 'ScreenReaderOnly';

/**
 * Live region component for announcing dynamic changes to screen readers
 */
export interface LiveRegionProps {
  children: React.ReactNode;
  priority?: 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  priority = 'polite',
  atomic = true,
  relevant = 'all',
}) => {
  return (
    <div
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
};

LiveRegion.displayName = 'LiveRegion';

