import type { SVGProps } from 'react';

const base: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  width: 16,
  height: 16,
  'aria-hidden': true
};

type Props = Omit<SVGProps<SVGSVGElement>, 'children'>;

export function ShareIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

export function CopyIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function CheckIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function TrashIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

export function EditIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  );
}

// "Use in Builder" — arrow into a box-ish target.
export function UseIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <polyline points="13 5 20 12 13 19" />
      <line x1="4" y1="12" x2="20" y2="12" />
    </svg>
  );
}

export function ChevronDownIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronUpIcon(props: Props) {
  return (
    <svg {...base} {...props}>
      <polyline points="6 15 12 9 18 15" />
    </svg>
  );
}
