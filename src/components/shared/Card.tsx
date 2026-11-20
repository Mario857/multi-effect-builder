'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { ACCENT_TEXT_CLASSES, SECTION_TITLE_CLASSES } from '@/lib/constants/ui';
import type { AccentColor } from '@/lib/constants/ui';

const VARIANT_CLASSES = {
  solid: 'border border-border-default bg-bg-surface',
  // Frosted translucent panel (see .glass-card / .card-highlight in globals.css).
  glass: 'glass-card card-highlight',
  // Glass panel with the pedalboard dot-grid texture.
  pedalboard: 'glass-card card-highlight pedalboard-surface',
} as const;

// `md` pads the whole card and spaces header and content evenly. `none` leaves the content
// flush with the card edges (for content that scrolls or pads itself) and turns the header
// into a bar separated from it by a divider.
const PADDING_CLASSES = {
  none: { root: '', header: 'border-b border-glass-border px-4 py-2' },
  md: { root: 'flex flex-col gap-3 p-4', header: '' },
} as const;

type Variant = keyof typeof VARIANT_CLASSES;
type Padding = keyof typeof PADDING_CLASSES;

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  padding?: Padding;
  /**
   * Card heading. A string is rendered as the standard small uppercase title;
   * any other node is placed in the header as it is.
   */
  title?: React.ReactNode;
  /** Tints a string `title` with the app accent or an effect category colour. */
  accent?: AccentColor;
  /** Controls shown at the end of the header row (buttons, selector chips, ...). */
  action?: React.ReactNode;
  /** Centres the header and the text of the content. */
  isCentered?: boolean;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * Container panel with rounded corners, optionally with a header row made of a `title`
 * and an `action` area.
 *
 * Variants: `solid` (default), `glass` and `pedalboard`. Padding: `none` (default) or `md`.
 */
export function Card({
  children,
  variant = 'solid',
  padding = 'none',
  title,
  accent,
  action,
  isCentered = false,
  className,
  ref,
}: Props) {
  const paddingClasses = PADDING_CLASSES[padding];
  const titleColorClass = accent ? ACCENT_TEXT_CLASSES[accent] : 'text-text-muted';

  const titleContent =
    typeof title === 'string' ? (
      <h2 className={mergeClassNames(SECTION_TITLE_CLASSES, titleColorClass)}>{title}</h2>
    ) : (
      title
    );

  const headerJustifyClass = (() => {
    if (isCentered) return 'justify-center';
    // An action without a title still belongs at the end of the row.
    if (title === undefined) return 'justify-end';
    return 'justify-between';
  })();

  const hasHeader = title !== undefined || action !== undefined;
  const header = hasHeader ? (
    <div
      className={mergeClassNames(
        'flex items-center gap-3',
        headerJustifyClass,
        paddingClasses.header,
      )}
    >
      {titleContent}
      {action}
    </div>
  ) : null;

  return (
    <div
      ref={ref}
      className={mergeClassNames(
        'rounded-xl',
        VARIANT_CLASSES[variant],
        paddingClasses.root,
        isCentered && 'text-center',
        className,
      )}
    >
      {header}
      {children}
    </div>
  );
}
